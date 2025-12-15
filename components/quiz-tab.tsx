import { useState } from "react"
import { RotateCcw, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
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
  const { quizzes, addQuiz, updateQuiz, deleteQuiz } = useStore()
  const noteQuizzes = quizzes.filter((q) => q.noteId === noteId)

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)

  const activeQuiz = noteQuizzes.find((q) => q.id === activeQuizId)

  const handleGenerateQuiz = () => {
    const sampleQuiz = {
      noteId,
      userId: "demo-user",
      title: "Quick Knowledge Check",
      questions: [
        {
          id: "q1",
          question: "What is the primary purpose of this learning material?",
          options: [
            "To provide an overview of the topic",
            "To test existing knowledge",
            "To introduce advanced concepts",
            "To review previous material",
          ],
          correctAnswer: 0,
          explanation: "The material is designed to provide a comprehensive overview of the key concepts.",
        },
        {
          id: "q2",
          question: "Which concept is most emphasized in the notes?",
          options: ["Theoretical foundations", "Practical applications", "Historical context", "Future developments"],
          correctAnswer: 1,
          explanation: "The notes focus heavily on practical applications and real-world use cases.",
        },
        {
          id: "q3",
          question: "What is the recommended approach for studying this material?",
          options: ["Memorize all details", "Understand core concepts", "Skip to examples", "Read once quickly"],
          correctAnswer: 1,
          explanation: "Understanding core concepts is more valuable than pure memorization.",
        },
      ],
    }

    addQuiz(sampleQuiz)
    setActiveQuizId(noteQuizzes.length > 0 ? noteQuizzes[noteQuizzes.length].id : null)
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
        <Button onClick={handleGenerateQuiz} className="gap-2">
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
    </div>
  )
}
