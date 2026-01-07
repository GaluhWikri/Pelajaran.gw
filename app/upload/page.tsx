"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, FileText, Video, Mic, Youtube, Plus, Search, Tag, Star, Trash2, X, Loader2, CheckCircle, Sparkles } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { generateLearningContent, generateLearningContentFromText } from "@/lib/ai-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { saveNoteToSupabase, saveFlashcardToSupabase, saveQuizToSupabase, deleteNoteFromSupabase } from "@/lib/supabase-helpers"
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
import { marked } from "marked"

interface UploadedFile {
    file: File
    progress: number
    status: "uploading" | "processing" | "complete" | "error"
}

type ModalType = "file" | "youtube" | "audio" | "video" | null


export default function UploadPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const {
        addMaterial,
        addNote,
        addQuiz,
        addFlashcard,
        notes,
        deleteNote,
        activeUploads,
        addActiveUpload,
        updateActiveUpload,
        removeActiveUpload,
        sidebarOpen
    } = useStore()
    const { user } = useAuth()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Log for debugging
    useEffect(() => {
        if (isMounted) {
            console.log('Upload Page - Active Uploads:', activeUploads)
        }
    }, [isMounted, activeUploads])


    // Modal State
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [isDragActive, setIsDragActive] = useState(false)
    const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)


    // Configuration State
    const [showConfigDialog, setShowConfigDialog] = useState(false)
    const [showProcessingModal, setShowProcessingModal] = useState(false)
    const [completedNoteId, setCompletedNoteId] = useState<string | null>(null)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [config, setConfig] = useState({
        subject: "",
        understandingLevel: 50,
        writingStyle: "relaxed"
    })

    const getUnderstandingLabel = (level: number) => {
        if (level <= 20) return "Pemula"
        if (level <= 40) return "Dasar"
        if (level <= 60) return "Menengah"
        if (level <= 80) return "Mahir"
        return "Ahli"
    }

    // Filter notes for "Catatan Anda" section
    const userNotes = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    /* =========================
       ACTIONS
    ========================= */
    const [showLoginModal, setShowLoginModal] = useState(false)

    const handleCardClick = (type: ModalType) => {
        if (!user) {
            setShowLoginModal(true)
            return
        }
        setActiveModal(type)
        setYoutubeUrl("") // Reset for youtube
        setPendingFiles([]) // Reset pending files
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
        setPendingFiles((prev) => {
            const combined = [...prev, ...fileList]
            if (combined.length > 5) {
                alert("Maksimal 5 file yang dapat diupload sekaligus.")
                return combined.slice(0, 5)
            }
            return combined
        })
    }

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleYoutubeSubmit = () => {
        if (!youtubeUrl) return
        setActiveModal(null)
        setShowConfigDialog(true)
    }




    // --- AI Processing Flow ---
    const startProcessing = async () => {
        setShowConfigDialog(false)
        setShowProcessingModal(true)
        setCompletedNoteId(null)
        const fileList = pendingFiles
        const currentYoutubeUrl = youtubeUrl

        if (fileList.length === 0 && !currentYoutubeUrl) return

        // Prepare Tasks with IDs
        const fileTasks = fileList.map((file) => ({
            id: crypto.randomUUID(),
            file,
            type: getFileType(file.name)
        }))

        const youtubeTask = currentYoutubeUrl ? {
            id: crypto.randomUUID(),
            url: currentYoutubeUrl,
            type: "video" as const
        } : null

        // Initialize Store State
        fileTasks.forEach(task => {
            addActiveUpload({
                id: task.id,
                file: task.file,
                fileName: task.file.name,
                progress: 0,
                status: "uploading"
            })
        })

        if (youtubeTask) {
            addActiveUpload({
                id: youtubeTask.id,
                file: null,
                fileName: "YouTube Video Pending...",
                progress: 0,
                status: "processing"
            })
        }

        // Process Files
        for (const task of fileTasks) {
            // Upload simulation
            for (let progress = 0; progress <= 90; progress += 10) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                updateActiveUpload(task.id, { progress })
            }

            await processContent(task.file, task.type, task.id)
        }

        // Process YouTube
        if (youtubeTask) {
            const ytId = youtubeTask.id
            try {
                updateActiveUpload(ytId, { status: "processing", progress: 20 })

                // Fetch Transcript
                const res = await fetch("/api/youtube-transcript", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: youtubeTask.url }),
                })

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Gagal mengambil transkrip video.")
                }

                const { transcript } = await res.json()
                if (!transcript) throw new Error("Video tidak memiliki caption/transkrip.")

                updateActiveUpload(ytId, { progress: 50 })

                // Generate Content
                const { title: generatedTitle, summary, quiz, flashcards } = await generateLearningContentFromText(transcript, {
                    subject: config.subject,
                    understandingLevel: getUnderstandingLabel(config.understandingLevel),
                    writingStyle: config.writingStyle
                })

                updateActiveUpload(ytId, { progress: 80, fileName: generatedTitle || "YouTube Video" })

                // Generate proper UUID for note ID
                const noteId = crypto.randomUUID()
                const htmlContent = await marked.parse(summary)

                // Save to Supabase first
                if (user) {
                    const { data: savedNote, error: saveError } = await saveNoteToSupabase({
                        id: noteId,
                        userId: user.id,
                        title: generatedTitle || "YouTube Summary",
                        content: htmlContent as string,
                        tags: [config.subject, "YouTube", "AI Generated"].filter((t) => t && t.trim() !== ""),
                        isFavorite: false,
                    })

                    if (saveError) {
                        console.error('Error saving note to Supabase:', saveError)
                        // alert('Failed to save note to database') // Optional
                    }
                }

                // Then update local store
                addNote({
                    id: noteId,
                    userId: user?.id || "demo-user",
                    title: generatedTitle || "YouTube Summary",
                    content: htmlContent as string,
                    tags: [config.subject, "YouTube", "AI Generated"].filter((t) => t && t.trim() !== ""),
                    isFavorite: false,
                })

                // Save quiz to Supabase
                if (user && quiz) {
                    const quizId = crypto.randomUUID()
                    await saveQuizToSupabase({
                        id: quizId,
                        noteId,
                        userId: user.id,
                        title: quiz.title,
                        questions: quiz.questions,
                    })
                    addQuiz({ ...quiz, id: quizId, noteId, userId: user.id })
                } else {
                    addQuiz({ ...quiz, noteId, userId: user?.id || "demo-user" })
                }

                // Save flashcards to Supabase
                if (user && flashcards && flashcards.length > 0) {
                    for (const card of flashcards) {
                        const cardId = crypto.randomUUID()
                        await saveFlashcardToSupabase({
                            id: cardId,
                            noteId,
                            userId: user.id,
                            question: card.question,
                            answer: card.answer,
                            difficulty: card.difficulty || 'medium',
                            reviewCount: 0,
                        })
                        addFlashcard({ ...card, id: cardId, noteId, userId: user.id }, { fromBundle: true })
                    }
                } else {
                    flashcards.forEach(card => addFlashcard({ ...card, noteId, userId: user?.id || "demo-user" }, { fromBundle: true }))
                }


                // Mark complete
                updateActiveUpload(ytId, {
                    status: "complete",
                    progress: 100,
                    fileName: generatedTitle || "YouTube Summary",
                    noteId: noteId // Store the ID for direct navigation
                })

                // Remove from active uploads after a delay to show success state
                setTimeout(() => {
                    removeActiveUpload(ytId)
                }, 3000)

                // Clear YouTube URL after success
                setYoutubeUrl("")

            } catch (error: any) {
                console.error("YouTube processing error:", error)
                updateActiveUpload(ytId, { status: "error", progress: 100 })
                alert(`Gagal memproses video: ${error.message}`)
            }
        }
    }

    // Helper to process file content (isolated from loop for clarity, though used inline above for now I kept the loop structure but split processing)
    // Actually, to avoid rewriting the whole file processing logic cleanly let's just adapt the existing "try/catch" block into a helper or keep it.
    // The 'startProcessing' replacement above needs to be careful about the existing 'processContent' function I alluded to. 
    // Wait, I cannot introduce a new function 'processContent' inside 'startProcessing' easily without defining it.
    // Let me rewrite 'startProcessing' fully to handle both, mostly by copying the file logic.

    async function processContent(file: File, fileType: string, uploadId: string) {
        updateActiveUpload(uploadId, { status: "processing", progress: 95 })

        try {
            addMaterial({
                userId: "demo-user",
                title: file.name.replace(/\.[^/.]+$/, ""),
                type: fileType as any,
                fileUrl: URL.createObjectURL(file), // Warning: Object URL lifecycle
                fileName: file.name,
                fileSize: file.size,
            })

            const { title: generatedTitle, summary, quiz, flashcards } = await generateLearningContent(file, {
                subject: config.subject,
                understandingLevel: getUnderstandingLabel(config.understandingLevel),
                writingStyle: config.writingStyle
            })

            // Generate proper UUID for note ID
            const noteId = crypto.randomUUID()
            const htmlContent = await marked.parse(summary)

            // Save to Supabase first
            if (user) {
                const { data: savedNote, error: saveError } = await saveNoteToSupabase({
                    id: noteId,
                    userId: user.id,
                    title: generatedTitle || file.name.replace(/\.[^/.]+$/, ""),
                    content: htmlContent as string,
                    tags: [config.subject, fileType, "AI Generated"].filter((t) => t && t.trim() !== ""),
                    isFavorite: false,
                })

                if (saveError) {
                    console.error('Error saving note to Supabase:', saveError)
                    // alert('Failed to save note to database')
                }
            }

            // Then update local store
            addNote({
                id: noteId,
                userId: user?.id || "demo-user",
                title: generatedTitle || file.name.replace(/\.[^/.]+$/, ""),
                content: htmlContent as string,
                tags: [config.subject, fileType, "AI Generated"].filter((t) => t && t.trim() !== ""),
                isFavorite: false,
            })

            // Save quiz to Supabase
            if (user && quiz) {
                const quizId = crypto.randomUUID()
                await saveQuizToSupabase({
                    id: quizId,
                    noteId,
                    userId: user.id,
                    title: quiz.title,
                    questions: quiz.questions,
                })
                addQuiz({ ...quiz, id: quizId, noteId, userId: user.id })
            } else {
                addQuiz({ ...quiz, noteId, userId: user?.id || "demo-user" })
            }

            // Save flashcards to Supabase
            if (user && flashcards && flashcards.length > 0) {
                for (const card of flashcards) {
                    const cardId = crypto.randomUUID()
                    await saveFlashcardToSupabase({
                        id: cardId,
                        noteId,
                        userId: user.id,
                        question: card.question,
                        answer: card.answer,
                        difficulty: card.difficulty || 'medium',
                        reviewCount: 0,
                    })
                    addFlashcard({ ...card, id: cardId, noteId, userId: user.id }, { fromBundle: true })
                }
            } else {
                flashcards.forEach(card => addFlashcard({ ...card, noteId, userId: user?.id || "demo-user" }, { fromBundle: true }))
            }


            updateActiveUpload(uploadId, {
                status: "complete",
                progress: 100,
                fileName: generatedTitle || file.name.replace(/\.[^/.]+$/, ""),
                noteId: noteId
            })
            setCompletedNoteId(noteId) // Store for navigation

            // Remove from active uploads after a delay to show success state
            setTimeout(() => {
                removeActiveUpload(uploadId)
            }, 3000)
        } catch (error) {
            console.error("Error processing file:", error)
            updateActiveUpload(uploadId, { status: "error", progress: 100 })
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

            <main className={cn("pt-24 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
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
                            {/* Processing Items - Render when mounted */}
                            {isMounted && activeUploads.map((upload) => (
                                <Card key={upload.id} className={cn(
                                    "border-l-4 bg-muted/20 transition-all duration-500",
                                    upload.status === 'complete' ? "border-l-green-500 bg-green-500/10" :
                                        upload.status === 'error' ? "border-l-red-500 bg-red-500/10" :
                                            "border-l-blue-500"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
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
                                                    <h3 className="font-medium text-base text-foreground/90 truncate">{upload.fileName}</h3>
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
                                                        upload.status === 'processing' ? 'Memproses dengan AI...' :
                                                            upload.status === 'complete' ? 'Selesai! Catatan berhasil dibuat.' :
                                                                'Gagal memproses file.'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Notes - Show based on mount state */}
                            {!isMounted ? (
                                <div className="text-center py-12 border rounded-lg bg-card/50">
                                    <p className="text-muted-foreground">Loading notes...</p>
                                </div>
                            ) : userNotes.length === 0 && activeUploads.length === 0 ? (
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
                                                        <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
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
                            <div className="space-y-4">
                                {pendingFiles.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {pendingFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 border rounded bg-muted/20">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removePendingFile(idx)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={triggerFileInput}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                                    )}
                                >
                                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-3">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-medium text-base mb-1">
                                        {pendingFiles.length > 0 ? "Tambah file lagi?" : "Drag & drop file di sini, atau klik untuk memilih"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {activeModal === 'file' && "PDF, Word, PPT (Max 50MB)"}
                                        {activeModal === 'audio' && "MP3, WAV (Max 50MB)"}
                                        {activeModal === 'video' && "MP4, MOV (Max 200MB)"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{pendingFiles.length}/5 file</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)}>Batal</Button>
                        {activeModal === 'youtube' ? (
                            <Button onClick={handleYoutubeSubmit}>Lanjutkan</Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    if (pendingFiles.length > 0) {
                                        setActiveModal(null)
                                        setShowConfigDialog(true)
                                    }
                                }}
                                disabled={pendingFiles.length === 0}
                            >
                                Lanjutkan ({pendingFiles.length})
                            </Button>
                        )}
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
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                    {getUnderstandingLabel(config.understandingLevel)}
                                </span>
                            </div>
                            <Slider
                                value={[config.understandingLevel]}
                                max={100}
                                step={25}
                                onValueChange={(vals) => setConfig({ ...config, understandingLevel: vals[0] })}
                                className="[&_.bg-primary]:bg-orange-500 cursor-grab active:cursor-grabbing"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                <span>Pemula</span>
                                <span>Ahli</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {config.understandingLevel <= 25
                                    ? "Penjelasan detail dengan analogi sederhana"
                                    : config.understandingLevel <= 50
                                        ? "Penjelasan seimbang untuk pemahaman umum"
                                        : "Penjelasan ringkas dengan istilah teknis"}
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



                    {youtubeUrl && (
                        <div className="space-y-2">
                            <Label>Link YouTube yang akan diproses</Label>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-red-500/10 border-red-200 max-w-full">
                                <div className="flex-1 w-0 flex items-center gap-3 overflow-hidden">
                                    <div className="h-8 w-8 rounded bg-red-500 text-white flex items-center justify-center shrink-0">
                                        <Youtube className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">YouTube Video</p>
                                        <p className="text-xs text-muted-foreground truncate">{youtubeUrl}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive ml-2"
                                    onClick={() => {
                                        setYoutubeUrl("")
                                        if (pendingFiles.length === 0) setShowConfigDialog(false)
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {pendingFiles.length > 0 && (
                        <div className="space-y-2">
                            <Label>File yang akan diproses</Label>
                            <div className="space-y-2">
                                {pendingFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10 max-w-full">
                                        <div className="flex-1 w-0 flex items-center gap-3 overflow-hidden">
                                            <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                                                <FileText className="h-4 w-4 text-red-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm truncate" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive ml-2"
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
                        <AlertDialogDescription asChild>
                            <div>
                                Tindakan ini tidak dapat dibatalkan. Catatan ini akan dihapus secara permanen beserta semua data terkait:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Semua flashcard dari catatan ini</li>
                                    <li>Semua quiz dari catatan ini</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                                if (deleteNoteId) {
                                    // Delete from Supabase first (will cascade delete flashcards & quizzes)
                                    if (user) {
                                        const { error } = await deleteNoteFromSupabase(deleteNoteId)
                                        if (error) {
                                            console.error('Error deleting note from Supabase:', error)
                                            alert('Gagal menghapus catatan dari database')
                                        }
                                    }

                                    // Then delete from local store
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


            {/* Processing Modal - UX Improvement */}
            <Dialog open={showProcessingModal} onOpenChange={setShowProcessingModal}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {activeUploads.every(u => u.status === 'complete') ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>Pemrosesan Selesai!</span>
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <span>Sedang Memproses Materi...</span>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* Status Animation Logic */}
                        <div className="flex flex-col items-center justify-center py-4 space-y-4">
                            {activeUploads.every(u => u.status === 'complete') ? (
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                            ) : activeUploads.some(u => u.status === 'processing') ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                                    <div className="h-20 w-20 bg-background border-2 border-primary/20 rounded-full flex items-center justify-center relative shadow-lg">
                                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-blue-600 animate-bounce" />
                                </div>
                            )}

                            <p className="text-center text-sm text-muted-foreground max-w-[80%]">
                                {activeUploads.every(u => u.status === 'complete')
                                    ? "Semua materi berhasil diproses! Catatan, kuis, dan flashcard sudah siap."
                                    : activeUploads.some(u => u.status === 'processing')
                                        ? "AI sedang menganalisis konten Anda untuk membuat ringkasan cerdas..."
                                        : "Sedang mengupload file ke server aman kami..."
                                }
                            </p>
                        </div>

                        {/* Progress List */}
                        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                            {activeUploads.map((upload) => (
                                <div key={upload.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium truncate max-w-[200px]">{upload.fileName}</span>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            upload.status === 'complete' ? "text-green-600" :
                                                upload.status === 'error' ? "text-red-600" :
                                                    "text-primary"
                                        )}>
                                            {upload.status === 'uploading' && `${upload.progress}%`}
                                            {upload.status === 'processing' && "Menganalisis..."}
                                            {upload.status === 'complete' && "Selesai"}
                                            {upload.status === 'error' && "Gagal"}
                                        </span>
                                    </div>
                                    <Progress value={upload.progress} className={cn(
                                        "h-2 transition-all",
                                        upload.status === 'processing' && "animate-pulse"
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-2">
                        {activeUploads.every(u => u.status === 'complete') ? (
                            <>
                                <Button variant="outline" onClick={() => setShowProcessingModal(false)}>
                                    Tutup
                                </Button>
                                <Button
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                        setShowProcessingModal(false)
                                        // Priority 1: Use local state captured at completion time
                                        if (completedNoteId) {
                                            router.push(`/notes/${completedNoteId}`)
                                            return
                                        }

                                        // Priority 2: Search in active uploads
                                        const lastCompleted = activeUploads.findLast(u => u.status === 'complete' && u.noteId);
                                        if (lastCompleted && lastCompleted.noteId) {
                                            router.push(`/notes/${lastCompleted.noteId}`)
                                        } else {
                                            // Fallback
                                        }
                                    }}
                                >
                                    Lihat Catatan
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                onClick={() => setShowProcessingModal(false)}
                            >
                                Sembunyikan (Proses Berjalan di Background)
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Login Required Modal */}
            <AlertDialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Login Diperlukan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Silakan login terlebih dahulu untuk mengakses fitur ini dan menyimpan materi pelajaran Anda.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => router.push('/login')}
                        >
                            Login Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
