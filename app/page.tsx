"use client"

import { useEffect } from "react"
import { FileText, CreditCard, Trophy, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { RecentActivity } from "@/components/recent-activity"
import { useStore } from "@/lib/store"
import { mockNotes, mockFlashcards, mockQuizzes } from "@/lib/mock-data"

export default function DashboardPage() {
  const { notes, flashcards, quizzes, addNote, addFlashcard, addQuiz, getActivityStats } = useStore()
  const stats = getActivityStats()

  // Load mock data on first visit
  useEffect(() => {
    if (notes.length === 0) {
      mockNotes.forEach((note) => addNote(note))
      mockFlashcards.forEach((card) => addFlashcard(card))
      mockQuizzes.forEach((quiz) => addQuiz(quiz))
    }
  }, [])

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className="lg:pl-64 pt-16">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balance">Welcome back!</h2>
            <p className="text-muted-foreground">Here's what's happening with your learning today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Total Notes"
              value={stats.totalNotes}
              icon={FileText}
              trend={{ value: "+12%", positive: true }}
            />
            <StatsCard
              title="Flashcards"
              value={stats.totalFlashcards}
              icon={CreditCard}
              trend={{ value: "+8%", positive: true }}
            />
            <StatsCard
              title="Quizzes Taken"
              value={stats.totalQuizzes}
              icon={Trophy}
              trend={{ value: "+23%", positive: true }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Activity Chart was here, effectively removed column span usage by wrapping RecentActivity or just letting it fill */}
              <RecentActivity />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Learning Streak</h3>
                  <p className="text-sm text-muted-foreground">Keep up the great work!</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">7</span>
                <span className="text-muted-foreground">days</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
