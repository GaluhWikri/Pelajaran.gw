"use client"

import { useEffect, useState } from "react"
import { FileText, CreditCard, Trophy, TrendingUp, Flame, Puzzle, Network } from "lucide-react"
import confetti from "canvas-confetti"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { RecentActivity } from "@/components/recent-activity"
import { ActivityChart } from "@/components/activity-chart"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
export default function DashboardPage() {
  const router = useRouter()
  const { user: storeUser, notes, flashcards, quizzes, mindmaps, addNote, addFlashcard, addQuiz, getActivityStats, clearAll, setUser, sidebarOpen, hasInitialized, showDailyLoginEffect, resetDailyLoginEffect } = useStore()
  const { user, loading: authLoading } = useAuth()
  const stats = getActivityStats()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Trigger confetti if daily login effect is active
  useEffect(() => {
    if (showDailyLoginEffect) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      resetDailyLoginEffect()
    }
  }, [showDailyLoginEffect, resetDailyLoginEffect])

  // Fetch user's data from Supabase when logged in
  useEffect(() => {
    async function fetchUserData() {
      if (authLoading || !useStore.getState().hasInitialized) return

      if (!user) {
        clearAll()
        setIsLoading(false)
        router.push('/login')
        return
      }

      // Wait for store to be hydrated before syncing
      if (!useStore.getState().hasInitialized) return

      setIsLoading(true)

      try {
        // 1. Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        }

        // 2. Fetch Content (Notes, Flashcards, Quizzes) to populate store for Streak Calculation
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Add fetched notes to store (preserves local lastAccessedAt)
        const currentNotes = useStore.getState().notes
        if (notesData) {
          useStore.getState().setNotes(notesData.map((note) => {
            const existingNote = currentNotes.find(n => n.id === note.id);
            let lastAccessedAt = existingNote?.lastAccessedAt
              ? new Date(existingNote.lastAccessedAt)
              : (note.updated_at ? new Date(note.updated_at) : undefined);

            return {
              id: note.id,
              userId: note.user_id,
              title: note.title,
              content: note.content,
              tags: note.tags || [],
              isFavorite: note.is_favorite || false,
              createdAt: new Date(note.created_at),
              updatedAt: new Date(note.updated_at),
              lastAccessedAt: lastAccessedAt
            };
          }))
        } else {
          useStore.getState().setNotes([])
        }

        const { data: flashcardsData } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (flashcardsData) {
          useStore.getState().setFlashcards(flashcardsData.map((card) => ({
            id: card.id,
            noteId: card.note_id,
            userId: card.user_id,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || 'medium',
            nextReview: card.next_review ? new Date(card.next_review) : undefined,
            reviewCount: card.review_count || 0,
            createdAt: new Date(card.created_at),
          })))
        } else {
          useStore.getState().setFlashcards([])
        }

        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (quizzesData) {
          useStore.getState().setQuizzes(quizzesData.map((quiz) => ({
            id: quiz.id,
            noteId: quiz.note_id,
            userId: quiz.user_id,
            title: quiz.title,
            questions: quiz.questions,
            score: quiz.score,
            completedAt: quiz.completed_at ? new Date(quiz.completed_at) : undefined,
            createdAt: new Date(quiz.created_at),
          })))
        } else {
          useStore.getState().setQuizzes([])
        }

        // Fetch mindmaps
        const { data: mindmapsData } = await supabase
          .from('mindmaps')
          .select('*')
          .eq('user_id', user.id)

        if (mindmapsData) {
          useStore.getState().setMindmaps(mindmapsData.map((mindmap) => ({
            id: mindmap.id,
            noteId: mindmap.note_id,
            userId: mindmap.user_id,
            nodes: mindmap.nodes || [],
            createdAt: new Date(mindmap.created_at),
            updatedAt: new Date(mindmap.updated_at),
          })))
        } else {
          useStore.getState().setMindmaps([])
        }

        // 3. LOGIC: Calculate Streak & Daily Login AFTER content is loaded
        if (profileData) {
          // Calculate Streak based on ACTUAL ACTIVITY (not just login)
          // We need to temporarily force the store to update its stats calculation
          const currentActivityStats = useStore.getState().getActivityStats()
          const calculatedStreak = currentActivityStats.streak

          // Daily Login Logic
          const today = new Date()
          const todayStr = today.toLocaleDateString('en-CA')
          let lastLoginDate = profileData.last_login_date || ""
          let currentXP = profileData.current_xp || 0
          let currentLevel = profileData.level || 1

          let updatesToSync: any = {}
          let hasUpdates = false

          // CHECK: Daily Login Reward (Only gives XP, DOES NOT increment streak)
          if (lastLoginDate !== todayStr) {
            console.log('[Dashboard] New daily login! Awarding XP.')
            // Award XP
            currentXP += 10
            updatesToSync.last_login_date = todayStr
            updatesToSync.current_xp = currentXP

            useStore.setState({ showDailyLoginEffect: true })
            hasUpdates = true
          }

          // CHECK: Streak Sync
          // If the calculated activity streak differs from DB, or we just want to ensure it's up to date
          if (calculatedStreak !== profileData.streak) {
            console.log('[Dashboard] Activity Streak updated:', calculatedStreak)
            updatesToSync.streak = calculatedStreak
            hasUpdates = true

            // Optional: 7-Day Streak Bonus Check
            // Only award if it's a NEW milestone reached today
            if (calculatedStreak > 0 && calculatedStreak % 7 === 0 && calculatedStreak > (profileData.streak || 0)) {
              currentXP += 100
              updatesToSync.current_xp = currentXP
              console.log('[Dashboard] 7-Day Streak Bonus Attempted')
            }
          }

          // Calculate Level Up (based on potentially new XP)
          const xpNeeded = currentLevel * 300
          if (currentXP >= xpNeeded) {
            currentLevel += 1
            currentXP -= xpNeeded
            updatesToSync.level = currentLevel
            updatesToSync.current_xp = currentXP
            hasUpdates = true
          }

          // Sync to DB
          if (hasUpdates) {
            await supabase.from('profiles').update({
              ...updatesToSync,
              updated_at: new Date().toISOString()
            }).eq('id', user.id).then(({ error }) => {
              if (error) console.error("Failed to sync updates:", error)
            })
          }

          // Update Local Store User
          setUser({
            id: profileData.id,
            name: profileData.full_name || profileData.email,
            email: profileData.email,
            avatar: profileData.avatar_url,
            isPremium: profileData.is_premium || false,
            level: currentLevel,
            currentXP: currentXP,
            // Use the new login date if updated, else old
            lastLoginDate: updatesToSync.last_login_date || lastLoginDate,
            // Use calculated streak as source of truth
            streak: calculatedStreak
          })
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, addNote, addFlashcard, addQuiz, clearAll, setUser, hasInitialized])

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className={cn("pt-20 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
        <div className="p-8 space-y-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balance">Welcome back, {storeUser?.name || user?.user_metadata?.full_name || user?.email} !</h2>
            <p className="text-muted-foreground">Here's what's happening with your learning today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Level Progress Card - Spans 2 columns on large screens if needed, or just 1 */}
            <div className="col-span-full">
              <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Level {storeUser?.level || 1}</h3>
                    {(() => {
                      const level = storeUser?.level || 1
                      const currentXP = storeUser?.currentXP || 0
                      let title = "Novice Learner"
                      let badgeImg = "/image/badges/novice learner.png"

                      if (level >= 50) {
                        title = "Master Learner"
                        badgeImg = "/image/badges/master learner.png"
                      } else if (level >= 26) {
                        title = "Advanced Scholar"
                        badgeImg = "/image/badges/advanced learner.png"
                      }

                      return (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="flex items-center gap-3 mt-3 cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-lg transition-colors group" title="Click to view badge details">
                              <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                <img src={badgeImg} alt={title} className="w-12 h-12 object-contain drop-shadow-md" />
                              </div>
                              <div className="flex flex-col text-left">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Current Rank</p>
                                <p className="text-base font-bold text-primary">{title}</p>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] text-center bg-background/20 backdrop-blur-md border-white/10 shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-center text-xl">Badge Details</DialogTitle>
                            </DialogHeader>
                            <div className="py-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                              <div className="relative group perspective-1000">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-60 animate-pulse" />
                                <img
                                  src={badgeImg}
                                  alt={title}
                                  className="relative w-48 h-48 object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-110 hover:-rotate-2"
                                />
                              </div>
                              <h3 className="text-3xl font-bold mt-8 text-transparent bg-clip-text bg-linear-to-r from-primary to-orange-500">
                                {title}
                              </h3>
                              <div className="mt-4 space-y-1 text-muted-foreground bg-muted/30 p-4 rounded-xl w-full max-w-[280px]">
                                <div className="flex justify-between text-sm">
                                  <span>Current Level</span>
                                  <span className="font-bold text-foreground">{level}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Total XP</span>
                                  <span className="font-bold text-foreground">{currentXP.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                                  <span>To Next Level</span>
                                  <span className="font-bold text-primary">{(level * 300) - currentXP} XP</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )
                    })()}
                  </div>
                  <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-2 w-full md:w-auto bg-muted/30 md:bg-transparent p-3 md:p-0 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-bold">{storeUser?.currentXP || 0} XP</span>
                      <span className="text-muted-foreground text-sm"> / {(storeUser?.level || 1) * 300} XP</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-xs text-muted-foreground">
                        {((storeUser?.level || 1) * 300) - (storeUser?.currentXP || 0)} XP to next level
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">Total XP :</span>
                        <span className="font-bold text-foreground">
                          {(150 * (storeUser?.level || 1) * ((storeUser?.level || 1) - 1)) + (storeUser?.currentXP || 0)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, ((storeUser?.currentXP || 0) / ((storeUser?.level || 1) * 300)) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-end items-center mt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                        How to level up?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-background/20 backdrop-blur-md border-white/10 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle>Level Up Guide 🚀</DialogTitle>
                        <DialogDescription>
                          Accumulate XP to climb the ranks and unlock new achievements!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-primary">Activities & Rewards</h4>
                          <ul className="space-y-2 text-muted-foreground">
                            <li className="flex justify-between border-b pb-1">
                              <span>📝 Create a Note</span>
                              <span className="font-bold text-foreground">+100 XP</span>
                            </li>
                            <li className="flex justify-between border-b pb-1">
                              <span>🧠 Finish a Quiz</span>
                              <span className="font-bold text-foreground">+20 XP</span>
                            </li>
                            <li className="flex justify-between border-b pb-1">
                              <span>💯 Perfect Quiz Score (100)</span>
                              <span className="font-bold text-foreground">+50 XP</span>
                            </li>
                            <li className="flex justify-between border-b pb-1">
                              <span>📅 Daily Login</span>
                              <span className="font-bold text-foreground">+10 XP</span>
                            </li>
                            <li className="flex justify-between border-b pb-1">
                              <span>🔥 7-Day Streak</span>
                              <span className="font-bold text-foreground">+100 XP</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h4 className="font-semibold text-primary">Ranks</h4>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                              <img src="/image/badges/novice learner.png" className="w-8 h-8 object-contain" />
                              <div>
                                <p className="font-bold text-xs uppercase">Level 1-25</p>
                                <p className="font-medium">Novice Learner</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                              <img src="/image/badges/advanced learner.png" className="w-8 h-8 object-contain" />
                              <div>
                                <p className="font-bold text-xs uppercase">Level 26-49</p>
                                <p className="font-medium">Advanced Scholar</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                              <img src="/image/badges/master learner.png" className="w-8 h-8 object-contain" />
                              <div>
                                <p className="font-bold text-xs uppercase text-primary">Level 50+</p>
                                <p className="font-medium text-primary">Master Learner</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-end">
                        <DialogClose asChild>
                          <Button type="button" variant="default">Got it!</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <StatsCard
              title="Total Notes"
              value={isMounted ? stats.totalNotes : 0}
              icon={FileText}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.notes > 0 ? "+" : "") + stats.trends.notes : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.notes >= 0 : true
              }}
            />
            <StatsCard
              title="Flashcards"
              value={isMounted ? stats.totalFlashcards : 0}
              icon={CreditCard}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.flashcards > 0 ? "+" : "") + stats.trends.flashcards : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.flashcards >= 0 : true
              }}
            />
            <StatsCard
              title="Quizzes Taken"
              value={isMounted ? `${stats.totalQuizzes} / ${stats.totalQuizzesAvailable}` : "0 / 0"}
              icon={Puzzle}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.quizzes > 0 ? "+" : "") + stats.trends.quizzes : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.quizzes >= 0 : true
              }}
            />
            <StatsCard
              title="Mindmaps"
              value={isMounted ? mindmaps.length : 0}
              icon={Network}
              trend={{
                value: "Peta Konsep",
                positive: true
              }}
            />
            <StatsCard
              title="Streak Stats"
              value={
                <div className="flex items-center gap-2">
                  <span>{isMounted ? stats.streak : 0} days</span>
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                </div>
              }
              icon={TrendingUp}
              trend={{
                value: `Best Record: ${isMounted ? stats.longestStreak : 0} days`,
                positive: true
              }}
              className="border-primary/50 bg-primary/5"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ActivityChart />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
