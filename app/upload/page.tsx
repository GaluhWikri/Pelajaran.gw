"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileText, Video, Mic, Youtube, Plus, Search, Tag, Star, Trash2, X } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { generateLearningContent } from "@/lib/ai-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
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

interface UploadedFile {
  file: File
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
}

type ModalType = "file" | "youtube" | "audio" | "video" | null

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const { addMaterial, addNote, addQuiz, addFlashcard, notes, deleteNote } = useStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)


  // Configuration State
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [config, setConfig] = useState({
    subject: "",
    understandingLevel: 50,
    writingStyle: "relaxed"
  })

  // Filter notes for "Catatan Anda" section
  const userNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleCardClick = (type: ModalType) => {
    setActiveModal(type)
    setYoutubeUrl("") // Reset for youtube
  }

  // --- File Handling (for File, Audio, Video modals) ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Ideally filter based on activeModal type here, but allowing generally for now
      handleFileSelection(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files))
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      // Construct accept string based on activeModal
      let accept = "*"
      if (activeModal === 'file') accept = ".pdf,.docx,.doc,.pptx,.ppt,.txt,.xls,.xlsx"
      if (activeModal === 'audio') accept = ".mp3,.wav,.m4a"
      if (activeModal === 'video') accept = ".mp4,.avi,.mov,.mkv"
      if (activeModal === 'youtube') accept = "" // Not used

      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

  const handleFileSelection = (fileList: File[]) => {
    setPendingFiles(fileList)
    setActiveModal(null) // Close the first modal
    setShowConfigDialog(true) // Open the config dialog
  }

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl) return
    // Mocking YouTube handling as a 'file' for now to fit existing flow
    // In a real app, we'd pass the URL to the AI service
    alert(`YouTube URL '${youtubeUrl}' akan diproses (Simulasi).`)

    // Reset and close
    setActiveModal(null)
    setYoutubeUrl("")

    // Here we could technically allow opening ConfigDialog too if we want AI config for the video summary
    // For now, let's just close to indicate action received.
  }


  // --- AI Processing Flow ---
  const startProcessing = async () => {
    setShowConfigDialog(false)
    const fileList = pendingFiles

    const newFiles: UploadedFile[] = fileList.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = files.length + i

      // Upload simulation
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setFiles((prev) => {
          const updated = [...prev]
          updated[fileIndex] = { ...updated[fileIndex], progress }
          return updated
        })
      }

      // Processing
      setFiles((prev) => {
        const updated = [...prev]
        updated[fileIndex] = { ...updated[fileIndex], status: "processing" }
        return updated
      })

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Complete
      setFiles((prev) => {
        const updated = [...prev]
        updated[fileIndex] = { ...updated[fileIndex], status: "complete", progress: 100 }
        return updated
      })

      // Add to store
      const file = newFiles[i].file
      const fileType = getFileType(file.name)

      addMaterial({
        userId: "demo-user",
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: fileType,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
      })

      // Generate content using AI Service with Options
      const { summary, quiz, flashcards } = await generateLearningContent(file, {
        subject: config.subject,
        understandingLevel: config.understandingLevel,
        writingStyle: config.writingStyle
      })

      const noteId = Math.random().toString(36).substring(7)

      addNote({
        id: noteId,
        userId: "demo-user",
        title: `Notes: ${file.name.replace(/\.[^/.]+$/, "")}`,
        content: summary,
        tags: [fileType, "AI Generated"],
        isFavorite: false,
      })

      addQuiz({
        ...quiz,
        noteId: noteId,
        userId: "demo-user",
      })

      flashcards.forEach(card => {
        addFlashcard({
          ...card,
          noteId: noteId,
          userId: "demo-user",
        })
      })
    }
  }

  const getFileType = (filename: string): "pdf" | "docx" | "pptx" | "video" | "audio" | "image" => {
    const ext = filename.split(".").pop()?.toLowerCase()
    if (ext === "pdf") return "pdf"
    if (ext === "docx" || ext === "doc") return "docx"
    if (ext === "pptx" || ext === "ppt") return "pptx"
    if (["mp4", "avi", "mov", "mkv"].includes(ext || "")) return "video"
    if (["mp3", "wav", "m4a"].includes(ext || "")) return "audio"
    return "image"
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className="lg:pl-64 pt-16">
        <div className="p-8 space-y-8 max-w-6xl mx-auto">

          {/* Header */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">BUAT CATATAN BARU</h2>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Upload File */}
              <Card
                className="bg-blue-900/40 hover:bg-blue-900/60 border-blue-800 transition-all cursor-pointer group"
                onClick={() => handleCardClick("file")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-48 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-blue-100">Upload File</h3>
                    <p className="text-xs text-blue-300 mt-1">PDF, DOCX, PPT</p>
                  </div>
                </CardContent>
              </Card>

              {/* YouTube */}
              <Card
                className="bg-red-900/40 hover:bg-red-900/60 border-red-800 transition-all cursor-pointer group"
                onClick={() => handleCardClick("youtube")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-48 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-red-100">YouTube</h3>
                    <p className="text-xs text-red-300 mt-1">Video Link</p>
                  </div>
                </CardContent>
              </Card>

              {/* Audio */}
              <Card
                className="bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-800 transition-all cursor-pointer group"
                onClick={() => handleCardClick("audio")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-48 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-emerald-100">Audio</h3>
                    <p className="text-xs text-emerald-300 mt-1">MP3, WAV</p>
                  </div>
                </CardContent>
              </Card>

              {/* Video */}
              <Card
                className="bg-purple-900/40 hover:bg-purple-900/60 border-purple-800 transition-all cursor-pointer group"
                onClick={() => handleCardClick("video")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-48 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-purple-100">Video</h3>
                    <p className="text-xs text-purple-300 mt-1">MP4, MOV</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileInputChange}
          />

          {/* Catatan Anda Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Catatan Anda</h2>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari catatan berdasarkan judul, subjek, atau nama file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Subjek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Subjek</SelectItem>
                  {/* Dynamic subjects could go here */}
                </SelectContent>
              </Select>
            </div>

            {/* Notes List */}
            <div className="space-y-2">
              {userNotes.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-card/50">
                  <p className="text-muted-foreground">Belum ada catatan. Buat baru dengan mengupload materi di atas!</p>
                </div>
              ) : (
                userNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/notes/${note.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-base group-hover:text-primary transition-colors">{note.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatDistanceToNow(note.updatedAt, { addSuffix: true })}</span>
                            <span>•</span>
                            <span className="capitalize">{note.tags[0] || "General"}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteNoteId(note.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Upload/Input Modal (First Step) */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {activeModal === 'youtube' ? "Upload Link YouTube" : "Upload File"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {activeModal === 'youtube' ? (
              <div className="space-y-4">
                <Label htmlFor="youtube-url">URL Video YouTube</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Masukkan URL video YouTube yang ingin diubah menjadi catatan</p>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">Drag & drop file di sini, atau klik untuk memilih</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeModal === 'file' && "PDF, Word, PowerPoint, Excel, Text (Maks. 50MB per file)"}
                  {activeModal === 'audio' && "MP3, WAV, M4A (Maks. 50MB per file)"}
                  {activeModal === 'video' && "MP4, MOV, MKV (Maks. 200MB per file)"}
                </p>
                <p className="text-xs text-muted-foreground font-medium">0/5 file</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Batal</Button>
            {activeModal === 'youtube' && (
              <Button onClick={handleYoutubeSubmit}>Lanjutkan</Button>
            )}
            {/* For file uploads, the action is triggered by 'drop' or 'select', so no explicit 'Submit' button needed inside the generic drag area unless we want a queue. 
                But per existing logic, selection triggers the next step directly. So we can keep it simple or add a button if we implemented a queue view. 
                For now, let's behave like the previous "select -> go" flow for files.
            */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog (Second Step) */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mata Pelajaran/Kuliah</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Mata Pelajaran/Kuliah</Label>
              <Input
                placeholder="Pilih mata pelajaran..."
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tingkat Pemahaman</Label>
                <span className="text-sm text-muted-foreground">
                  {config.understandingLevel < 33 ? "Pemula" : config.understandingLevel < 66 ? "Menengah" : "Ahli"}
                </span>
              </div>
              <Slider
                value={[config.understandingLevel]}
                max={100}
                step={1}
                onValueChange={(vals) => setConfig({ ...config, understandingLevel: vals[0] })}
                className="[&_.bg-primary]:bg-orange-500"
              />
              <p className="text-xs text-muted-foreground">
                Penjelasan disesuaikan untuk tingkat pemahaman ini.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Gaya Penulisan</Label>
              <Select
                value={config.writingStyle}
                onValueChange={(val) => setConfig({ ...config, writingStyle: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gaya penulisan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Ramah & Santai</SelectItem>
                  <SelectItem value="formal">Formal & Akademis</SelectItem>
                  <SelectItem value="concise">Singkat & Padat</SelectItem>
                  <SelectItem value="humorous">Humoris & Menyenangkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <Label>File yang akan diproses</Label>
              <div className="space-y-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setPendingFiles(prev => prev.filter((_, i) => i !== index))
                        if (pendingFiles.length <= 1) setShowConfigDialog(false) // Close if no files left
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Batal</Button>
            <Button onClick={startProcessing}>Lanjutkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Catatan ini akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteNoteId) {
                  deleteNote(deleteNoteId)
                  setDeleteNoteId(null)
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
