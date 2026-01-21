"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CreditCard, Trophy, ChevronRight } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity() {
  const router = useRouter()
  const { notes, quizzes, flashcards, setActiveNote } = useStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const allActivities = [
    ...notes.map(note => ({
      id: note.id,
      noteId: note.id,
      type: "note" as const,
      title: note.title,
      time: new Date(Math.max(new Date(note.updatedAt).getTime(), note.lastAccessedAt ? new Date(note.lastAccessedAt).getTime() : 0))
    })),
    ...quizzes.map(quiz => ({
      id: quiz.id,
      noteId: quiz.noteId,
      type: "quiz" as const,
      title: quiz.title,
      time: quiz.completedAt ? new Date(quiz.completedAt) : new Date(quiz.createdAt)
    })),
    ...flashcards.map(card => ({
      id: card.id,
      noteId: card.noteId,
      type: "flashcard" as const,
      title: card.question,
      time: new Date(card.createdAt)
    }))
  ]

  const sortedActivities = allActivities.sort((a, b) => b.time.getTime() - a.time.getTime())
  const activities = sortedActivities.slice(0, 6)

  const getIcon = (type: string) => {
    switch (type) {
      case "note":
        return FileText
      case "flashcard":
        return CreditCard
      case "quiz":
        return Trophy
      default:
        return FileText
    }
  }

  const handleActivityClick = (activity: typeof activities[0]) => {
    if (activity.noteId) {
      setActiveNote(activity.noteId)
      // Navigate to the specific note page with tab based on activity type
      if (activity.type === "quiz") {
        router.push(`/notes/${activity.noteId}?tab=quiz`)
      } else if (activity.type === "flashcard") {
        router.push(`/notes/${activity.noteId}?tab=flashcards`)
      } else {
        router.push(`/notes/${activity.noteId}`)
      }
    }
  }

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading activity...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full gap-2">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm sm:text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 sm:space-y-2">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div
                key={`${activity.type}-${activity.id}`}
                onClick={() => handleActivityClick(activity)}
                className="flex items-center gap-3 sm:gap-4 p-2 -mx-2 rounded-lg cursor-pointer hover:bg-accent/50 active:bg-accent/70 transition-colors group"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium leading-tight truncate">{activity.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )
          })}
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

