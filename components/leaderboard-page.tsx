"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Crown, User, TrendingUp, Search, Flame, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface LeaderboardUser {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    level: number
    total_xp: number
    streak: number
    rank: number
}

// Mock data fallback
const MOCK_LEADERBOARD = [
    { id: "1", full_name: "Sarah Chen", email: "@sarah.c", avatar_url: null, level: 42, total_xp: 12500, streak: 15, rank: 1 },
    { id: "2", full_name: "Michael Park", email: "@mpark", avatar_url: null, level: 38, total_xp: 11200, streak: 45, rank: 2 },
    { id: "3", full_name: "Jessica Wu", email: "@jess_wu", avatar_url: null, level: 35, total_xp: 10100, streak: 8, rank: 3 },
    { id: "4", full_name: "David Kim", email: "@dkim_dev", avatar_url: null, level: 30, total_xp: 8500, streak: 30, rank: 4 },
    { id: "5", full_name: "Alex Johnson", email: "@ajohnson", avatar_url: null, level: 28, total_xp: 7800, streak: 10, rank: 5 },
]

export function LeaderboardPage() {
    const { sidebarOpen, user: storeUser } = useStore() // Use local store user for speed optimization
    const { user } = useAuth()
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<'xp' | 'streak'>('xp')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const ITEMS_PER_PAGE = 10

    const [currentUserStats, setCurrentUserStats] = useState<LeaderboardUser | null>(null)

    const calculateTotalXP = (lvl: number, curr: number) => {
        return (150 * lvl * (lvl - 1)) + curr
    }

    // Fetch Current User Stats & Rank from Snapshot
    useEffect(() => {
        let cancelled = false
        setCurrentUserStats(null)

        async function fetchCurrentUserSnapshot() {
            if (!user) return

            try {
                // Fetch directly from the snapshot view
                // This is extremely fast as rank is pre-calculated
                const { data: snapshot, error } = await supabase
                    .from('leaderboard_snapshot')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (cancelled) return

                if (error || !snapshot) {
                    // FALLBACK: User might be new and not in the snapshot yet.
                    // Fetch real-time data from 'profiles' table.
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (cancelled) return

                    if (!profileError && profile) {
                        setCurrentUserStats({
                            id: profile.id,
                            full_name: profile.full_name || profile.email?.split('@')[0] || "Anonymous",
                            email: profile.email || "",
                            avatar_url: profile.avatar_url,
                            level: profile.level || 1,
                            total_xp: calculateTotalXP(profile.level || 1, profile.current_xp || 0),
                            streak: profile.streak || 0,
                            rank: 0 // 0 = Unranked / Pending Update
                        })
                        return
                    }

                    // If even profile fetch fails, do nothing
                    console.warn("Snapshot and Profile fetch failed", error, profileError)
                    return
                }

                setCurrentUserStats({
                    id: snapshot.id,
                    full_name: snapshot.full_name || snapshot.email?.split('@')[0] || "Anonymous",
                    email: snapshot.email || "",
                    avatar_url: snapshot.avatar_url,
                    level: snapshot.level,
                    total_xp: calculateTotalXP(snapshot.level, snapshot.current_xp),
                    streak: snapshot.streak,
                    rank: sortBy === 'streak' ? snapshot.rank_streak : snapshot.rank_xp
                })

            } catch (err) {
                if (!cancelled) console.error("Error fetching user snapshot", err)
            }
        }

        fetchCurrentUserSnapshot()

        return () => {
            cancelled = true
        }
    }, [user, sortBy, storeUser])

    useEffect(() => {
        const handler = setTimeout(() => {
            // Debounce logic could go here
        }, 500)
        return () => clearTimeout(handler)
    }, [searchQuery])

    useEffect(() => {
        let cancelled = false

        async function fetchLeaderboard() {
            try {

                let data, error, count

                const from = (page - 1) * ITEMS_PER_PAGE
                const to = from + ITEMS_PER_PAGE - 1

                try {
                    // Query the snapshot view
                    let query = supabase
                        .from('leaderboard_snapshot')
                        .select('*', { count: 'exact' })

                    // Search filter
                    if (searchQuery) {
                        query = query.ilike('full_name', `%${searchQuery}%`)
                    }

                    // Sort by pre-calculated rank
                    if (sortBy === 'streak') {
                        query = query.order('rank_streak', { ascending: true })
                    } else {
                        query = query.order('rank_xp', { ascending: true })
                    }

                    const result = await query.range(from, to)
                    if (cancelled) return

                    data = result.data
                    error = result.error
                    count = result.count

                    if (error) throw error
                } catch (err) {
                    if (cancelled) return
                    console.error("Snapshot query error", err)
                    throw err
                }

                if (cancelled) return
                if (count !== null) setTotalCount(count) // Remove manual capping if we want full list, or keep 50. Let's keep data real.

                if (data) {
                    const rankedUsers = data.map((u: any) => ({ // Cast to any for direct property access
                        id: u.id,
                        full_name: u.full_name || u.email?.split('@')[0] || "Anonymous",
                        email: u.email || "",
                        avatar_url: u.avatar_url,
                        level: u.level,
                        total_xp: calculateTotalXP(u.level, u.current_xp),
                        streak: u.streak,
                        // Use the explicit rank from DB
                        rank: sortBy === 'streak' ? u.rank_streak : u.rank_xp
                    }))
                    setUsers(rankedUsers)
                } else {
                    setUsers([])
                }
            } catch (err) {
                if (cancelled) return
                console.error("Failed to fetch leaderboard", err)
                setUsers([])
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchLeaderboard()

        return () => {
            cancelled = true
        }
    }, [sortBy, page, searchQuery]) // Added searchQuery dependency to allow server-side filtering

    // Filter handled server-side now
    const filteredUsers = users

    // Use our independently fetched stats
    const displayUserStats = currentUserStats

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
            case 2:
                return <Medal className="h-6 w-6 text-slate-400 fill-slate-400/20" />
            case 3:
                return <Medal className="h-6 w-6 text-amber-700 fill-amber-700/20" />
            default:
                return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>
        }
    }

    const getRankBorderColor = (rank: number) => {
        switch (rank) {
            case 1: return "border-yellow-500"
            case 2: return "border-slate-400"
            case 3: return "border-amber-700"
            default: return "border-transparent"
        }
    }

    const getBadgeInfo = (level: number) => {
        if (level >= 50) return { img: "/image/badges/master learner.png", title: "Master Learner" }
        if (level >= 26) return { img: "/image/badges/advanced learner.png", title: "Advanced Scholar" }
        return { img: "/image/badges/novice learner.png", title: "Novice Learner" }
    }

    // Modern Pagination Logic
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const generatePaginationItems = () => {
        const items = []
        const maxVisiblePages = 5 // Adjust this for mobile vs desktop if needed

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(i)
            }
        } else {
            // Complex pagination logic with ellipses
            if (page <= 3) {
                items.push(1, 2, 3, '...', totalPages)
            } else if (page >= totalPages - 2) {
                items.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
            } else {
                items.push(1, '...', page - 1, page, page + 1, '...', totalPages)
            }
        }
        return items
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <Sidebar />

            <main className={cn("pt-28 pb-10 px-4 md:px-8 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="text-center space-y-2 mb-6">
                        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl bg-clip-text text-transparent bg-linear-to-r from-primary to-orange-600">
                            Global Leaderboard
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Compete with other learners via XP or Daily Streaks!
                        </p>
                    </div>

                    {/* Sort Options */}
                    <div className="flex justify-center mb-6 px-2">
                        <Tabs value={sortBy} onValueChange={(v) => {
                            setSortBy(v as 'xp' | 'streak')
                            setPage(1)
                            setTotalCount(0)
                        }} className="w-full max-w-[400px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="xp" className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" />
                                    Total XP
                                </TabsTrigger>
                                <TabsTrigger value="streak" className="flex items-center gap-2">
                                    <Flame className={cn("h-4 w-4", sortBy === 'streak' ? "text-orange-500" : "")} />
                                    Top Streak
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Current User Stats */}
                    {!displayUserStats ? (
                        <Card className="border-primary/50 bg-primary/5 animate-pulse">
                            <CardContent className="flex items-center justify-between p-3 md:p-6 opacity-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-muted" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-muted rounded" />
                                        <div className="h-3 w-24 bg-muted rounded" />
                                    </div>
                                </div>
                                <div className="h-8 w-16 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-primary/50 bg-primary/5">
                            <CardContent className="flex items-center justify-between p-3 md:p-6">
                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                    <div className="flex flex-col items-center justify-center min-w-12">
                                        <span className="text-[10px] md:text-xs font-semibold uppercase text-muted-foreground">Your Rank</span>
                                        <span className="text-xl md:text-2xl font-bold text-primary">
                                            {displayUserStats.rank > 0 ? `#${displayUserStats.rank}` : "NEW"}
                                        </span>
                                    </div>
                                    <Avatar className={cn(
                                        "h-10 w-10 md:h-12 md:w-12 border-2 shrink-0",
                                        displayUserStats.rank > 0 && displayUserStats.rank <= 3 ? getRankBorderColor(displayUserStats.rank) : "border-primary"
                                    )}>
                                        <AvatarImage src={displayUserStats.avatar_url || ""} />
                                        <AvatarFallback>{(storeUser?.name || displayUserStats.full_name).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <p className="font-bold text-base md:text-lg truncate">{storeUser?.name || displayUserStats.full_name}</p>
                                            <img
                                                src={getBadgeInfo(displayUserStats.level).img}
                                                alt={getBadgeInfo(displayUserStats.level).title}
                                                className="h-4 w-4 md:h-6 md:w-6 object-contain shrink-0"
                                                title={getBadgeInfo(displayUserStats.level).title}
                                            />
                                        </div>
                                        <p className="text-[10px] md:text-sm text-muted-foreground truncate">Lvl {displayUserStats.level} • {getBadgeInfo(displayUserStats.level).title}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 pl-2">
                                    {sortBy === 'xp' ? (
                                        <>
                                            <p className="text-lg md:text-2xl font-bold">{displayUserStats.total_xp.toLocaleString()}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Total XP</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-end gap-1">
                                                <Flame className="h-4 w-4 md:h-6 md:w-6 text-orange-500 fill-orange-500" />
                                                <p className="text-lg md:text-2xl font-bold">{displayUserStats.streak} Days</p>
                                            </div>
                                            <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Active Streak</p>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Search & Filter */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search learners on this page..."
                            className="pl-10 bg-card"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* User List */}
                    <Card className="overflow-hidden border shadow-lg p-0 gap-0">
                        <CardHeader className="p-6 border-b">
                            <div className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    {sortBy === 'xp' ? <Trophy className="h-5 w-5 text-primary" /> : <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />}
                                    {sortBy === 'xp' ? "Top XP Earners" : "Longest Streaks"}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1 rounded-full border">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Updates realtime
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative">
                            {loading && users.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">Loading leaderboard...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No learners found on this page.</div>
                            ) : (
                                <div className="divide-y">
                                    {filteredUsers.map((u) => {
                                        const badge = getBadgeInfo(u.level)
                                        return (
                                            <div
                                                key={u.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 md:p-4 transition-all border rounded-xl mb-2",
                                                    u.rank === 1 ? "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20" :
                                                        u.rank === 2 ? "bg-slate-400/10 border-slate-400/30 hover:bg-slate-400/20" :
                                                            u.rank === 3 ? "bg-amber-700/10 border-amber-700/30 hover:bg-amber-700/20" :
                                                                user?.id === u.id ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "hover:bg-muted/50 border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
                                                    <div className="flex items-center justify-center w-6 md:w-8 shrink-0">
                                                        {getRankIcon(u.rank)}
                                                    </div>

                                                    <Avatar className={cn(
                                                        "h-9 w-9 md:h-12 md:w-12 border-2 shrink-0",
                                                        getRankBorderColor(u.rank)
                                                    )}>
                                                        <AvatarImage src={u.avatar_url || ""} />
                                                        <AvatarFallback>{u.full_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>

                                                    <div className="space-y-0.5 md:space-y-1 overflow-hidden">
                                                        <div className="flex items-center gap-1.5 md:gap-2">
                                                            <p className="font-semibold text-sm md:text-lg truncate">{u.full_name}</p>
                                                            {user?.id === u.id && <Badge variant="secondary" className="text-[10px] h-4 md:h-5 px-1">You</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="h-3 w-3" />
                                                                Lvl {u.level}
                                                            </span>
                                                            <span className="hidden sm:flex items-center gap-1 border-l pl-2 border-border/50" title={badge.title}>
                                                                <img src={badge.img} alt={badge.title} className="h-4 w-4 object-contain" />
                                                                <span>{badge.title}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end justify-center shrink-0 pl-2">
                                                    {sortBy === 'xp' ? (
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-mono font-bold text-base md:text-xl text-primary">
                                                                {u.total_xp.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">XP</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <Flame className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500 fill-orange-500" />
                                                            <span className="font-mono font-bold text-base md:text-xl text-foreground">
                                                                {u.streak}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Days</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Minimalist Pagination */}
                    {!loading && totalCount > ITEMS_PER_PAGE && (
                        <div className="flex flex-col items-center justify-center gap-3 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-full border-muted-foreground/20 hover:bg-muted/50 hover:text-primary transition-colors"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    title="Previous"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1 mx-2">
                                    {generatePaginationItems().map((item, idx) => (
                                        typeof item === 'number' ? (
                                            <Button
                                                key={idx}
                                                variant={page === item ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setPage(item)}
                                                className={cn(
                                                    "h-9 w-9 rounded-full p-0 font-medium text-sm transition-all",
                                                    page === item
                                                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                {item}
                                            </Button>
                                        ) : (
                                            <div key={idx} className="flex items-center justify-center w-9 h-9 text-muted-foreground/50">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </div>
                                        )
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-full border-muted-foreground/20 hover:bg-muted/50 hover:text-primary transition-colors"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    title="Next"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground/60 font-medium">
                                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
