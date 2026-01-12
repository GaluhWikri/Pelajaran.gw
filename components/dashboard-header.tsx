"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { PanelLeft, Search, Settings, User, FileText, CreditCard, Trophy, LogIn, UserPlus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"

export function DashboardHeader() {
  const { user: storeUser, toggleSidebar, notes, flashcards, quizzes } = useStore()
  const { user: authUser, loading, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFlashcards = flashcards.filter((card) =>
    card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasResults =
    (filteredNotes.length > 0 || filteredFlashcards.length > 0 || filteredQuizzes.length > 0) &&
    searchQuery.length > 0

  const handleNavigate = (path: string) => {
    setShowResults(false)
    setSearchQuery("")
    router.push(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="flex items-center gap-4 px-4 py-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <Image
            src="/favicon/android-chrome-192x192.png"
            alt="Pelajaran.gw Logo"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
          <h1 className="text-xl font-bold">
            Pelajaran<span className="text-primary">.gw</span>
          </h1>
        </div>

        <div className="hidden md:block flex-1 max-w-xl mx-auto">
          <div className="relative" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes, flashcards, quizzes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
            />

            {showResults && searchQuery && (
              <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden">
                {!hasResults ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                    {filteredNotes.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Notes
                        </div>
                        {filteredNotes.slice(0, 5).map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => handleNavigate(`/notes/${note.id}`)}
                          >
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{note.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredFlashcards.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Flashcards
                        </div>
                        {filteredFlashcards.slice(0, 5).map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => handleNavigate(`/notes/${card.noteId}`)}
                          >
                            <CreditCard className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="truncate">{card.question}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredQuizzes.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Quizzes
                        </div>
                        {filteredQuizzes.slice(0, 5).map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => handleNavigate(`/notes/${quiz.noteId}`)}
                          >
                            <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                            <span className="truncate">{quiz.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {loading ? (
            // Show login/register buttons while loading
            <>
              <Link href="/login">
                <Button variant="ghost" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </Link>
            </>
          ) : authUser ? (
            <>


              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(storeUser?.name?.[0] || authUser?.user_metadata?.full_name?.[0] || authUser?.email?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm">
                      {storeUser?.name || authUser?.user_metadata?.full_name || authUser?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    {storeUser?.isPremium ? (
                      <span className="text-primary">Premium Account</span>
                    ) : (
                      <span>Upgrade to Premium</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onClick={async () => {
                      await signOut()
                      router.push('/login')
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
