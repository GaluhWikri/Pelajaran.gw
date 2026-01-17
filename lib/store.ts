import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Note, Flashcard, Quiz, Material, ChatMessage, StudySession, ActivityStats, Mindmap } from "./types"
import { supabase } from "@/lib/supabase"

interface AppState {
  // User state
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    isPremium: boolean
    level?: number
    currentXP?: number
    lastLoginDate?: string // YYYY-MM-DD format for robustness
    streak?: number
  } | null

  // Data
  notes: Note[]
  flashcards: Flashcard[]
  quizzes: Quiz[]
  materials: Material[]
  chatMessages: ChatMessage[]
  studySessions: StudySession[]
  mindmaps: Mindmap[]

  // UI state
  activeNoteId: string | null
  sidebarOpen: boolean
  chatPanelOpen: boolean
  hasInitialized: boolean

  // Processing State
  activeUploads: {
    id: string
    file: any
    fileName: string
    progress: number
    status: "uploading" | "processing" | "complete" | "error"
    noteId?: string
  }[]

  // Effects
  showDailyLoginEffect: boolean

  // Actions - User
  setUser: (user: AppState['user']) => void
  addXP: (amount: number) => void
  checkDailyLogin: (userId: string) => void

  // Actions - Processing
  addActiveUpload: (upload: AppState['activeUploads'][0]) => void
  updateActiveUpload: (id: string, updates: Partial<AppState['activeUploads'][0]>) => void
  removeActiveUpload: (id: string) => void

  // Actions - Notes
  setNotes: (notes: Note[]) => void
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date }) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
  markNoteAsAccessed: (id: string) => void

  setHasInitialized: (value: boolean) => void

  // Actions - Flashcards
  setFlashcards: (flashcards: Flashcard[]) => void
  addFlashcard: (flashcard: Omit<Flashcard, "id" | "createdAt"> & { id?: string; createdAt?: Date }, options?: { fromBundle?: boolean }) => void
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void

  // Actions - Quizzes
  setQuizzes: (quizzes: Quiz[]) => void
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt"> & { id?: string; createdAt?: Date }) => void
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

  // Actions - Mindmaps
  setMindmaps: (mindmaps: Mindmap[]) => void
  addMindmap: (mindmap: Omit<Mindmap, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date }) => void
  updateMindmap: (id: string, updates: Partial<Mindmap>) => void
  deleteMindmap: (id: string) => void
  getMindmapByNoteId: (noteId: string) => Mindmap | undefined

  // Actions - UI
  toggleSidebar: () => void
  toggleChatPanel: () => void
  resetDailyLoginEffect: () => void

  // Actions - Clear all data
  clearAll: () => void

  // Computed
  getActivityStats: () => ActivityStats
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      notes: [],
      flashcards: [],
      quizzes: [],
      materials: [],
      chatMessages: [],
      mindmaps: [],
      studySessions: [],
      activeNoteId: null,
      sidebarOpen: true,
      chatPanelOpen: false,
      hasInitialized: false,
      showDailyLoginEffect: false,

      setHasInitialized: (value) => set({ hasInitialized: value }),

      // Actions - Gamification
      addXP: (amount: number) => {
        set((state) => {
          if (!state.user) return {}

          let newXP = (state.user.currentXP || 0) + amount
          let newLevel = state.user.level || 1

          // Logic Level Up: Base XP 300 * Level saat ini
          // Level 1 -> 2 butuh 300 XP
          // Level 2 -> 3 butuh 600 XP
          // Level 3 -> 4 butuh 900 XP dst
          const xpNeededForNextLevel = newLevel * 300

          if (newXP >= xpNeededForNextLevel) {
            newLevel += 1
            newXP = newXP - xpNeededForNextLevel
            // Bisa tambahkan notifikasi level up disini nantinya
          }


          // SYNC TO SUPABASE
          if (state.user.id && state.user.id !== 'demo-user') {
            supabase.from('profiles').update({
              level: newLevel,
              current_xp: newXP,
              updated_at: new Date().toISOString()
            }).eq('id', state.user.id).then(({ error }) => {
              if (error) console.error("Failed to sync XP to DB:", error)
            })
          }

          return {
            user: {
              ...state.user,
              level: newLevel,
              currentXP: newXP
            }
          }
        })
      },



      checkDailyLogin: (userId: string) => {
        console.log('[Store] checkDailyLogin triggered for:', userId)
        const state = get()

        // Safety check
        if (!state.user) return
        if (state.user.id !== userId) return

        const now = new Date()
        const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD
        const lastLoginStr = state.user.lastLoginDate || ""

        // Calculate Yesterday
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toLocaleDateString('en-CA')

        let newStreak = state.user.streak || 0

        // MIGRATION / RECOVERY: If persistent streak is 0, check if we have a calculated activity streak
        if (newStreak === 0) {
          const calculatedStats = get().getActivityStats()
          if (calculatedStats.streak > 0) {
            console.log('[Store] Recovering streak from activity history:', calculatedStats.streak)
            newStreak = calculatedStats.streak
          }
        }

        if (lastLoginStr !== todayStr) {
          console.log('[Store] New daily login detected! Updating DB...')

          // Logic Streak
          if (lastLoginStr === yesterdayStr) {
            newStreak += 1
            console.log('[Store] Consecutive login! Streak incremented to:', newStreak)
          } else {
            // Only reset if it wasn't a brand new 0-streak or empty
            // If lastLoginStr is empty (first ever), streak becomes 1.
            // If lastLoginStr is old (broken), streak becomes 1.
            if (newStreak === 0 && lastLoginStr === "") {
              newStreak = 1
            } else {
              console.log('[Store] Streak broken (Last login: ' + lastLoginStr + '). Reset to 1.')
              newStreak = 1
            }
          }

          get().addXP(10) // Daily Login Reward

          // Cek 7-day Weekly Bonus
          if (newStreak > 0 && newStreak % 7 === 0) {
            get().addXP(100)
          }

          set(s => ({
            user: s.user ? { ...s.user, lastLoginDate: todayStr, streak: newStreak } : null,
            showDailyLoginEffect: true
          }))

          // SYNC DATE & STREAK TO SUPABASE
          if (userId && userId !== 'demo-user') {
            supabase.from('profiles').update({
              last_login_date: todayStr,
              streak: newStreak,
              updated_at: new Date().toISOString()
            }).eq('id', userId).then(({ error }) => {
              if (error) {
                console.error("Failed to sync Login/Streak to DB:", error)
              } else {
                console.log("Successfully synced Login/Streak to DB:", newStreak)
              }
            })
          }

        } else {
          console.log('[Store] Already logged in today. Current Streak:', newStreak)

          // Ensure DB is consistent even if already logged in locally
          if (userId && userId !== 'demo-user') {
            supabase.from('profiles').update({
              streak: newStreak,
              updated_at: new Date().toISOString()
            }).eq('id', userId).then(({ error }) => {
              if (error) console.error("Failed to sync Streak consistency:", error)
            })
          }
        }
      },

      // User actions
      setUser: (user) => set((state) => {
        // Safe merge with existing user data if available
        const existingUser = state.user || {
          id: "temp-id",
          name: "Guest",
          email: "guest@example.com",
          isPremium: false,
          level: 1,
          currentXP: 0
        };




        return {
          user: {
            ...existingUser,
            ...user,
            level: user?.level ?? existingUser.level ?? 1,
            currentXP: user?.currentXP ?? existingUser.currentXP ?? 0,
            lastLoginDate: user?.lastLoginDate ?? existingUser.lastLoginDate, // JAGA FIELD INI AGAR TIDAK HILANG
            streak: user?.streak ?? existingUser.streak ?? 0
          } as AppState['user']
        };
      }),


      // Notes actions
      setNotes: (notes) => set({ notes }),
      addNote: (note) => {
        get().addXP(100) // Reward +100 XP for creating note bundle
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: note.id || Math.random().toString(36).substring(7),
              createdAt: note.createdAt || new Date(),
              updatedAt: note.updatedAt || new Date(),
            } as Note,
          ],
        }))
      },

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
      setFlashcards: (flashcards) => set({ flashcards }),
      addFlashcard: (flashcard, options) => {
        const { flashcards } = get()
        if (flashcard.id && flashcards.some((f) => f.id === flashcard.id)) return

        // Reward +10 XP point for manual creation (only if NOT created by system/bundled)
        if (!options?.fromBundle) {
          get().addXP(10)
        }

        set((state) => ({
          flashcards: [
            ...state.flashcards,
            {
              ...flashcard,
              id: flashcard.id || Math.random().toString(36).substring(7),
              createdAt: flashcard.createdAt || new Date(),
            } as Flashcard,
          ],
        }))
      },

      updateFlashcard: (id, updates) => {


        set((state) => ({
          flashcards: state.flashcards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
        }))
      },

      deleteFlashcard: (id) =>
        set((state) => ({
          flashcards: state.flashcards.filter((card) => card.id !== id),
        })),

      // Quizzes actions
      setQuizzes: (quizzes) => set({ quizzes }),
      addQuiz: (quiz) => {
        const { quizzes } = get()
        if (quiz.id && quizzes.some((q) => q.id === quiz.id)) return
        set((state) => ({
          quizzes: [
            ...state.quizzes,
            {
              ...quiz,
              id: quiz.id || Math.random().toString(36).substring(7),
              createdAt: quiz.createdAt || new Date(),
            } as Quiz,
          ],
        }))
      },

      updateQuiz: (id, updates) => {
        // Jika kuis baru saja diselesaikan (ada score dan sebelumnya belum ada), beri XP
        // Gamification Logic
        if (updates.score !== undefined) {
          const currentQuiz = get().quizzes.find(q => q.id === id)

          if (currentQuiz) {
            let earnedXP = 0
            const isFirstTime = !currentQuiz.completedAt
            const previousScore = currentQuiz.score || 0

            // 1. Participation Reward
            if (isFirstTime) {
              earnedXP += 20 // Base First Clear
            } else {
              earnedXP += 5 // Retake/Drill Reward (Small incentive)
            }

            // 2. Perfect Score Bonus (100 XP)
            // Awarded if this run is perfect AND (it's the first run OR previous run wasn't perfect)
            if (updates.score === 100) {
              if (isFirstTime || previousScore < 100) {
                earnedXP += 100
              }
            }

            if (earnedXP > 0) {
              get().addXP(earnedXP)
            }
          }
        }

        set((state) => ({
          quizzes: state.quizzes.map((quiz) => (quiz.id === id ? { ...quiz, ...updates } : quiz)),
        }))
      },

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

      // Mindmaps actions
      setMindmaps: (mindmaps) => set({ mindmaps }),

      addMindmap: (mindmap) => {
        const { mindmaps } = get()
        // Replace existing mindmap for same noteId
        const existingIndex = mindmaps.findIndex((m) => m.noteId === mindmap.noteId)

        if (existingIndex >= 0) {
          // Update existing
          set((state) => ({
            mindmaps: state.mindmaps.map((m, idx) =>
              idx === existingIndex
                ? {
                  ...mindmap,
                  id: m.id,
                  createdAt: m.createdAt,
                  updatedAt: new Date(),
                } as Mindmap
                : m
            ),
          }))
        } else {
          // Add new
          set((state) => ({
            mindmaps: [
              ...state.mindmaps,
              {
                ...mindmap,
                id: mindmap.id || crypto.randomUUID(),
                createdAt: mindmap.createdAt || new Date(),
                updatedAt: mindmap.updatedAt || new Date(),
              } as Mindmap,
            ],
          }))
        }
      },

      updateMindmap: (id, updates) =>
        set((state) => ({
          mindmaps: state.mindmaps.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
          ),
        })),

      deleteMindmap: (id) =>
        set((state) => ({
          mindmaps: state.mindmaps.filter((m) => m.id !== id),
        })),

      getMindmapByNoteId: (noteId) => {
        return get().mindmaps.find((m) => m.noteId === noteId)
      },

      activeUploads: [],

      addActiveUpload: (upload) => {
        console.log('[Store] Adding active upload:', upload.fileName)
        set((state) => ({ activeUploads: [...state.activeUploads, upload] }))
      },

      updateActiveUpload: (id, updates) => {
        console.log('[Store] Updating active upload:', id, updates)
        set((state) => ({
          activeUploads: state.activeUploads.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }))
      },

      removeActiveUpload: (id) => {
        console.log('[Store] Removing active upload:', id)
        set((state) => ({
          activeUploads: state.activeUploads.filter((u) => u.id !== id),
        }))
      },

      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
      resetDailyLoginEffect: () => set({ showDailyLoginEffect: false }),

      // Clear all data (but preserve activeUploads to maintain processing status)
      clearAll: () => set((state) => ({
        user: null,
        notes: [],
        flashcards: [],
        quizzes: [],
        materials: [],
        chatMessages: [],
        studySessions: [],
        mindmaps: [],
        activeNoteId: null,
        sidebarOpen: true,
        chatPanelOpen: false,
        hasInitialized: false,
        showDailyLoginEffect: false,
        // Keep activeUploads so processing status persists across navigation
      })),

      // Computed
      getActivityStats: () => {
        const state = get()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const totalStudyTime = state.studySessions
          .filter((session) => session.type === "focus")
          .reduce((acc, session) => acc + session.duration, 0)

        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const calculateTrend = (items: any[]) => {
          if (!items.length) return 0
          const recentCount = items.filter((item) => {
            const date = item.createdAt ? new Date(item.createdAt) : new Date()
            return date >= oneWeekAgo
          }).length
          const previousCount = items.length - recentCount

          if (previousCount === 0) return recentCount > 0 ? 100 : 0
          return Math.round((recentCount / previousCount) * 100)
        }

        // Calculate Streak
        const activityDates = new Set<string>()

        // Helper to get local YYYY-MM-DD string
        const getLocalDateString = (date: Date | string | undefined) => {
          if (!date) return null
          const d = new Date(date)
          if (isNaN(d.getTime())) return null

          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const addDate = (date: Date | string | undefined) => {
          const dateStr = getLocalDateString(date)
          if (dateStr) activityDates.add(dateStr)
        }

        state.notes.forEach(n => {
          addDate(n.createdAt)
          addDate(n.updatedAt)
          addDate(n.lastAccessedAt)
        })
        state.flashcards.forEach(f => addDate(f.createdAt))
        state.quizzes.forEach(q => {
          addDate(q.createdAt)
          addDate(q.completedAt)
        })
        state.studySessions.forEach(s => addDate(s.completedAt))

        const sortedDates = Array.from(activityDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        let streak = 0
        if (sortedDates.length > 0) {
          const todayStr = getLocalDateString(now) || ""

          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = getLocalDateString(yesterday) || ""

          // Streak continues if active today OR yesterday
          let currentDateStr = sortedDates[0] === todayStr ? todayStr : (sortedDates[0] === yesterdayStr ? yesterdayStr : null)


          if (currentDateStr) {
            streak = 1
            let checkDate = new Date(currentDateStr)

            // Check previous days
            while (true) {
              checkDate.setDate(checkDate.getDate() - 1)
              const checkStr = getLocalDateString(checkDate)
              if (checkStr && activityDates.has(checkStr)) {
                streak++
              } else {
                break
              }
            }
          }
        }

        // Calculate Longest Streak
        let longestStreak = 0
        if (sortedDates.length > 0) {
          longestStreak = 1
          let currentRun = 1

          for (let i = 0; i < sortedDates.length - 1; i++) {
            const currDate = new Date(sortedDates[i])
            const prevDate = new Date(sortedDates[i + 1])
            const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
              currentRun++
            } else {
              currentRun = 1
            }

            if (currentRun > longestStreak) {
              longestStreak = currentRun
            }
          }
        }

        const completedQuizzes = state.quizzes.filter(q => q.completedAt)

        return {
          totalNotes: state.notes.length,
          totalFlashcards: state.flashcards.length,
          totalQuizzes: completedQuizzes.length,
          totalQuizzesAvailable: state.quizzes.length,
          totalStudyTime,
          streak,
          longestStreak,
          lastActive: now,
          trends: {
            notes: calculateTrend(state.notes),
            flashcards: calculateTrend(state.flashcards),
            quizzes: calculateTrend(completedQuizzes.map(q => ({ ...q, createdAt: q.completedAt }))),
          }
        }
      },
    }),
    {
      name: "pelajarin-storage",
      partialize: (state) => {
        console.log('[Store] Persisting state, activeUploads count:', state.activeUploads.length)
        return {
          user: state.user,
          notes: state.notes,
          flashcards: state.flashcards,
          quizzes: state.quizzes,
          materials: state.materials,
          chatMessages: state.chatMessages,
          studySessions: state.studySessions,
          mindmaps: state.mindmaps,
          activeNoteId: state.activeNoteId,
          sidebarOpen: state.sidebarOpen,
          chatPanelOpen: state.chatPanelOpen,
          hasInitialized: state.hasInitialized,
          // Persist activeUploads but remove the non-serializable 'file' object
          activeUploads: state.activeUploads.map((u) => ({ ...u, file: undefined })),
        }
      },
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null
          try {
            const str = localStorage.getItem(name)
            if (!str) return null
            const parsed = JSON.parse(str)
            console.log('[Store] Loading from localStorage, activeUploads count:', parsed?.state?.activeUploads?.length || 0)
            return parsed
          } catch (error) {
            console.error('Error parsing localStorage:', error)
            // Clear corrupted data
            if (typeof window !== "undefined") localStorage.removeItem(name)
            return null
          }
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return
          try {
            // Use native JSON.stringify which handles special characters correctly
            const serialized = JSON.stringify(value)
            localStorage.setItem(name, serialized)
          } catch (error) {
            console.error('Error serializing to localStorage:', error)
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") localStorage.removeItem(name)
        },
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasInitialized(true)
      },
    },
  ),
)
