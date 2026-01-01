"use client"

import { Plus, Search, Star, Tag, Trash2, LayoutGrid, List, Loader2, X, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { deleteNoteFromSupabase, saveNoteToSupabase } from "@/lib/supabase-helpers"
import { useAuth } from "@/lib/auth-context"
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
import { cn } from "@/lib/utils"

export default function NotesPage() {
  const { notes, addNote, deleteNote, updateNote, sidebarOpen, activeUploads, removeActiveUpload } = useStore()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFavorites = searchParams.get("filter") === "favorites"

  // Mount detection
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (isMounted) {
      console.log('Notes Page - Active Uploads:', activeUploads)
    }
  }, [isMounted, activeUploads])

  const filteredNotes = notes.filter(
    (note) =>
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (!isFavorites || note.isFavorite),
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const createNewNote = () => {
    router.push("/upload")
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className={cn("pt-14 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance">
                {isFavorites ? "Favorite Notes" : "All Notes"}
              </h2>
              <p className="text-muted-foreground">Manage and organize your learning notes</p>
            </div>
            <Button onClick={createNewNote} className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex bg-muted/50 rounded-lg p-1 border shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 rounded-md hover:bg-background/50", viewMode === 'grid' && "bg-background shadow-sm text-primary")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 rounded-md hover:bg-background/50", viewMode === 'list' && "bg-background shadow-sm text-primary")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            )}>
            <AnimatePresence mode="wait">
              {/* Active Uploads / Processing Items - Only show on All Notes, not on Favorites */}
              {isMounted && !isFavorites && activeUploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(viewMode === "grid" ? "col-span-1" : "w-full")}
                >
                  <Card className={cn(
                    "bg-muted/20 h-full border-l-4 transition-all duration-500",
                    upload.status === 'complete' ? "border-l-green-500 bg-green-500/10" :
                      upload.status === 'error' ? "border-l-red-500 bg-red-500/10" :
                        "border-l-blue-500",
                    viewMode === "list" && "flex flex-row items-center"
                  )}>
                    <CardContent className={cn("p-6 w-full", viewMode === "list" && "p-4 flex items-center justify-between gap-4")}>
                      <div className={cn("flex items-center gap-4 w-full", viewMode === "list" && "justify-start")}>
                        {/* Icon */}
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          upload.status === 'complete' ? "bg-green-500/20" :
                            upload.status === 'error' ? "bg-red-500/20" :
                              "bg-blue-500/10"
                        )}>
                          {upload.status === 'complete' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 animate-in zoom-in spin-in-90 duration-300" />
                          ) : upload.status === 'error' ? (
                            <X className="h-5 w-5 text-red-600" />
                          ) : (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className={cn("font-medium text-foreground/90 truncate", viewMode === "list" ? "text-base" : "text-sm")}>
                              {upload.fileName}
                            </h3>
                            {upload.status === 'error' || upload.status === 'complete' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); removeActiveUpload(upload.id); }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                            )}
                          </div>
                          {upload.status !== 'error' && upload.status !== 'complete' && (
                            <Progress value={upload.progress} className="h-1" />
                          )}
                          <p className={cn(
                            "text-xs",
                            upload.status === 'complete' ? "text-green-600 font-medium" :
                              upload.status === 'error' ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {upload.status === 'uploading' ? 'Mengupload...' :
                              upload.status === 'processing' ? 'Memproses AI...' :
                                upload.status === 'complete' ? 'Selesai!' :
                                  'Gagal.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredNotes.map((note) => {
                // Filter tags to ensure we don't count empty strings or hidden tags
                const validTags = (note.tags || []).filter(tag =>
                  tag &&
                  tag.trim().length > 0 &&
                  tag !== "AI Generated"
                )

                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        "hover:border-primary/50 transition-all cursor-pointer group h-full",
                        viewMode === "list" && "flex flex-row items-center border-l-4 border-l-primary/20"
                      )}
                      onClick={() => router.push(`/notes/${note.id}`)}
                    >
                      <CardContent className={cn("p-6 w-full", viewMode === "list" && "p-4 flex items-center justify-between gap-4")}>
                        <div className={cn("space-y-3", viewMode === "list" && "space-y-1 flex-1")}>
                          <div className="flex items-start justify-between">
                            <h3 className={cn("font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors", viewMode === "list" && "text-base")}>
                              {note.title}
                            </h3>
                            {viewMode === "grid" && (
                              <div className="flex items-center gap-2">
                                {/* Actions in Grid Mode */}
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={async (e) => {
                                  e.stopPropagation(); const newFav = !note.isFavorite;
                                  if (user) await saveNoteToSupabase({ ...note, isFavorite: newFav });
                                  updateNote(note.id, { isFavorite: newFav });
                                }}>
                                  <Star className={cn("h-4 w-4", note.isFavorite ? "fill-primary text-primary" : "text-muted-foreground/30")} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => {
                                  e.stopPropagation(); setDeleteNoteId(note.id);
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <p className={cn("text-sm text-muted-foreground", viewMode === "grid" ? "line-clamp-3" : "line-clamp-1")}>
                            {note.content.replace(/<[^>]+>/g, "").substring(0, 150)}
                          </p>

                          <div className={cn("flex items-center justify-between pt-2", viewMode === "list" && "pt-1")}>
                            <div className="flex flex-wrap gap-1">
                              {validTags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs font-medium"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                              {validTags.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-xs font-medium">
                                  +{validTags.length - 2}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {viewMode === "list" && (
                          <div className="flex items-center gap-2 border-l pl-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async (e) => {
                              e.stopPropagation(); const newFav = !note.isFavorite;
                              if (user) await saveNoteToSupabase({ ...note, isFavorite: newFav });
                              updateNote(note.id, { isFavorite: newFav });
                            }}>
                              <Star className={cn("h-4 w-4", note.isFavorite ? "fill-primary text-primary" : "text-muted-foreground/30")} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => {
                              e.stopPropagation(); setDeleteNoteId(note.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No notes found matching your search" : "No notes yet. Create your first note!"}
              </p>
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This action cannot be undone. This will permanently delete your note and all related data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All flashcards from this note</li>
                  <li>All quizzes from this note</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deleteNoteId) {
                  // Delete from Supabase first (will cascade delete flashcards & quizzes)
                  if (user) {
                    const { error } = await deleteNoteFromSupabase(deleteNoteId)
                    if (error) {
                      console.error('Error deleting note from Supabase:', error)
                      alert('Failed to delete note from database')
                    }
                  }

                  // Then delete from local store
                  deleteNote(deleteNoteId)
                  setDeleteNoteId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
