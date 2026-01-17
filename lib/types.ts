export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isPremium: boolean
  level: number
  currentXP: number
  lastLoginDate?: string
}

export interface Material {
  id: string
  userId: string
  title: string
  type: "pdf" | "docx" | "pptx" | "video" | "audio" | "image"
  fileUrl: string
  fileName: string
  fileSize: number
  uploadedAt: Date
}

export interface Note {
  id: string
  userId: string
  materialId?: string
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  lastAccessedAt?: Date
}

export interface Flashcard {
  id: string
  noteId: string
  userId: string
  question: string
  answer: string
  difficulty?: "easy" | "medium" | "hard"
  nextReview?: Date
  reviewCount: number
  createdAt: Date
}

export interface Quiz {
  id: string
  noteId: string
  userId: string
  title: string
  questions: QuizQuestion[]
  score?: number
  completedAt?: Date
  createdAt: Date
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface ChatMessage {
  id: string
  userId: string
  noteId?: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface StudySession {
  id: string
  userId: string
  noteId: string
  duration: number
  type: "focus" | "break" | "quiz"
  completedAt: Date
}

export interface ActivityStats {
  totalNotes: number
  totalFlashcards: number
  totalQuizzes: number
  totalQuizzesAvailable: number
  totalStudyTime: number
  streak: number
  lastActive: Date
  trends: {
    notes: number
    flashcards: number
    quizzes: number
  }
  longestStreak: number
}

export interface MindmapNode {
  id: string
  label: string
  parentId: string | null
  edgeLabel?: string // Teks penghubung seperti "adalah", "yaitu", "meliputi"
  position?: { x: number; y: number }
}

export interface Mindmap {
  id: string
  noteId: string
  userId: string
  nodes: MindmapNode[]
  createdAt: Date
  updatedAt: Date
}
