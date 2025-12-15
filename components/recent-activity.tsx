"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CreditCard, Trophy } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity() {
  const { notes } = useStore()

  const activities = notes.slice(0, 5).map((note) => ({
    id: note.id,
    type: "note" as const,
    title: note.title,
    time: note.updatedAt,
  }))

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </p>
                </div>
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
