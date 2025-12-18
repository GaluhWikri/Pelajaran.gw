import { useState } from "react"
import { RotateCcw, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

import { generateQuizFromNote } from "@/lib/ai-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface QuizTabProps {
  noteId: string
}

export function QuizTab({ noteId }: QuizTabProps) {
  const { notes, quizzes, addQuiz, updateQuiz, deleteQuiz } = useStore()
  const noteQuizzes = quizzes.filter((q) => q.noteId === noteId)
  const noteContent = notes.find((n) => n.id === noteId)?.content || ""

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)

  // Generation state
  const [showConfig, setShowConfig] = useState(false)
  const [questionCount, setQuestionCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)

  const activeQuiz = noteQuizzes.find((q) => q.id === activeQuizId)

  const handleGenerateClick = () => {
    setShowConfig(true)
  }

  const handleConfirmGenerate = async () => {
    if (!noteContent) return

    setIsGenerating(true)
    try {
      const quizData = await generateQuizFromNote(noteContent, questionCount)

      addQuiz({
        noteId,
        userId: "demo-user",
        ...quizData,
      })

      setShowConfig(false)
    } catch (error) {
      console.error("Failed to generate quiz:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const handleNext = () => {
    if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleSubmit = () => {
    if (!activeQuiz) return

    const correctCount = activeQuiz.questions.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length
    const score = Math.round((correctCount / activeQuiz.questions.length) * 100)

    updateQuiz(activeQuiz.id, { score, completedAt: new Date() })
    setShowResults(true)
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
  }

  if (activeQuiz && !showResults) {
    const currentQuestion = activeQuiz.questions[currentQuestionIndex]
    const isAnswered = selectedAnswers[currentQuestion.id] !== undefined

    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{activeQuiz.title}</h3>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </span>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <p className="text-xl font-medium mb-6">{currentQuestion.question}</p>

              <RadioGroup
                value={selectedAnswers[currentQuestion.id]?.toString()}
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, Number.parseInt(value))}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveQuizId(null)}>
                Exit Quiz
              </Button>
              {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                <Button onClick={handleNext} disabled={!isAnswered}>
                  Next Question
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!isAnswered}>
                  Submit Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-center">
          {activeQuiz.questions.map((_, index) => (
            <div
              key={index}
              className={cn("h-2 w-8 rounded-full", index === currentQuestionIndex ? "bg-primary" : "bg-accent")}
            />
          ))}
        </div>
      </div>
    )
  }

  if (activeQuiz && showResults) {
    const correctCount = activeQuiz.questions.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length
    const score = Math.round((correctCount / activeQuiz.questions.length) * 100)

    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Card className="border-primary/50">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            <div>
              <p className="text-5xl font-bold text-primary">{score}%</p>
              <p className="text-muted-foreground mt-2">
                You got {correctCount} out of {activeQuiz.questions.length} questions correct
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={resetQuiz}>Retake Quiz</Button>
              <Button variant="outline" onClick={() => setActiveQuizId(null)}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h4 className="font-semibold">Review Answers</h4>
          {activeQuiz.questions.map((question, index) => {
            const userAnswer = selectedAnswers[question.id]
            const isCorrect = userAnswer === question.correctAnswer

            return (
              <Card key={question.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-secondary shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      <p className={cn("text-sm", isCorrect ? "text-secondary" : "text-destructive")}>
                        Your answer: {question.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-muted-foreground">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground italic">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quizzes</h3>
        <Button onClick={handleGenerateClick} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Generate Quiz with AI
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {noteQuizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 relative" onClick={() => setActiveQuizId(quiz.id)}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold pr-8">{quiz.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteQuizId(quiz.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{quiz.questions.length} questions</span>
                  {quiz.score !== undefined && <span className="text-primary font-medium">{quiz.score}%</span>}
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  {quiz.completedAt ? "Retake Quiz" : "Start Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {noteQuizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No quizzes yet. Generate one with AI!</p>
        </div>
      )}

      <AlertDialog open={!!deleteQuizId} onOpenChange={(open) => !open && setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteQuizId) {
                  deleteQuiz(deleteQuizId)
                  setDeleteQuizId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Quiz with AI</DialogTitle>
            <DialogDescription>
              Customize your quiz generation settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="question-count">Number of Questions</Label>
                <span className="text-sm font-medium border rounded px-3 py-1 bg-muted">
                  {questionCount}
                </span>
              </div>
              <Slider
                id="question-count"
                min={1}
                max={20}
                step={1}
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 Question</span>
                <span>20 Questions</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)} disabled={isGenerating}>Cancel</Button>
            <Button onClick={handleConfirmGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
