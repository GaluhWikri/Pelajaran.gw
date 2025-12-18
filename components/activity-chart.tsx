"use client"

import { useMemo, useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { subDays, format } from "date-fns"
import { id } from "date-fns/locale"

export function ActivityChart() {
  const { notes } = useStore()
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
        count: 0,
      }
    })

    // Count notes per day
    notes.forEach((note) => {
      const noteDate = new Date(note.createdAt)
      const DayItem = last7Days.find((day) =>
        format(day.date, "yyyy-MM-dd") === format(noteDate, "yyyy-MM-dd")
      )
      if (DayItem) {
        DayItem.count += 1
      }
    })

    return last7Days
  }, [notes])

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
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {data.fullDate}
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.count} Notes
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="count"
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
