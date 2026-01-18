"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import {
  Home,
  FileText,
  Upload,
  Star,
  Trash2,
  MoreVertical,
  Crown,
  Search,
  CreditCard,
  Trophy,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  deleteNoteFromSupabase,
  saveNoteToSupabase,
} from "@/lib/supabase-helpers"

const navigation = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "All Notes", icon: FileText, href: "/notes" },
  { name: "Favorites", icon: Star, href: "/notes?filter=favorites" },
  { name: "Upload Material", icon: Upload, href: "/upload" },
  { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
]

function SidebarContent() {
  const { sidebarOpen, notes, updateNote, deleteNote, toggleSidebar } = useStore()
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Mobile Search State
  const { quizzes, flashcards } = useStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFlashcards = flashcards.filter((card) =>
    card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasResults = filteredNotes.length > 0 || filteredQuizzes.length > 0 || filteredFlashcards.length > 0

  const handleMobileNav = () => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar()
    }
  }

  const handleNavigate = (path: string) => {
    router.push(path)
    setSearchQuery("") // Clear search after navigation
    handleMobileNav()
  }

  useEffect(() => setMounted(true), [])

  const sortedNotes = [...notes].sort((a, b) => {
    const aTime = Math.max(
      new Date(a.updatedAt).getTime(),
      a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
    )
    const bTime = Math.max(
      new Date(b.updatedAt).getTime(),
      b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
    )
    return bTime - aTime
  })

  const toggleFavorite = async (e: React.MouseEvent, note: any) => {
    e.preventDefault()
    e.stopPropagation()

    const value = !note.isFavorite

    if (user) {
      await saveNoteToSupabase({
        id: note.id,
        userId: user.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isFavorite: value,
      })
    }

    updateNote(note.id, { isFavorite: value })
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    if (user) {
      await deleteNoteFromSupabase(deleteId)
    }

    deleteNote(deleteId)
    setDeleteId(null)
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-card transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64 translate-x-0" : "w-[70px] -translate-x-full lg:translate-x-0 lg:w-[70px]"
        )}
      >
        {/* Scrollable Content (Navigation + Recent Notes) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Mobile Search - Visible only on mobile and when sidebar is open */}
          <div className={cn("px-4 pt-8 md:hidden", !sidebarOpen && "hidden")}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search Results in Sidebar */}
            {searchQuery && (
              <div className="mt-2 space-y-4">
                {!hasResults ? (
                  <div className="text-xs text-center text-muted-foreground py-2">No results.</div>
                ) : (
                  <>
                    {filteredNotes.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">Notes</div>
                        {filteredNotes.slice(0, 3).map(note => (
                          <div key={note.id} onClick={() => handleNavigate(`/notes/${note.id}`)} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer truncate">
                            <FileText className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{note.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredQuizzes.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">Quizzes</div>
                        {filteredQuizzes.slice(0, 3).map(quiz => (
                          <div key={quiz.id} onClick={() => handleNavigate(`/notes/${quiz.noteId}`)} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer truncate">
                            <Trophy className="h-3 w-3 text-yellow-500 shrink-0" />
                            <span className="truncate">{quiz.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredFlashcards.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">Flashcards</div>
                        {filteredFlashcards.slice(0, 3).map(card => (
                          <div key={card.id} onClick={() => handleNavigate(`/notes/${card.noteId}`)} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer truncate">
                            <CreditCard className="h-3 w-3 text-orange-500 shrink-0" />
                            <span className="truncate">{card.question}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="h-px bg-border my-2" />
              </div>
            )}
          </div>

          {/* Navigation - Sticky */}
          <div className="sticky top-0 z-10 bg-card px-4 pt-6 pb-2">
            <h3 className={cn(
              "mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground transition-opacity duration-300",
              !sidebarOpen && "lg:opacity-0 lg:hidden"
            )}>
              Navigation
            </h3>
            <nav className="space-y-1">
              {navigation.map((item) => {
                let isActive = pathname === item.href

                if (item.href === "/notes?filter=favorites") {
                  isActive = pathname === "/notes" && searchParams.get("filter") === "favorites"
                } else if (item.href === "/notes") {
                  isActive = pathname === "/notes" && !searchParams.get("filter")
                }

                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-accent text-accent-foreground font-medium",
                      !sidebarOpen && "lg:justify-center lg:px-2"
                    )}
                    asChild
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Link href={item.href} onClick={handleMobileNav}>
                      <item.icon className="h-4 w-4" />
                      <span className={cn(
                        "transition-all duration-300",
                        !sidebarOpen && "lg:hidden lg:opacity-0 lg:w-0"
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </div>

          {/* Recent Notes */}
          <div className={cn(!sidebarOpen && "lg:hidden", "px-4 pb-6")}>
            <div className="flex items-center justify-between px-2 mb-2 mt-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Recent Notes
              </h3>
              <span className="text-xs text-muted-foreground">
                {mounted ? notes.length : "-"}
              </span>
            </div>

            <div className="space-y-1">
              {mounted &&
                sortedNotes.map((note) => {
                  const isActive = pathname === `/notes/${note.id}`
                  return (
                    <div
                      key={note.id}
                      className={cn(
                        "group relative flex items-center w-full rounded-md transition-colors",
                        isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Link
                        href={`/notes/${note.id}`}
                        className={cn(
                          "flex-1 min-w-0 py-2 pl-3 pr-10 text-sm truncate font-medium transition-colors",
                          isActive
                            ? "text-accent-foreground"
                            : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                        title={note.title || "Untitled Note"}
                      >
                        {(note.title || "Untitled Note").length > 24
                          ? (note.title || "Untitled Note").slice(0, 24) + "..."
                          : note.title || "Untitled Note"}
                      </Link>

                      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => toggleFavorite(e, note)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  note.isFavorite
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-muted-foreground"
                                )}
                              />
                              <span>{note.isFavorite ? "Unfavorite" : "Favorite"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault() // prevent closing menu immediately if needed
                                setDeleteId(note.id)
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}

              {mounted && notes.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No notes yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Premium CTA */}
        <div className="border-t p-4">
          <Button
            variant="default"
            className={cn(
              "w-full justify-start gap-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
            asChild
            title={!sidebarOpen ? "Upgrade to Premium" : undefined}
          >
            <Link href="/premium" onClick={handleMobileNav}>
              <Crown className="h-4 w-4 shrink-0" />
              <span className={cn(
                "transition-all duration-300 font-semibold whitespace-nowrap overflow-hidden",
                !sidebarOpen && "lg:hidden lg:opacity-0 lg:w-0"
              )}>
                Upgrade Premium
              </span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={toggleSidebar}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-[70px] border-r bg-card" />}>
      <SidebarContent />
    </Suspense>
  )
}
