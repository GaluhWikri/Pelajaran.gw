"use client"

import { useState } from "react"
import { Plus, Trash2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"

interface FlashcardsTabProps {
  noteId: string
}

export function FlashcardsTab({ noteId }: FlashcardsTabProps) {
  const { flashcards, addFlashcard, deleteFlashcard } = useStore()
  const noteFlashcards = flashcards.filter((f) => f.noteId === noteId)

  const [isCreating, setIsCreating] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const handleCreate = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      addFlashcard({
        noteId,
        userId: "demo-user",
        question: newQuestion,
        answer: newAnswer,
        reviewCount: 0,
      })
      setNewQuestion("")
      setNewAnswer("")
      setIsCreating(false)
    }
  }

  const handleGenerateAI = () => {
    // Generate sample flashcards
    const sampleCards = [
      {
        question: "What is the main topic of this note?",
        answer: "The main topic covers key concepts and principles explained in the learning material.",
      },
      {
        question: "What are the key takeaways?",
        answer: "The key takeaways include understanding fundamental concepts and their practical applications.",
      },
    ]

    sampleCards.forEach((card) => {
      addFlashcard({
        noteId,
        userId: "demo-user",
        question: card.question,
        answer: card.answer,
        reviewCount: 0,
      })
    })
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flashcards</h3>
        <div className="flex gap-2">
          <Button onClick={handleGenerateAI} variant="outline" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Flashcard
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

          <div className="flex justify-center">
            <Card
              className="w-full max-w-2xl h-80 cursor-pointer perspective-1000"
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="p-8 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-sm font-medium text-primary uppercase">{flipped ? "Answer" : "Question"}</p>
                  <p className="text-xl font-medium">
                    {flipped ? noteFlashcards[currentIndex].answer : noteFlashcards[currentIndex].question}
                  </p>
                  <p className="text-sm text-muted-foreground">Click to flip</p>
                </div>
              </CardContent>
            </Card>
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
                <Button variant="ghost" size="icon" onClick={() => deleteFlashcard(card.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {noteFlashcards.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No flashcards yet. Create one or generate with AI!</p>
        </div>
      )}
    </div>
  )
}
