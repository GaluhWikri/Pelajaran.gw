"use client"

import { useState } from "react"
import { Plus, Trash2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { generateFlashcardsFromNote } from "@/lib/ai-service"
import { deleteFlashcardFromSupabase, saveFlashcardToSupabase } from "@/lib/supabase-helpers"
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
import { useAuth } from "@/lib/auth-context"

interface FlashcardsTabProps {
    noteId: string
}

export function FlashcardsTab({ noteId }: FlashcardsTabProps) {
    const { flashcards, notes, addFlashcard, deleteFlashcard } = useStore()
    const { user } = useAuth()
    const noteFlashcards = flashcards.filter((f) => f.noteId === noteId)

    // Find current note content
    const currentNote = notes.find(n => n.id === noteId)


    const [isCreating, setIsCreating] = useState(false)
    const [newQuestion, setNewQuestion] = useState("")
    const [newAnswer, setNewAnswer] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [deleteFlashcardId, setDeleteFlashcardId] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleCreate = async () => {
        if (newQuestion.trim() && newAnswer.trim()) {
            const newId = crypto.randomUUID()
            const newFlashcard = {
                id: newId,
                noteId,
                userId: user?.id || "demo-user",
                question: newQuestion,
                answer: newAnswer,
                reviewCount: 0,
                difficulty: "medium" as const, // Default difficulty
                createdAt: new Date()
            }

            if (user) {
                await saveFlashcardToSupabase(newFlashcard)
            }

            addFlashcard(newFlashcard)

            setNewQuestion("")
            setNewAnswer("")
            setIsCreating(false)
        }
    }

    const handleGenerateAI = async () => {
        if (!currentNote?.content) {
            alert("Konten catatan tidak ditemukan.")
            return
        }

        setIsGenerating(true)
        try {
            const generatedCards = await generateFlashcardsFromNote(currentNote.content, 5)

            for (const card of generatedCards) {
                const newId = crypto.randomUUID()
                const newFlashcard = {
                    id: newId,
                    noteId,
                    userId: user?.id || "demo-user",
                    question: card.question,
                    answer: card.answer,
                    reviewCount: 0,
                    difficulty: "medium" as const,
                    createdAt: new Date()
                }

                if (user) {
                    await saveFlashcardToSupabase(newFlashcard)
                }
                addFlashcard(newFlashcard)
            }
        } catch (error) {
            console.error("Gagal generate flashcards:", error)
            alert("Gagal membuat flashcards dengan AI.")
        } finally {
            setIsGenerating(false)
        }
    }

    const nextCard = () => {
        setFlipped(false)
        setCurrentIndex((prev) => (prev + 1) % noteFlashcards.length)
    }

    const prevCard = () => {
        setFlipped(false)
        setCurrentIndex((prev) => (prev - 1 + noteFlashcards.length) % noteFlashcards.length)
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Flashcards</h3>
                <div className="flex w-full sm:w-auto gap-2">
                    <Button
                        onClick={handleGenerateAI}
                        variant="outline"
                        className="flex-1 sm:flex-none gap-2 bg-transparent"
                        disabled={isGenerating}
                    >
                        <RotateCcw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? "Generating..." : "Generate AI"}
                    </Button>
                    <Button onClick={() => setIsCreating(!isCreating)} className="flex-1 sm:flex-none gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Flashcard</span>
                        <span className="sm:hidden">Create</span>
                    </Button>
                </div>
            </div>

            {isCreating && (
                <Card className="border-primary/50">
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Question</label>
                            <Input
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Enter question..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Answer</label>
                            <Textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Enter answer..."
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate}>Add Flashcard</Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreating(false)
                                    setNewQuestion("")
                                    setNewAnswer("")
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {noteFlashcards.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">
                            Card {currentIndex + 1} of {noteFlashcards.length}
                        </div>
                    </div>

                    <div className="flex justify-center perspective-1000">
                        <div
                            className={`relative w-full max-w-2xl h-64 md:h-80 cursor-pointer transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""
                                }`}
                            onClick={() => setFlipped(!flipped)}
                        >
                            {/* Front Face (Question) */}
                            <Card className="absolute w-full h-full backface-hidden">
                                <CardContent className="p-6 md:p-8 h-full flex items-center justify-center overflow-auto">
                                    <div className="text-center space-y-4 w-full">
                                        <p className="text-xs md:text-sm font-medium text-primary uppercase">Question</p>
                                        <p className="text-lg md:text-xl font-medium break-words px-2">{noteFlashcards[currentIndex].question}</p>
                                        <p className="text-xs text-muted-foreground">Click to flip</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Back Face (Answer) */}
                            <Card className="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-primary bg-primary/10">
                                <CardContent className="p-6 md:p-8 h-full flex items-center justify-center overflow-auto">
                                    <div className="text-center space-y-4 w-full">
                                        <p className="text-xs md:text-sm font-medium text-primary uppercase">Answer</p>
                                        <p className="text-lg md:text-xl font-medium break-words px-2">{noteFlashcards[currentIndex].answer}</p>
                                        <p className="text-xs text-muted-foreground">Click to flip back</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <Button onClick={prevCard} variant="outline" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button onClick={nextCard} variant="outline" size="icon">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <h4 className="text-sm font-semibold">All Flashcards</h4>
                {noteFlashcards.map((card) => (
                    <Card key={card.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <p className="font-medium text-sm">Q: {card.question}</p>
                                    <p className="text-sm text-muted-foreground">A: {card.answer}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteFlashcardId(card.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <AlertDialog open={!!deleteFlashcardId} onOpenChange={(open) => !open && setDeleteFlashcardId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus flashcard ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Flashcard ini akan dihapus secara permanen dari database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                    if (deleteFlashcardId) {
                                        await deleteFlashcardFromSupabase(deleteFlashcardId)
                                        deleteFlashcard(deleteFlashcardId)
                                        setDeleteFlashcardId(null)
                                    }
                                }}
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {noteFlashcards.length === 0 && !isCreating && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No flashcards yet. Create one or generate with AI!</p>
                </div>
            )}
        </div>
    )
}
