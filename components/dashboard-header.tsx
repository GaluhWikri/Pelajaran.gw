"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Bell, Settings, User, FileText, CreditCard, Trophy } from "lucide-react"
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

export function DashboardHeader() {
  const { user, toggleSidebar, notes, flashcards, quizzes } = useStore()
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
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">P</span>
          </div>
          <h1 className="text-xl font-bold">
            Pelajaran<span className="text-primary">.gw</span>
          </h1>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
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
                  <div className="max-h-[300px] overflow-y-auto py-2">
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {user?.isPremium ? (
                  <span className="text-primary">Premium Account</span>
                ) : (
                  <span>Upgrade to Premium</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
