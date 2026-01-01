"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  CreditCard,
  Trophy,
  Save,
  Star,
  Tag,
  MoreVertical,
  Trash2,
  Calendar,
  FileDown,
  BookOpen,
  Loader2,
  Check,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FlashcardsTab } from "@/components/flashcards-tab"
import { QuizTab } from "@/components/quiz-tab"
import { useRouter } from "next/navigation"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { marked } from "marked"
import { saveNoteToSupabase, deleteNoteFromSupabase } from "@/lib/supabase-helpers"
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

interface NoteEditorTabsProps {
  noteId: string
}

export function NoteEditorTabs({ noteId }: NoteEditorTabsProps) {
  const { notes, materials, updateNote, deleteNote, flashcards, quizzes } = useStore()
  const { user } = useAuth()
  const note = notes.find((n) => n.id === noteId)
  const material = note?.materialId ? materials.find((m) => m.id === note.materialId) : null
  const router = useRouter()

  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")


  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  if (!note) return null

  // Auto-save logic
  useEffect(() => {
    const saveData = async () => {
      setSaveStatus('saving')
      try {
        await handleSave()
        setSaveStatus('saved')
      } catch (error) {
        setSaveStatus('error')
      }
    }

    // Only set timer if content matches local state but differs from store
    // (This avoids saving immediately on load if they match)
    if (title === note.title && content === note.content) {
      setSaveStatus('saved')
      return
    }

    const timer = setTimeout(() => {
      saveData()
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, content, note.title, note.content]) // Dependencies ensure we check against latest store state

  const noteFlashcards = flashcards.filter((f) => f.noteId === noteId)
  const noteQuizzes = quizzes.filter((q) => q.noteId === noteId)

  /* =========================
     ACTIONS
  ========================= */

  const handleSave = async () => {
    // Update Supabase first
    if (user && note) {
      const { error } = await saveNoteToSupabase({
        id: noteId,
        userId: user.id,
        title,
        content,
        tags: note.tags,
        isFavorite: note.isFavorite,
      })

      if (error) {
        console.error('Error saving note to Supabase:', error)
        alert('Failed to save note to database')
        return
      }
    }

    // Then update local store
    updateNote(noteId, { title, content })
  }


  const handleDelete = async () => {
    // Delete from Supabase first
    if (user) {
      const { error } = await deleteNoteFromSupabase(noteId)
      if (error) {
        console.error('Failed to delete note from Supabase:', error)
        alert('Gagal menghapus catatan dari database')
        return
      }
    }

    deleteNote(noteId)
    router.push("/notes")
  }

  const handleToggleFavorite = async () => {
    const newFavoriteState = !note.isFavorite

    // Update Supabase first
    if (user && note) {
      const { error } = await saveNoteToSupabase({
        id: noteId,
        userId: user.id,
        title: title, // Use local state to preserve unsaved changes
        content: content, // Use local state to preserve unsaved changes
        tags: note.tags,
        isFavorite: newFavoriteState,
      })

      if (error) {
        console.error('Error updating favorite status in Supabase:', error)
        alert('Failed to update favorite status')
        return
      }
    }

    // Then update local store
    updateNote(noteId, { isFavorite: newFavoriteState })
  }





  /* =========================
     EXPORT PDF (OFF-SCREEN CAPTURE)
     Renders content off-screen (left: -5000px) to prevent UI flash, but ensures it exists in DOM for capture.
  ========================= */
  const handleExportPDF = async () => {
    if (isExporting) return
    setIsExporting(true)

    let container: HTMLElement | null = null

    try {
      // 1. Prepare Data
      const titleText = title || "Untitled Note"
      const dateText = note.createdAt
        ? new Date(note.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        : "Tanggal"
      const tagText = note.tags.length > 0 ? note.tags.join(", ") : ""

      // 2. Convert Markdown to HTML
      const rawHtml = await marked.parse(content || "")

      // 3. Create OFF-SCREEN Container
      // position: absolute + left: -9999px hides it from view but keeps it renderable.
      container = document.createElement("div")
      container.style.cssText = `
        position: absolute; 
        left: -5000px;
        top: 0; 
        width: 210mm; 
        min-height: 297mm;
        padding: 20mm;
        background-color: #ffffff; 
        color: #000000; 
        font-family: 'Times New Roman', Times, serif; 
        z-index: -9999;
      `

      // 4. Inject Content with Styles
      // We use 'page-break-inside: avoid' to prevent cutting text in half.
      container.innerHTML = `
        <style>
          .pdf-root { font-size: 12pt; line-height: 1.5; color: #000; width: 100%; }
          .pdf-root h1 { font-size: 24pt; font-weight: bold; margin-bottom: 0.5em; color: #000; page-break-inside: avoid; break-inside: avoid; }
          .pdf-title { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          .pdf-root h2 { font-size: 18pt; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #000; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root h3 { font-size: 14pt; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.5em; color: #000; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root p { margin-bottom: 1em; text-align: justify; color: #000; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root ul, .pdf-root ol { margin-bottom: 1em; padding-left: 1.5em; color: #000; }
          .pdf-root li { margin-bottom: 0.3em; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root blockquote { border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0; font-style: italic; color: #444; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root pre, .pdf-root code { font-family: 'Courier New', monospace; background-color: #f5f5f5; border-radius: 3px; color: #000; }
          .pdf-root pre { padding: 10px; overflow-x: auto; white-space: pre-wrap; margin-bottom: 1em; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root code { padding: 2px 4px; font-size: 0.9em; }
          .pdf-root img { max-width: 100%; height: auto; display: block; margin: 15px 0; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root table { width: 100%; border-collapse: collapse; margin-bottom: 1em; page-break-inside: avoid; break-inside: avoid; }
          .pdf-root th, .pdf-root td { border: 1px solid #000; padding: 6px 10px; text-align: left; }
          .pdf-root th { background-color: #f0f0f0; font-weight: bold; }
          .pdf-meta { margin-bottom: 30px; color: #666; font-family: Arial, sans-serif; font-size: 10pt; }
        </style>

        <div class="pdf-root">
          <h1 class="pdf-title">${titleText}</h1>
          <div class="pdf-meta">
            <span>📅 ${dateText}</span>
            ${tagText ? `<span> &nbsp;|&nbsp; 🏷️ ${tagText}</span>` : ""}
          </div>
          <div class="content">
            ${rawHtml}
          </div>
        </div>
      `

      document.body.appendChild(container)

      // 5. Apply local style override to container for immediate safety
      const cssVars = [
        "--background", "--foreground", "--card", "--card-foreground",
        "--popover", "--popover-foreground", "--primary", "--primary-foreground",
        "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
        "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
        "--border", "--input", "--ring", "--radius"
      ]
      cssVars.forEach((v) => {
        const val = v.includes("foreground") ? "#000000" : "#ffffff"
        if (v === "--border") container!.style.setProperty(v, "#dddddd")
        else container!.style.setProperty(v, val)
      })

      // 6. Brief delay for DOM paint
      await new Promise(resolve => setTimeout(resolve, 100))

      // 7. Generate PDF
      const html2pdf = (await import("html2pdf.js")).default
      const filename = titleText.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf"

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1200,
          // CRITICAL: Use onclone to sanitize the cloned document environment
          // This fixes the 'lab()' color error and avoids global UI flashing
          onclone: (clonedDoc: Document) => {
            const doc = clonedDoc as Document;
            // Reset root variables in the clone to safe hex values
            cssVars.forEach((v) => {
              const val = v.includes("foreground") ? "#000000" : "#ffffff"
              doc.documentElement.style.setProperty(v, val)
            })
            // Force body colors in clone
            doc.body.style.backgroundColor = "#ffffff"
            doc.body.style.color = "#000000"
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ['css', 'legacy'] }
      }

      // We explicitly select the .pdf-root element inside the container
      const elementToCapture = (container.querySelector(".pdf-root") as HTMLElement) || container

      await html2pdf().set(opt).from(elementToCapture).save()

    } catch (err: any) {
      console.error("Export PDF error:", err)
      alert("Gagal mengunduh PDF: " + (err.message || String(err)))
    } finally {
      // 8. Cleanup
      if (container && document.body.contains(container)) {
        document.body.removeChild(container)
      }
      setIsExporting(false)
    }
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="flex flex-col h-full">
      {/* ================= PRINTABLE AREA ================= */}
      <div className="printable-note border-b border-border bg-card px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4 flex-1">
            <TextareaAutosize
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full resize-none bg-transparent text-4xl font-bold focus:outline-none"
              placeholder="Untitled Note"
              minRows={1}
            />

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    : "Tanggal"}
                </span>
              </div>

              {note.tags
                .filter((t) => t !== "AI Generated")
                .map((tag, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-foreground/80">
                    {index === 0 ? <BookOpen className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                    <span className="capitalize">{tag}</span>
                  </div>
                ))}

              {material && (
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <FileText className="h-4 w-4" />
                  <span className="uppercase">{material.type}</span>
                </div>
              )}


            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              <FileDown className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>

          </div>
        </div>



        {/* ACTIONS */}
        <div className="mt-4 flex justify-end items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Saving...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center text-sm text-green-600 font-medium px-3 py-2">
              <Check className="h-3 w-3 mr-2" />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <Button onClick={handleSave} size="sm" variant="destructive">
              Retry Save
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
            <Star
              className={cn(
                "h-4 w-4",
                note.isFavorite && "fill-primary text-primary"
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteDialog(true)
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col">
        <TabsList className="border-b-0 px-1 mx-6 h-12 w-fit justify-start bg-muted/50 rounded-lg p-1">
          <TabsTrigger value="notes" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary! data-[state=active]:shadow-sm px-4 h-full">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary! data-[state=active]:shadow-sm px-4 h-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Flashcards ({noteFlashcards.length})
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary! data-[state=active]:shadow-sm px-4 h-full">
            <Trophy className="h-4 w-4 mr-2" />
            Quiz ({noteQuizzes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 p-6">
          <RichTextEditor content={content} onChange={setContent} />
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1">
          <FlashcardsTab noteId={noteId} />
        </TabsContent>

        <TabsContent value="quiz" className="flex-1">
          <QuizTab noteId={noteId} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Catatan ini akan dihapus secara permanen beserta semua data terkait:
              <br className="my-2" />
              • Semua flashcard dari catatan ini
              <br />
              • Semua quiz dari catatan ini
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
