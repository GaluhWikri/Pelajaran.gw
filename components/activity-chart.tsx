"use client"

import { useMemo, useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { subDays, format } from "date-fns"
import { id } from "date-fns/locale"

export function ActivityChart() {
  const { notes, quizzes, flashcards, studySessions } = useStore()
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState("14")

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => {
    const range = parseInt(timeRange)
    const daysData = Array.from({ length: range }, (_, i) => {
      const d = subDays(new Date(), (range - 1) - i)
      return {
        date: d,
        label: range === 30 ? format(d, "dd", { locale: id }) : format(d, "EEE", { locale: id }),
        fullDate: format(d, "dd MMM yyyy", { locale: id }),
        notesCount: 0,
        editsCount: 0,
        quizzesTakenCount: 0,
        flashcardsCount: 0,
        total: 0,
      }
    })

    const getDayItem = (date: Date | string) => {
      const d = new Date(date)
      return daysData.find((day) =>
        format(day.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
      )
    }

    // Count notes (creation, updates, and accesses)
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

      // Count accesses/reads REMOVED - User requested removal to prevent spam and fix persistence issues.
      // We focus on Notes Created/Edited and Quizzes/Flashcards.
    })

    // Count quizzes (From Study Sessions Log - supports retakes!)
    studySessions.forEach((session) => {
      if (session.type === 'quiz') {
        const sessionDay = getDayItem(session.completedAt)
        if (sessionDay) {
          sessionDay.quizzesTakenCount += 1
          sessionDay.total += 1
        }
      }
    })

    // Count quizzes (Historical / Legacy Data)
    // Restore history for quizzes taken BEFORE the StudySession tracking system was added.
    quizzes.forEach((quiz) => {
      if (quiz.completedAt) {
        // Check if this completion is already counted in the loop above
        const isAlreadyCounted = studySessions.some(s =>
          s.type === 'quiz' &&
          s.noteId === quiz.noteId &&
          Math.abs(new Date(s.completedAt).getTime() - new Date(quiz.completedAt!).getTime()) < 5000 // 5 sec tolerance
        )

        if (!isAlreadyCounted) {
          const quizDay = getDayItem(quiz.completedAt)
          if (quizDay) {
            quizDay.quizzesTakenCount += 1
            quizDay.total += 1
          }
        }
      }
    })

    // Count flashcards
    flashcards.forEach((card) => {
      const cardDay = getDayItem(card.createdAt)
      if (cardDay) {
        cardDay.flashcardsCount += 1
        cardDay.total += 1
      }
    })

    return daysData
  }, [notes, quizzes, flashcards, studySessions, timeRange])

  if (!mounted) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Harian (2 Minggu Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[240px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    )
  }

  const rangeLabel = {
    "7": "1 Minggu Terakhir",
    "14": "2 Minggu Terakhir",
    "30": "1 Bulan Terakhir",
  }[timeRange]

  return (
    <Card className="col-span-1 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Aktivitas Harian ({rangeLabel})</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Pilih Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">1 Minggu</SelectItem>
            <SelectItem value="14">2 Minggu</SelectItem>
            <SelectItem value="30">1 Bulan</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 min-h-[350px] pb-4 pl-2">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="label"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
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

                          {(data.notesCount > 0 || data.editsCount > 0 || data.quizzesTakenCount > 0 || data.flashcardsCount > 0) && (
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
                              {data.quizzesTakenCount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Quizzes Taken:</span>
                                  <span className="font-medium">{data.quizzesTakenCount}</span>
                                </div>
                              )}
                              {data.flashcardsCount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Flashcards:</span>
                                  <span className="font-medium">{data.flashcardsCount}</span>
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

