"use client"

import { useEffect, useState } from "react"
import { FileText, CreditCard, Trophy, TrendingUp, Flame, Crown } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { RecentActivity } from "@/components/recent-activity"
import { ActivityChart } from "@/components/activity-chart"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
export default function DashboardPage() {
  const { notes, flashcards, quizzes, addNote, addFlashcard, addQuiz, getActivityStats, clearAll, setUser, sidebarOpen } = useStore()
  const { user } = useAuth()
  const stats = getActivityStats()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    // Panggil sekali saat dashboard dimuat. Validasi tanggal sudah ada di dalam fungsi store.
    // Hanya panggil jika user valid untuk mencegah XP farming saat logout/login guest
    if (user?.id) {
      useStore.getState().checkDailyLogin(user.id)
    }
  }, [user])

  // Fetch user's data from Supabase when logged in
  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        // User not logged in, clear all data and show empty state
        clearAll()
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else if (profileData) {
          // Update store with real user data
          setUser({
            id: profileData.id,
            name: profileData.full_name || profileData.email,
            email: profileData.email,
            avatar: profileData.avatar_url,
            isPremium: profileData.is_premium || false,
            // Load Gamification Data from DB
            level: profileData.level || 1,
            currentXP: profileData.current_xp || 0,
            lastLoginDate: profileData.last_login_date || undefined
          })
        }

        // Fetch notes from Supabase
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (notesError) throw notesError

        // Clear existing data first
        // clearAll() - NO, clearAll resets everything including UI state. We just want to replace data.
        // Actually setNotes will replace.

        // Add fetched notes to store
        if (notesData && notesData.length > 0) {
          const mappedNotes = notesData.map((note) => ({
            id: note.id,
            userId: note.user_id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            isFavorite: note.is_favorite || false,
            createdAt: new Date(note.created_at),
            updatedAt: new Date(note.updated_at),
            lastAccessedAt: note.updated_at ? new Date(note.updated_at) : undefined // fallback
          }))
          useStore.getState().setNotes(mappedNotes)
        } else {
          useStore.getState().setNotes([])
        }

        // Fetch flashcards from Supabase
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (flashcardsError) {
          console.error('Error fetching flashcards:', flashcardsError)
        } else {
          if (flashcardsData && flashcardsData.length > 0) {
            const mappedFlashcards = flashcardsData.map((card) => ({
              id: card.id,
              noteId: card.note_id,
              userId: card.user_id,
              question: card.question,
              answer: card.answer,
              difficulty: card.difficulty || 'medium',
              nextReview: card.next_review ? new Date(card.next_review) : undefined,
              reviewCount: card.review_count || 0,
              createdAt: new Date(card.created_at),
            }))
            useStore.getState().setFlashcards(mappedFlashcards)
          } else {
            useStore.getState().setFlashcards([])
          }
        }

        // Fetch quizzes from Supabase
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (quizzesError) {
          console.error('Error fetching quizzes:', quizzesError)
        } else {
          if (quizzesData && quizzesData.length > 0) {
            const mappedQuizzes = quizzesData.map((quiz) => ({
              id: quiz.id,
              noteId: quiz.note_id,
              userId: quiz.user_id,
              title: quiz.title,
              questions: quiz.questions,
              score: quiz.score,
              completedAt: quiz.completed_at ? new Date(quiz.completed_at) : undefined,
              createdAt: new Date(quiz.created_at),
            }))
            useStore.getState().setQuizzes(mappedQuizzes)
          } else {
            useStore.getState().setQuizzes([])
          }
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, addNote, addFlashcard, addQuiz, clearAll, setUser])

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className={cn("pt-14 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balance">Welcome back!</h2>
            <p className="text-muted-foreground">Here's what's happening with your learning today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Level Progress Card - Spans 2 columns on large screens if needed, or just 1 */}
            <div className="col-span-full mb-4">
              <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">Level {useStore(state => state.user?.level || 1)}</h3>
                    {(() => {
                      const level = useStore(state => state.user?.level || 1)
                      let title = "Novice Learner"
                      let badgeImg = "/image/badges/novice learner.png"

                      if (level >= 50) {
                        title = "Master Learner"
                        badgeImg = "/image/badges/master learner.png"
                      } else if (level >= 26) {
                        title = "Advanced Scholar"
                        badgeImg = "/image/badges/advanced learner.png" // typo in filename source
                      }

                      return (
                        <div className="flex items-center gap-3 mt-3">
                          <img src={badgeImg} alt={title} className="w-12 h-12 object-contain drop-shadow-md" />
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Rank</p>
                            <p className="text-base font-bold text-primary">{title}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold">{useStore(state => state.user?.currentXP || 0)} XP</span>
                    <span className="text-muted-foreground text-sm"> / {(useStore(state => state.user?.level || 1)) * 300} XP</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, ((useStore(state => state.user?.currentXP || 0)) / ((useStore(state => state.user?.level || 1)) * 300)) * 100)}%`
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {((useStore(state => state.user?.level || 1)) * 300) - (useStore(state => state.user?.currentXP || 0))} XP to next level
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                      How to level up?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Level Up Guide 🚀</DialogTitle>
                      <DialogDescription>
                        Accumulate XP to climb the ranks and unlock new achievements!
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-primary">Activities & Rewards</h4>
                        <ul className="space-y-2 text-muted-foreground">
                          <li className="flex justify-between border-b pb-1">
                            <span>📝 Create a Note</span>
                            <span className="font-bold text-foreground">+100 XP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>🧠 Finish a Quiz</span>
                            <span className="font-bold text-foreground">+20 XP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>💯 Perfect Quiz Score (100)</span>
                            <span className="font-bold text-foreground">+50 XP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>📅 Daily Login</span>
                            <span className="font-bold text-foreground">+10 XP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>🔥 7-Day Streak</span>
                            <span className="font-bold text-foreground">+100 XP</span>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h4 className="font-semibold text-primary">Ranks</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                            <img src="/image/badges/novice learner.png" className="w-8 h-8 object-contain" />
                            <div>
                              <p className="font-bold text-xs uppercase">Level 1-25</p>
                              <p className="font-medium">Novice Learner</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                            <img src="/image/badges/advanced learner.png" className="w-8 h-8 object-contain" />
                            <div>
                              <p className="font-bold text-xs uppercase">Level 26-49</p>
                              <p className="font-medium">Advanced Scholar</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border">
                            <img src="/image/badges/master learner.png" className="w-8 h-8 object-contain" />
                            <div>
                              <p className="font-bold text-xs uppercase text-primary">Level 50+</p>
                              <p className="font-medium text-primary">Master Learner</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">Got it!</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <StatsCard
              title="Total Notes"
              value={isMounted ? stats.totalNotes : 0}
              icon={FileText}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.notes > 0 ? "+" : "") + stats.trends.notes : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.notes >= 0 : true
              }}
            />
            <StatsCard
              title="Flashcards"
              value={isMounted ? stats.totalFlashcards : 0}
              icon={CreditCard}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.flashcards > 0 ? "+" : "") + stats.trends.flashcards : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.flashcards >= 0 : true
              }}
            />
            <StatsCard
              title="Quizzes Taken"
              value={isMounted ? stats.totalQuizzes : 0}
              icon={Trophy}
              trend={{
                value: `${isMounted && stats.trends ? (stats.trends.quizzes > 0 ? "+" : "") + stats.trends.quizzes : 0}%`,
                positive: isMounted && stats.trends ? stats.trends.quizzes >= 0 : true
              }}
            />
            <StatsCard
              title="Streak Stats"
              value={
                <div className="flex items-center gap-2">
                  <span>{isMounted ? stats.streak : 0} days</span>
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                </div>
              }
              icon={TrendingUp}
              trend={{
                value: `Best Record: ${isMounted ? stats.longestStreak : 0} days`,
                positive: true
              }}
              className="border-primary/50 bg-primary/5"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ActivityChart />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
