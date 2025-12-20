import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Note, Flashcard, Quiz, Material, ChatMessage, StudySession, ActivityStats } from "./types"

interface AppState {
  // User state
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    isPremium: boolean
  } | null

  // Data
  notes: Note[]
  flashcards: Flashcard[]
  quizzes: Quiz[]
  materials: Material[]
  chatMessages: ChatMessage[]
  studySessions: StudySession[]

  // UI state
  activeNoteId: string | null
  sidebarOpen: boolean
  chatPanelOpen: boolean
  hasInitialized: boolean

  // Actions - Notes
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
  markNoteAsAccessed: (id: string) => void

  setHasInitialized: (value: boolean) => void

  // Actions - Flashcards
  addFlashcard: (flashcard: Omit<Flashcard, "id" | "createdAt"> & { id?: string }) => void
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void

  // Actions - Quizzes
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt"> & { id?: string }) => void
  updateQuiz: (id: string, updates: Partial<Quiz>) => void
  deleteQuiz: (id: string) => void

  // Actions - Materials
  addMaterial: (material: Omit<Material, "id" | "uploadedAt"> & { id?: string }) => void
  deleteMaterial: (id: string) => void

  // Actions - Chat
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  clearChat: () => void

  // Actions - Study Sessions
  addStudySession: (session: Omit<StudySession, "id">) => void

  // Actions - UI
  toggleSidebar: () => void
  toggleChatPanel: () => void

  // Computed
  getActivityStats: () => ActivityStats
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: {
        id: "demo-user",
        name: "Demo User",
        email: "demo@pelajarin.ai",
        isPremium: false,
      },
      notes: [],
      flashcards: [],
      quizzes: [],
      materials: [],
      chatMessages: [],
      studySessions: [],
      activeNoteId: null,
      sidebarOpen: true,
      chatPanelOpen: false,
      hasInitialized: false,

      setHasInitialized: (value) => set({ hasInitialized: value }),

      // Notes actions
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: note.id || Math.random().toString(36).substring(7),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Note,
          ],
        })),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note)),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          flashcards: state.flashcards.filter((card) => card.noteId !== id),
          quizzes: state.quizzes.filter((quiz) => quiz.noteId !== id),
        })),

      setActiveNote: (id) => set({ activeNoteId: id }),

      markNoteAsAccessed: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, lastAccessedAt: new Date() } : note
          ),
        })),

      // Flashcards actions
      addFlashcard: (flashcard) =>
        set((state) => ({
          flashcards: [
            ...state.flashcards,
            {
              ...flashcard,
              id: flashcard.id || Math.random().toString(36).substring(7),
              createdAt: new Date(),
            } as Flashcard,
          ],
        })),

      updateFlashcard: (id, updates) =>
        set((state) => ({
          flashcards: state.flashcards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
        })),

      deleteFlashcard: (id) =>
        set((state) => ({
          flashcards: state.flashcards.filter((card) => card.id !== id),
        })),

      // Quizzes actions
      addQuiz: (quiz) =>
        set((state) => ({
          quizzes: [
            ...state.quizzes,
            {
              ...quiz,
              id: quiz.id || Math.random().toString(36).substring(7),
              createdAt: new Date(),
            } as Quiz,
          ],
        })),

      updateQuiz: (id, updates) =>
        set((state) => ({
          quizzes: state.quizzes.map((quiz) => (quiz.id === id ? { ...quiz, ...updates } : quiz)),
        })),

      deleteQuiz: (id) =>
        set((state) => ({
          quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
        })),

      // Materials actions
      addMaterial: (material) =>
        set((state) => ({
          materials: [
            ...state.materials,
            {
              ...material,
              id: material.id || Math.random().toString(36).substring(7),
              uploadedAt: new Date(),
            } as Material,
          ],
        })),

      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((mat) => mat.id !== id),
        })),

      // Chat actions
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              ...message,
              id: Math.random().toString(36).substring(7),
              timestamp: new Date(),
            },
          ],
        })),

      clearChat: () => set({ chatMessages: [] }),

      // Study sessions
      addStudySession: (session) =>
        set((state) => ({
          studySessions: [
            ...state.studySessions,
            {
              ...session,
              id: Math.random().toString(36).substring(7),
            },
          ],
        })),

      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),

      // Computed
      getActivityStats: () => {
        const state = get()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const totalStudyTime = state.studySessions
          .filter((session) => session.type === "focus")
          .reduce((acc, session) => acc + session.duration, 0)

        return {
          totalNotes: state.notes.length,
          totalFlashcards: state.flashcards.length,
          totalQuizzes: state.quizzes.length,
          totalStudyTime,
          streak: 0,
          lastActive: now,
        }
      },
    }),
    {
      name: "pelajarin-storage",
    },
  ),
)
