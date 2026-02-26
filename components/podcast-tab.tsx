"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Mic,
    Play,
    Pause,
    Loader2,
    Volume2,
    VolumeX,
    RotateCcw,
    RotateCw,
    Download,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    ChevronDown
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { PodcastDialogue } from "@/lib/types"
import { generatePodcastScript } from "@/lib/ai-service"
import { generatePodcastAudio, createAudioUrl, revokeAudioUrl, estimateDuration } from "@/lib/tts-service"
import { savePodcastToSupabase, getPodcastByNoteIdFromSupabase, uploadPodcastAudio } from "@/lib/supabase-helpers"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAudioPlayerStore } from "@/lib/audio-player-store"
import { useStore } from "@/lib/store"

interface PodcastTabProps {
    noteId: string
    noteTitle: string
    noteContent: string
}

export function PodcastTab({ noteId, noteTitle, noteContent }: PodcastTabProps) {
    const { user } = useAuth()
    const pathname = usePathname()
    const isPlayingRef = useRef(false) // Track if audio was playing before navigation


    // Global podcast generation state from store
    const { startPodcastGeneration, updatePodcastGenerationStatus, stopPodcastGeneration, generatingPodcastNoteIds } = useStore()
    const podcastGenStatus = generatingPodcastNoteIds[noteId] || null
    const isGeneratingScript = podcastGenStatus === 'script'
    const isGeneratingAudio = podcastGenStatus === 'audio'
    const isSaving = podcastGenStatus === 'saving'

    // State
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isTableMissing, setIsTableMissing] = useState(false)
    const [podcastId, setPodcastId] = useState<string | null>(null)
    const [podcastTitle, setPodcastTitle] = useState<string>("")
    const [dialogues, setDialogues] = useState<PodcastDialogue[]>([])
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })

    // Global audio player store
    const {
        isPlaying: globalIsPlaying,
        audioUrl: globalAudioUrl,
        showMiniPlayer: globalShowMiniPlayer,
        noteId: globalAudioNoteId,
        currentTime: globalCurrentTime,
        duration: globalDuration,
        volume: globalVolume,
        playbackSpeed: globalPlaybackSpeed,
        // Actions
        play: playGlobal,
        pause: pauseGlobal,
        setAudioData,
        setCurrentTime: setGlobalCurrentTime,
        setDuration: setGlobalDuration,
        setVolume: setGlobalVolume,
        setPlaybackSpeed: setGlobalPlaybackSpeed,
        hideMini,
        showMini
    } = useAudioPlayerStore()

    // Audio player state (local, will be synced with global)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const previousVolumeRef = useRef(1)
    const [activeDialogueIndex, setActiveDialogueIndex] = useState(-1)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const dialogueRefs = useRef<(HTMLDivElement | null)[]>([])
    // Ref to store resume time to handle race condition between state sync and audio loading
    const targetResumeTimeRef = useRef<number | null>(null)

    // Refs to store current values for cleanup access
    const audioStateRef = useRef({
        audioUrl: null as string | null,
        podcastTitle: "",
        noteId: "",
        dialogues: [] as PodcastDialogue[],
        currentTime: 0,
        duration: 0,
        volume: 1,
        isPlaying: false,
    })

    // Ref to store showMini function for cleanup
    const showMiniRef = useRef(showMini)
    useEffect(() => {
        showMiniRef.current = showMini
    }, [showMini])

    // Keep refs up to date
    useEffect(() => {
        const newState = {
            audioUrl,
            podcastTitle,
            noteId,
            dialogues,
            currentTime,
            duration,
            volume,
            isPlaying
        }

        if (audioUrl || !audioStateRef.current.audioUrl) {
            audioStateRef.current = newState
        }
    }, [audioUrl, podcastTitle, noteId, dialogues, currentTime, duration, volume, isPlaying])

    const isUnmountingRef = useRef(false)

    // Detect unmount
    useEffect(() => {
        return () => {
            isUnmountingRef.current = true
        }
    }, [])

    // Sync with global audio player - CONTINUOUS SINGLETON MODE
    useEffect(() => {
        // If this note is the active global audio context
        if (globalAudioNoteId === noteId) {
            // Keep UI in sync with global state
            setIsPlaying(globalIsPlaying)
            setCurrentTime(globalCurrentTime)
            if (globalDuration > 0) setDuration(globalDuration)
            setVolume(globalVolume)

            // Ensure mini player is hidden when we are on this tab
            if (globalShowMiniPlayer) {
                hideMini()
            }
        }
    }, [globalAudioNoteId, noteId, globalShowMiniPlayer, globalIsPlaying, globalCurrentTime, globalDuration, globalVolume, hideMini])

    // Cleanup on unmount - show mini player so it persists navigation
    useEffect(() => {
        return () => {
            console.log('[PodcastTab] Component unmounting, showing mini player')
            showMiniRef.current()
        }
    }, []) // Empty deps - only run on true unmount

    // Handle audio download - properly triggers file download instead of navigation
    const handleDownload = async () => {
        if (!audioUrl) return

        try {
            // Fetch the audio file as a blob
            const response = await fetch(audioUrl)
            const blob = await response.blob()

            // Create a download link
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `${podcastTitle || 'podcast'}.wav`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Clean up the blob URL
            URL.revokeObjectURL(downloadUrl)
        } catch (err) {
            console.error('Download failed:', err)
            setError('Gagal mengunduh audio. Coba lagi.')
        }
    }

    // Load existing podcast on mount
    useEffect(() => {
        const loadExistingPodcast = async () => {
            if (!noteId) return

            setIsLoading(true)
            setError(null)
            try {
                const { data, error: fetchError } = await getPodcastByNoteIdFromSupabase(noteId)

                if (fetchError) {
                    // Check if error is related to missing table (406 or specific code)
                    if (fetchError.code === '42P01' || fetchError.status === 406) {
                        setIsTableMissing(true)
                    } else {
                        setError("Gagal memuat podcast dari database.")
                    }
                }

                if (data) {
                    setPodcastId(data.id)
                    setPodcastTitle(data.title)
                    setDialogues(data.dialogues as PodcastDialogue[])
                    if (data.audio_url) {
                        setAudioUrl(data.audio_url)
                    }
                }
            } catch (err) {
                console.error("Failed to load podcast:", err)
                setError("Terjadi kesalahan teknis saat memuat data.")
            } finally {
                setIsLoading(false)
            }
        }

        loadExistingPodcast()
    }, [noteId])

    // Cleanup blob URL on unmount (only for local blobs)
    useEffect(() => {
        return () => {
            if (audioUrl && audioUrl.startsWith("blob:")) {
                revokeAudioUrl(audioUrl)
            }
        }
    }, [audioUrl])

    // Format time to mm:ss
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Ref for the scroll container viewport
    const scrollViewportRef = useRef<HTMLDivElement | null>(null)

    // Estimate which dialogue is currently playing based on time
    // Precise dialogue highlighting based on timestamps
    useEffect(() => {
        if (!dialogues.length || duration === 0) return

        // Check if we have precise timestamps (new generation method)
        const hasTimestamps = dialogues.some(d => d.timestamp !== undefined)

        if (hasTimestamps) {
            // Find dialogue matching current time
            const index = dialogues.findIndex(d => {
                const start = d.timestamp || 0
                const end = start + (d.audioDuration || 0)
                // Add specific buffer to end to prevent early switching
                return currentTime >= start && currentTime < end
            })

            if (index !== -1 && activeDialogueIndex !== index) {
                setActiveDialogueIndex(index)
                const activeElement = dialogueRefs.current[index]
                if (activeElement) {
                    activeElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    })
                }
            }
        } else {
            // Fallback: Estimation strategy for legacy podcasts
            const dialogueWeights = dialogues.map(d => d.text.length + 10)
            const totalWeight = dialogueWeights.reduce((a, b) => a + b, 0)
            let accumulatedWeight = 0
            const currentProgressWeight = (currentTime / duration) * totalWeight

            for (let i = 0; i < dialogueWeights.length; i++) {
                accumulatedWeight += dialogueWeights[i]
                if (currentProgressWeight <= accumulatedWeight) {
                    if (activeDialogueIndex !== i) {
                        setActiveDialogueIndex(i)
                        const activeElement = dialogueRefs.current[i]
                        if (activeElement) {
                            activeElement.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            })
                        }
                    }
                    break
                }
            }
        }
    }, [currentTime, duration, dialogues, activeDialogueIndex])

    // Generate podcast script and audio
    const handleGenerate = async () => {
        if (!noteContent.trim() || !user) return

        startPodcastGeneration(noteId, 'script')
        setDialogues([])
        setAudioUrl(null)
        setPodcastTitle("")
        setError(null)

        try {
            // Step 1: Generate script
            const { title, dialogues: generatedDialogues } = await generatePodcastScript(noteContent, noteTitle)
            setPodcastTitle(title)
            setDialogues(generatedDialogues)

            // Step 2: Save transcript to Supabase IMMEDIATELY (before audio)
            updatePodcastGenerationStatus(noteId, 'saving')
            const newPodcastId = podcastId || crypto.randomUUID()
            await savePodcastToSupabase({
                id: newPodcastId,
                noteId,
                userId: user.id,
                title,
                dialogues: generatedDialogues,
                audioUrl: undefined,
                duration: estimateDuration(generatedDialogues),
            })
            setPodcastId(newPodcastId)

            // Step 3: Try to generate audio (optional, may fail due to network)
            updatePodcastGenerationStatus(noteId, 'audio')
            setGenerationProgress({ current: 0, total: generatedDialogues.length })

            try {
                // generatePodcastAudio now returns object with blob and updated dialogues with timestamps
                const { audioBlob, dialogues: dialoguesWithTimestamps } = await generatePodcastAudio(generatedDialogues, (current, total) => {
                    setGenerationProgress({ current, total })
                })

                // Upload audio to storage
                const { url: uploadedUrl } = await uploadPodcastAudio(user.id, noteId, audioBlob)

                // Generate local URL for immediate playback
                const localUrl = createAudioUrl(audioBlob)
                setAudioUrl(uploadedUrl || localUrl)

                // Update local state with timestamped dialogues
                setDialogues(dialoguesWithTimestamps)

                // Update podcast with audio URL and timestamped dialogues
                // Using dialoguesWithTimestamps ensures we save precision data to DB
                await savePodcastToSupabase({
                    id: newPodcastId,
                    noteId,
                    userId: user.id,
                    title,
                    dialogues: dialoguesWithTimestamps,
                    audioUrl: uploadedUrl || undefined,
                    duration: estimateDuration(generatedDialogues),
                })
            } catch (audioError: any) {
                console.error("Audio generation failed:", audioError)
                setError(`Audio gagal: ${audioError.message}. Transcript sudah tersimpan.`)
            } finally {
                stopPodcastGeneration(noteId)
            }

        } catch (error: any) {
            console.error("Failed to generate podcast:", error)
            setError(`Gagal membuat podcast: ${error.message}`)
            stopPodcastGeneration(noteId)
        }
    }

    // Audio player controls - DELEGATE TO GLOBAL STORE
    const togglePlay = () => {
        if (!audioUrl) return

        // If this note is already the active global note
        if (globalAudioNoteId === noteId) {
            if (globalIsPlaying) {
                pauseGlobal()
            } else {
                playGlobal()
            }
        } else {
            // New playback - Play this note globally
            setAudioData({
                audioUrl,
                podcastTitle,
                noteId,
                dialogues,
                duration: duration || estimatedDurationValue
            })
            playGlobal()
            hideMini()
        }
    }

    const handleSeek = (value: number[]) => {
        const newTime = value[0]
        setCurrentTime(newTime)

        if (globalAudioNoteId === noteId) {
            setGlobalCurrentTime(newTime)
        }
    }

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0]
        setVolume(newVolume)

        if (globalAudioNoteId === noteId) {
            setGlobalVolume(newVolume)
        } else if (audioRef.current) {
            audioRef.current.volume = newVolume
        }

        // Update muted state based on volume
        setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
        if (isMuted) {
            // Unmute - restore previous volume
            const restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 1
            handleVolumeChange([restoreVolume])
        } else {
            // Mute - save current volume and set to 0
            previousVolumeRef.current = volume
            handleVolumeChange([0])
        }
    }

    const skip = (seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
        setCurrentTime(newTime)

        if (globalAudioNoteId === noteId) { // Typo fix: globalAudioNoteId
            setGlobalCurrentTime(newTime)
        } else if (audioRef.current) {
            audioRef.current.currentTime = newTime
        }
    }


    // Audio element event handlers
    const handleTimeUpdate = () => {
        if (!audioRef.current) return

        const time = audioRef.current.currentTime
        // Prevent overwriting state with 0 during initial load/buffering
        if (time > 0.5 || Math.abs(time - currentTime) > 1) {
            setCurrentTime(time)
        }
    }

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return
        setDuration(audioRef.current.duration)

        // Restore playback position from Ref (more reliable than state)
        if (targetResumeTimeRef.current !== null && targetResumeTimeRef.current > 0) {
            console.log('[PodcastTab] Restoring playback position from REF:', targetResumeTimeRef.current)
            audioRef.current.currentTime = targetResumeTimeRef.current
        } else if (currentTime > 0) {
            // Fallback to state
            if (audioRef.current.currentTime < 1) {
                audioRef.current.currentTime = currentTime
            }
        }

        // Auto-resume if playing
        if (isPlaying) {
            console.log('[PodcastTab] Auto-resuming playback')
            audioRef.current.play().catch(e => console.error("Auto-resume failed:", e))
        }
    }

    const handleCanPlay = () => {
        if (audioRef.current && targetResumeTimeRef.current !== null && targetResumeTimeRef.current > 0) {
            if (Math.abs(audioRef.current.currentTime - targetResumeTimeRef.current) > 1) {
                audioRef.current.currentTime = targetResumeTimeRef.current
            }
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setActiveDialogueIndex(-1)
    }

    const hasContent = noteContent && noteContent.trim().length > 0
    const estimatedDurationValue = dialogues.length > 0 ? estimateDuration(dialogues) : 0
    const isProcessing = isGeneratingScript || isGeneratingAudio || isSaving

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full p-4 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
                <p className="text-sm text-muted-foreground">Memuat podcast...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            {/* Table Missing Alert */}
            {isTableMissing && (
                <Alert variant="destructive" className="bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Setup Diperlukan</AlertTitle>
                    <AlertDescription>
                        Tabel database belum ditemukan. Pastikan Anda sudah menjalankan <strong>SQL Migration</strong> di Supabase Dashboard untuk mengaktifkan fitur ini.
                    </AlertDescription>
                </Alert>
            )}

            {/* General Error Alert */}
            {error && !isTableMissing && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-semibold">AI Podcast</h2>

                    {podcastId && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Tersimpan
                        </span>
                    )}
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={!hasContent || isProcessing || !user}
                    className="gap-2"
                >
                    {isGeneratingScript ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Membuat Script...
                        </>
                    ) : isGeneratingAudio ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Audio {generationProgress.current}/{generationProgress.total}
                        </>
                    ) : isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : dialogues.length > 0 ? (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Generate Ulang
                        </>
                    ) : (
                        <>
                            <Mic className="h-4 w-4" />
                            Generate Podcast
                        </>
                    )}
                </Button>
            </div>

            {/* No content state */}
            {!hasContent && (
                <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Mic className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Belum Ada Konten</h3>
                        <p className="text-muted-foreground text-sm">
                            Tambahkan ringkasan materi terlebih dahulu untuk generate podcast.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Loading state */}
            {isProcessing && (
                <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Loader2 className="h-16 w-16 text-orange-500 animate-spin mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {isGeneratingScript ? "Membuat Script Podcast..." :
                                isGeneratingAudio ? "Mengkonversi ke Audio..." :
                                    "Menyimpan ke Cloud..."}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {isGeneratingScript
                                ? "AI sedang menyusun dialog untuk 2 host podcast"
                                : isGeneratingAudio
                                    ? `Proses ${generationProgress.current} dari ${generationProgress.total} dialog`
                                    : "Mengunggah audio dan menyimpan metadata"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Podcast Player & Transcript */}
            {dialogues.length > 0 && !isProcessing && (
                <div className="flex flex-col flex-1 gap-4 min-h-0">
                    {/* Audio Player */}
                    <Card className="shrink-0 sticky top-[80px] z-20 shadow-md bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-start gap-2 line-clamp-2 md:items-center">
                                <Volume2 className="h-4 w-4 text-orange-500 mt-1 md:mt-0 shrink-0" />
                                <span className="wrap-break-word">{podcastTitle}</span>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Estimasi durasi: ~{Math.ceil(estimatedDurationValue / 60)} menit
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Hidden audio element */}
                            {/* Hidden audio element - ONLY render if not handled by global player */}
                            {audioUrl && (globalAudioNoteId !== noteId) && (
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    preload="auto"
                                    onCanPlay={handleCanPlay}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={handleEnded}
                                    onPlay={() => setIsPlaying(true)}
                                />
                            )}

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <Slider
                                    value={[currentTime]}
                                    max={duration || 100}
                                    step={0.1}
                                    onValueChange={handleSeek}
                                    disabled={!audioUrl}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-2 sm:gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => skip(-10)}
                                    disabled={!audioUrl}
                                    className="flex items-center gap-1 px-2"
                                >
                                    <RotateCcw className="h-5 w-5" />
                                    <span className="text-xs font-medium">10s</span>
                                </Button>

                                <Button
                                    size="icon"
                                    className="h-12 w-12 rounded-full"
                                    onClick={togglePlay}
                                    disabled={!audioUrl}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-6 w-6" />
                                    ) : (
                                        <Play className="h-6 w-6 ml-0.5" />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => skip(10)}
                                    disabled={!audioUrl}
                                    className="flex items-center gap-1 px-2"
                                >
                                    <span className="text-xs font-medium">10s</span>
                                    <RotateCw className="h-5 w-5" />
                                </Button>

                                {/* Speed Control */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs font-medium gap-1 ml-0 sm:ml-4"
                                            disabled={!audioUrl}
                                        >
                                            {globalPlaybackSpeed}x
                                            <ChevronDown className="h-3 w-3 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                            <DropdownMenuItem
                                                key={speed}
                                                onClick={() => setGlobalPlaybackSpeed(speed)}
                                                className={globalPlaybackSpeed === speed ? "bg-accent" : ""}
                                            >
                                                {speed}x
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleMute}
                                        className="hover:opacity-70 transition-opacity"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted || volume === 0 ? (
                                            <VolumeX className="h-4 w-4 text-white" />
                                        ) : (
                                            <Volume2 className="h-4 w-4 text-white" />
                                        )}
                                    </button>
                                    <Slider
                                        value={[volume]}
                                        max={1}
                                        step={0.1}
                                        onValueChange={handleVolumeChange}
                                        className="w-20 hidden sm:flex"
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDownload}
                                    disabled={!audioUrl}
                                    title="Download Audio"
                                >
                                    <Download className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transcript */}
                    <Card className="flex-1 min-h-[500px] h-[calc(100vh-300px)] flex flex-col bg-transparent">
                        <CardHeader className="pb-2 p-4 z-10 border-b shrink-0">
                            <CardTitle className="text-sm flex items-center gap-2">
                                📜 Transcript
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-0 relative">
                            {/* Custom Scroll Container for precise control */}
                            <div
                                ref={scrollViewportRef}
                                className="relative h-full overflow-y-auto px-4 py-4 scroll-smooth custom-scrollbar"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                <div className="space-y-6 pb-8">
                                    {dialogues.map((dialogue, index) => {
                                        const isHostA = dialogue.speaker === "A"
                                        return (
                                            <div
                                                key={index}
                                                ref={(el) => { dialogueRefs.current[index] = el }}
                                                className={cn(
                                                    "transition-all duration-300",
                                                    activeDialogueIndex === index && "opacity-100 scale-100",
                                                    activeDialogueIndex !== -1 && activeDialogueIndex !== index && "opacity-50 scale-95"
                                                )}
                                            >
                                                {/* Minimal Dot Style */}
                                                <div className={cn(
                                                    "px-4 py-3",
                                                    activeDialogueIndex === index && "bg-primary/10 rounded-xl"
                                                )}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {/* Minimal Dot Indicator */}
                                                        <span className={cn(
                                                            "w-2 h-2 rounded-full shrink-0",
                                                            isHostA ? "bg-blue-500" : "bg-pink-500"
                                                        )} />
                                                        <span className="text-xs font-semibold text-muted-foreground">
                                                            {isHostA ? "Galuh" : "Karin"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-foreground pl-4">
                                                        {dialogue.text}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Initial state - ready to generate */}
            {hasContent && dialogues.length === 0 && !isProcessing && (
                <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                            <Mic className="h-12 w-12 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Generate Podcast AI</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mb-4">
                            Ubah ringkasan materi Anda menjadi podcast dengan 2 host yang membahas topik secara interaktif.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span>Host Galuh (Penanya)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                                <span>Host Karin (Penjelas)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
