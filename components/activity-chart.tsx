"use client"

import { useMemo, useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { subDays, format } from "date-fns"
import { id } from "date-fns/locale"

export function ActivityChart() {
  const { notes, quizzes } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return {
        date: d,
        label: format(d, "EEE", { locale: id }), // Mon, Tue, etc. in Indonesian
        fullDate: format(d, "dd MMM yyyy", { locale: id }),
        notesCount: 0,
        editsCount: 0,
        quizzesCount: 0,
        total: 0,
      }
    })

    const getDayItem = (date: Date | string) => {
      const d = new Date(date)
      return last7Days.find((day) =>
        format(day.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
      )
    }

    // Count notes (creation and updates)
    notes.forEach((note) => {
      const createdDay = getDayItem(note.createdAt)
      if (createdDay) {
        createdDay.notesCount += 1
        createdDay.total += 1
      }

      // If updated on a different day, count as separate activity
      if (note.updatedAt) {
        const createdStr = format(new Date(note.createdAt), "yyyy-MM-dd")
        const updatedStr = format(new Date(note.updatedAt), "yyyy-MM-dd")
        if (createdStr !== updatedStr) {
          const updatedDay = getDayItem(note.updatedAt)
          if (updatedDay) {
            updatedDay.editsCount += 1
            updatedDay.total += 1
          }
        }
      }
    })

    // Count quizzes
    quizzes.forEach((quiz) => {
      const quizDay = getDayItem(quiz.createdAt)
      if (quizDay) {
        quizDay.quizzesCount += 1
        quizDay.total += 1
      }
    })

    return last7Days
  }, [notes, quizzes])

  if (!mounted) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Aktivitas Harian (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[240px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Aktivitas Harian (7 Hari Terakhir)</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="label"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md min-w-[150px]">
                        <div className="space-y-2">
                          <div>
                            <span className="text-[0.70rem] uppercase text-muted-foreground block mb-1">
                              {data.fullDate}
                            </span>
                            <span className="font-bold text-lg">
                              {data.total} Activities
                            </span>
                          </div>

                          {(data.notesCount > 0 || data.editsCount > 0 || data.quizzesCount > 0) && (
                            <div className="border-t pt-2 space-y-1 text-xs">
                              {data.notesCount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Notes Created:</span>
                                  <span className="font-medium">{data.notesCount}</span>
                                </div>
                              )}
                              {data.editsCount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Edits:</span>
                                  <span className="font-medium">{data.editsCount}</span>
                                </div>
                              )}
                              {data.quizzesCount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Quizzes:</span>
                                  <span className="font-medium">{data.quizzesCount}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
