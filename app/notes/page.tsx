"use client"

import { Plus, Search, Star, Tag, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NotesPage() {
  const { notes, addNote, deleteNote } = useStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const router = useRouter()

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const createNewNote = () => {
    router.push("/upload")
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className="lg:pl-64 pt-16">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance">All Notes</h2>
              <p className="text-muted-foreground">Manage and organize your learning notes</p>
            </div>
            <Button onClick={createNewNote} className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => router.push(`/notes/${note.id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {note.isFavorite && <Star className="h-4 w-4 fill-primary text-primary shrink-0" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteNoteId(note.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.content.replace(/#{1,6}\s/g, "").substring(0, 150)}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs font-medium"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-xs font-medium">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteNoteId) {
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
