"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface PomodoroTimerProps {
  noteId?: string
}

export function PomodoroTimer({ noteId }: PomodoroTimerProps) {
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isFocus, setIsFocus] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const { addStudySession } = useStore()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleTimerComplete = () => {
    setIsRunning(false)

    // Add study session to store
    if (isFocus && noteId) {
      addStudySession({
        userId: "demo-user",
        noteId,
        duration: focusMinutes,
        type: "focus",
        completedAt: new Date(),
      })
    }

    // Play notification sound (simplified)
    const notification = new Notification(isFocus ? "Focus session complete!" : "Break complete!", {
      body: isFocus ? "Time for a break!" : "Time to focus!",
    })

    // Switch between focus and break
    setIsFocus(!isFocus)
    setTimeLeft(isFocus ? breakMinutes * 60 : focusMinutes * 60)
  }

  const toggleTimer = () => {
    // Request notification permission
    if (!isRunning && Notification.permission === "default") {
      Notification.requestPermission()
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(isFocus ? focusMinutes * 60 : breakMinutes * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = isFocus
    ? ((focusMinutes * 60 - timeLeft) / (focusMinutes * 60)) * 100
    : ((breakMinutes * 60 - timeLeft) / (breakMinutes * 60)) * 100

  const handleSettingsSave = (newFocus: number, newBreak: number) => {
    setFocusMinutes(newFocus)
    setBreakMinutes(newBreak)
    setTimeLeft(newFocus * 60)
    setIsFocus(true)
    setIsRunning(false)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className={cn("h-14 gap-3 shadow-lg", isFocus ? "bg-primary" : "bg-secondary")}
        >
          <span className="text-lg font-mono font-bold">
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </span>
          <div className={cn("h-2 w-2 rounded-full", isRunning ? "animate-pulse bg-primary-foreground" : "bg-muted")} />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-xl border-2">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", isFocus ? "bg-primary" : "bg-secondary")} />
                <span className="text-sm font-medium">{isFocus ? "Focus Time" : "Break Time"}</span>
              </div>
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pomodoro Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="focus-time">Focus Duration (minutes)</Label>
                        <Input
                          id="focus-time"
                          type="number"
                          min="1"
                          max="60"
                          defaultValue={focusMinutes}
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value)
                            if (value > 0) handleSettingsSave(value, breakMinutes)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="break-time">Break Duration (minutes)</Label>
                        <Input
                          id="break-time"
                          type="number"
                          min="1"
                          max="30"
                          defaultValue={breakMinutes}
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value)
                            if (value > 0) handleSettingsSave(focusMinutes, value)
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold tabular-nums">
                    {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isFocus ? `${focusMinutes} min session` : `${breakMinutes} min break`}
                  </p>
                </div>
              </div>

              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-1000", isFocus ? "bg-primary" : "bg-secondary")}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={toggleTimer} className="flex-1 gap-2">
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetTimer} className="gap-2 bg-transparent">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
