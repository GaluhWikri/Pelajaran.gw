"use client"

import type React from "react"
import { useState } from "react"
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

interface NoteEditorTabsProps {
  noteId: string
}

export function NoteEditorTabs({ noteId }: NoteEditorTabsProps) {
  const { notes, materials, updateNote, deleteNote, flashcards, quizzes } = useStore()
  const note = notes.find((n) => n.id === noteId)
  const material = note?.materialId ? materials.find((m) => m.id === note.materialId) : null
  const router = useRouter()

  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")


  const [isExporting, setIsExporting] = useState(false)

  if (!note) return null

  const noteFlashcards = flashcards.filter((f) => f.noteId === noteId)
  const noteQuizzes = quizzes.filter((q) => q.noteId === noteId)

  /* =========================
     ACTIONS
  ========================= */

  const handleSave = () => {
    updateNote(noteId, { title, content })
  }

  const handleDelete = () => {
    deleteNote(noteId)
    router.push("/notes")
  }

  const handleToggleFavorite = () => {
    updateNote(noteId, { isFavorite: !note.isFavorite })
  }



  /* =========================
     EXPORT PDF (OFF-SCREEN CAPTURE)
     Renders content off-screen (left: -5000px) to prevent UI flash, but ensures it exists in DOM for capture.
  ========================= */
  const handleExportPDF = async () => {
    if (isExporting) return
    setIsExporting(true)

    // We will track the variables we overwrite to restore them later
    const cssVars = [
      "--background", "--foreground", "--card", "--card-foreground",
      "--popover", "--popover-foreground", "--primary", "--primary-foreground",
      "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
      "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
      "--border", "--input", "--ring", "--radius"
    ]
    const previousValues: Record<string, string> = {}
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
      container.innerHTML = `
        <style>
          .pdf-root { font-size: 12pt; line-height: 1.5; color: #000; width: 100%; }
          .pdf-root h1 { font-size: 24pt; font-weight: bold; margin-bottom: 0.5em; border-bottom: 2px solid black; padding-bottom: 10px; color: #000; }
          .pdf-root h2 { font-size: 18pt; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #000; }
          .pdf-root h3 { font-size: 14pt; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.5em; color: #000; }
          .pdf-root p { margin-bottom: 1em; text-align: justify; color: #000; }
          .pdf-root ul, .pdf-root ol { margin-bottom: 1em; padding-left: 1.5em; color: #000; }
          .pdf-root li { margin-bottom: 0.3em; }
          .pdf-root blockquote { border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0; font-style: italic; color: #444; }
          .pdf-root pre, .pdf-root code { font-family: 'Courier New', monospace; background-color: #f5f5f5; border-radius: 3px; color: #000; }
          .pdf-root pre { padding: 10px; overflow-x: auto; white-space: pre-wrap; margin-bottom: 1em; }
          .pdf-root code { padding: 2px 4px; font-size: 0.9em; }
          .pdf-root img { max-width: 100%; height: auto; display: block; margin: 15px 0; }
          .pdf-root table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
          .pdf-root th, .pdf-root td { border: 1px solid #000; padding: 6px 10px; text-align: left; }
          .pdf-root th { background-color: #f0f0f0; font-weight: bold; }
          .pdf-meta { margin-bottom: 30px; color: #666; font-family: Arial, sans-serif; font-size: 10pt; }
        </style>

        <div class="pdf-root">
          <h1>${titleText}</h1>
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

      // 5. CRITICAL FIX: Overwrite global CSS variables
      const root = document.documentElement
      cssVars.forEach((v) => {
        previousValues[v] = root.style.getPropertyValue(v)
        if (v.includes("background")) root.style.setProperty(v, "#ffffff")
        else if (v.includes("foreground")) root.style.setProperty(v, "#000000")
        else root.style.setProperty(v, "#dddddd")
      })

      // 6. Brief delay for DOM paint (invisible to user)
      await new Promise(resolve => setTimeout(resolve, 100))

      // 7. Generate PDF
      const html2pdf = (await import("html2pdf.js")).default
      const filename = titleText.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf"

      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1200 // Force explicit width for off-screen render
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const }
      }

      // We explicitly select the .pdf-root element inside the container
      const elementToCapture = container.querySelector(".pdf-root") || container

      await html2pdf().set(opt).from(elementToCapture).save()

    } catch (err: any) {
      console.error("Export PDF error:", err)
      alert("Gagal mengunduh PDF: " + (err.message || String(err)))
    } finally {
      // 8. Cleanup
      const root = document.documentElement
      cssVars.forEach((v) => {
        if (previousValues[v]) {
          root.style.setProperty(v, previousValues[v])
        } else {
          root.style.removeProperty(v)
        }
      })

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

              {note.tags[0] && (
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <BookOpen className="h-4 w-4" />
                  <span className="capitalize">{note.tags[0]}</span>
                </div>
              )}

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
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
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
                onClick={handleDelete}
                className="text-destructive"
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
        <TabsList className="border-b px-6 h-12">
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <CreditCard className="h-4 w-4 mr-2" />
            Flashcards ({noteFlashcards.length})
          </TabsTrigger>
          <TabsTrigger value="quiz">
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
    </div>
  )
}
