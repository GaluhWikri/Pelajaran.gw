"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useAudioPlayerStore } from "@/lib/audio-player-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, X, Volume2, GripVertical, Mic, RotateCcw, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FloatingAudioPlayer() {
    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackSpeed,
        audioUrl,
        podcastTitle,
        noteId,
        showMiniPlayer,
        position,
        play,
        pause,
        setCurrentTime,
        setDuration,
        setVolume,
        setPlaybackSpeed,
        setPosition,
        closePlayer,
    } = useAudioPlayerStore()

    const pathname = usePathname()

    // Close player when navigating to a different note
    useEffect(() => {
        if (noteId && pathname) {
            const isOnSameNote = pathname.includes(`/notes/${noteId}`)
            if (!isOnSameNote) {
                // User navigated away from this note, close player
                console.log('[FloatingAudioPlayer] Navigated away from note, closing player')
                closePlayer()
            }
        }
    }, [pathname, noteId, closePlayer])



    const audioRef = useRef<HTMLAudioElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    // Ref to track if a play request is pending to avoid interruption errors
    const isPlayPendingRef = useRef(false)

    // Sync audio element with store state
    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !audioUrl) return

        if (isPlaying) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                isPlayPendingRef.current = true
                playPromise
                    .then(() => {
                        isPlayPendingRef.current = false
                        // Check if we need to pause immediately after play success
                        // (if user paused while we were waiting for play to start)
                        // However, the next effect run handles that part.
                    })
                    .catch(error => {
                        isPlayPendingRef.current = false
                        // Ignore "The play() request was interrupted" error
                        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                            console.error("Audio playback error:", error)
                        }
                    })
            }
        } else {
            // Only pause if not pending play, or if pending, we rely on the AbortError handling above
            if (!isPlayPendingRef.current) {
                audio.pause()
            } else {
                // Determine if calling pause() on a pending promise is safe if we catch the error.
                // Yes, it triggers the AbortError in the promise above.
                audio.pause()
            }
        }
    }, [isPlaying, audioUrl])

    // Sync volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Sync currentTime from store to audio element (for external seeks like skip button)
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        // Only seek if difference is significant (> 1 second)
        // This prevents loops from normal playback updates
        const diff = Math.abs(audio.currentTime - currentTime)
        if (diff > 1) {
            audio.currentTime = currentTime
        }
    }, [currentTime])

    // Sync playback speed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed
        }
    }, [playbackSpeed])

    // Handle time update
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime
            // Only update store if time is valid (> 0) or if we are scrubbing/playing normally
            // This prevents overwriting the store with 0 during initial load/buffering
            if (time > 0.5 || Math.abs(time - currentTime) > 1) {
                setCurrentTime(time)
            }
        }
    }

    // Handle loaded metadata - sync currentTime and auto-play
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
            // Restore playback position from store
            if (currentTime > 0) {
                // Determine if the current time is valid for this audio
                // Sometimes metadata load is for a new audio, but currentTime is from old audio?
                // No, we reset currentTime to 0 in setAudioData if URL changes.
                // So currentTime here SHOULD be valid for this URL.
                audioRef.current.currentTime = currentTime
            }

            // Auto-resume if playing
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Auto-resume failed:", e))
            }
        }
    }

    // Handle can play - start playing if isPlaying is true
    const handleCanPlay = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(console.error)
        }
    }

    // Handle ended
    const handleEnded = () => {
        pause()
        setCurrentTime(0)
    }

    // Seek to position
    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
        // Initialize local position from current rendered position
        setLocalPosition({
            x: rect.left,
            y: rect.top,
        })
        setIsDragging(true)
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return

        const newX = e.clientX - dragOffsetRef.current.x
        const newY = e.clientY - dragOffsetRef.current.y

        // Keep within viewport bounds
        const maxX = window.innerWidth - containerRef.current.offsetWidth
        const maxY = window.innerHeight - containerRef.current.offsetHeight

        // Update local state only (fast, no store write)
        setLocalPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        })
    }, [isDragging])

    const handleMouseUp = useCallback(() => {
        // Persist final position to store
        if (localPosition) {
            setPosition(localPosition)
        }
        setLocalPosition(null)
        setIsDragging(false)
    }, [localPosition, setPosition])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current) return

        const touch = e.touches[0]
        const rect = containerRef.current.getBoundingClientRect()
        dragOffsetRef.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        }
        setLocalPosition({
            x: rect.left,
            y: rect.top,
        })
        setIsDragging(true)
    }, [])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !containerRef.current) return

        const touch = e.touches[0]
        const newX = touch.clientX - dragOffsetRef.current.x
        const newY = touch.clientY - dragOffsetRef.current.y

        const maxX = window.innerWidth - containerRef.current.offsetWidth
        const maxY = window.innerHeight - containerRef.current.offsetHeight

        setLocalPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        })
    }, [isDragging])

    const handleTouchEnd = useCallback(() => {
        if (localPosition) {
            setPosition(localPosition)
        }
        setLocalPosition(null)
        setIsDragging(false)
    }, [localPosition, setPosition])

    // Add/remove event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            window.addEventListener("touchmove", handleTouchMove)
            window.addEventListener("touchend", handleTouchEnd)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            window.removeEventListener("touchmove", handleTouchMove)
            window.removeEventListener("touchend", handleTouchEnd)
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

    // Calculate style for position
    const getPositionStyle = (): React.CSSProperties => {
        // During drag, use local position for instant feedback
        if (localPosition) {
            return {
                top: `${localPosition.y}px`,
                left: `${localPosition.x}px`,
            }
        }

        if (position.x === -1 || position.y === -1) {
            // Default position: bottom-right
            return {
                bottom: "24px",
                right: "24px",
            }
        }
        // Custom position (from store)
        return {
            top: `${position.y}px`,
            left: `${position.x}px`,
        }
    }

    // Don't render anything if no audio URL is set
    if (!audioUrl) {
        return null
    }

    return (
        <>
            {/* Persist audio element regardless of showMiniPlayer state */}
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={handleCanPlay}
                onEnded={handleEnded}
            />

            {/* Floating player UI - Only show if enabled */}
            {showMiniPlayer && (
                <div
                    ref={containerRef}
                    className={cn(
                        "fixed z-100 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl",
                        !isDragging && "transition-all duration-200",
                        isDragging && "cursor-grabbing",
                        isExpanded ? "w-80" : "w-72"
                    )}
                    style={{
                        ...getPositionStyle(),
                        userSelect: isDragging ? "none" : "auto",
                    }}
                >
                    {/* Drag handle */}
                    <div
                        className="flex items-center justify-between px-3 py-2 cursor-grab border-b border-border/50"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <Mic className="h-4 w-4 text-orange-500" />
                                </div>
                                <div className="min-w-0">
                                    <Link
                                        href={`/notes/${noteId}`}
                                        className="text-sm font-medium truncate block hover:text-orange-500 transition-colors"
                                        title={podcastTitle}
                                    >
                                        {podcastTitle.length > 20 ? podcastTitle.slice(0, 20) + "..." : podcastTitle}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">Podcast</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                closePlayer()
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Player controls */}
                    <div className="p-3 space-y-3">
                        {/* Progress bar */}
                        <div className="space-y-1">
                            <Slider
                                value={[currentTime]}
                                max={duration || 100}
                                step={0.1}
                                onValueChange={handleSeek}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-3">
                            {/* Skip Back */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-0.5 h-8 px-2"
                                onClick={() => {
                                    const newTime = Math.max(0, currentTime - 10)
                                    setCurrentTime(newTime)
                                    if (audioRef.current) audioRef.current.currentTime = newTime
                                }}
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="text-[10px]">10s</span>
                            </Button>

                            {/* Play/Pause */}
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600"
                                onClick={() => isPlaying ? pause() : play()}
                            >
                                {isPlaying ? (
                                    <Pause className="h-5 w-5 text-white" />
                                ) : (
                                    <Play className="h-5 w-5 text-white ml-0.5" />
                                )}
                            </Button>

                            {/* Skip Forward */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-0.5 h-8 px-2"
                                onClick={() => {
                                    const newTime = Math.min(duration, currentTime + 10)
                                    setCurrentTime(newTime)
                                    if (audioRef.current) audioRef.current.currentTime = newTime
                                }}
                            >
                                <span className="text-[10px]">10s</span>
                                <RotateCw className="h-4 w-4" />
                            </Button>

                            {/* Speed Control */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-1.5 text-[10px] font-medium"
                                    >
                                        {playbackSpeed}x
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                        <DropdownMenuItem
                                            key={speed}
                                            onClick={() => setPlaybackSpeed(speed)}
                                            className={playbackSpeed === speed ? "bg-accent" : ""}
                                        >
                                            {speed}x
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
