"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Zap,
  Network,
  Mic,
  Play,
  Pause,
  RefreshCw,
  File,
  Video,
  Music,
  Check,
  X,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types of source files for simulator
type SourceType = "pdf" | "video" | "voice"

interface SourceFile {
  id: SourceType
  name: string
  size: string
  icon: React.ComponentType<{ className?: string }>
  typeLabel: string
}

const sourceFiles: SourceFile[] = [
  { id: "pdf", name: "catatan-kalkulus.pdf", size: "2.4 MB", icon: File, typeLabel: "Dokumen PDF" },
  { id: "video", name: "Kalkulus_Dasar_Turunan.mp4", size: "YouTube Link", icon: Video, typeLabel: "Video YouTube" },
  { id: "voice", name: "rekaman-kuliah-sejarah.mp3", size: "12.8 MB", icon: Music, typeLabel: "Rekaman Suara" }
]

const resultTabs = [
  { id: "summary", label: "Ringkasan", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "flashcards", label: "Flashcards", icon: BrainIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "quiz", label: "Kuis", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: "mindmap", label: "Mindmap", icon: Network, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "podcast", label: "Podcast AI", icon: Mic, color: "text-emerald-500", bg: "bg-emerald-500/10" },
]

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v12" />
      <path d="M8 10c0-2.2 1.8-4 4-4" />
      <path d="M16 10c0-2.2-1.8-4-4-4" />
      <path d="M8 14c0 2.2 1.8 4 4 4" />
      <path d="M16 14c0 2.2-1.8 4-4 4" />
    </svg>
  )
}

export function ProcessDemo() {
  const [step, setStep] = useState<number>(0)
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true)

  // Step 0 states
  const [selectedSource, setSelectedSource] = useState<SourceType>("pdf")
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // Step 1 states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false)

  // Step 2 states
  const [activeResultTab, setActiveResultTab] = useState<string>("summary")
  const [quizAnswer, setQuizAnswer] = useState<"correct" | "incorrect" | null>(null)
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false)
  const [podcastPlaying, setPodcastPlaying] = useState<boolean>(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const activeSourceInfo = sourceFiles.find(f => f.id === selectedSource) || sourceFiles[0]
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Autoplay Logic
  useEffect(() => {
    if (!isAutoPlay) return

    const cycleSteps = () => {
      if (step === 0) {
        // Start upload simulation
        setIsUploading(true)
        setUploadProgress(0)
        let prog = 0
        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = setInterval(() => {
          prog += 10
          if (prog >= 100) {
            setUploadProgress(100)
            setIsUploading(false)
            if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
            // Wait 1.5 seconds and advance to step 1
            autoPlayTimerRef.current = setTimeout(() => {
              setStep(1)
            }, 1200)
          } else {
            setUploadProgress(prog)
          }
        }, 120)
      } else if (step === 1) {
        // AI processing simulation
        setTerminalLogs([])
        setIsProcessingComplete(false)
        const mockLogs = [
          `[AI] Membaca file ${activeSourceInfo.name}...`,
          `[AI] Mengekstrak transkrip & konsep utama...`,
          `[AI] Menganalisis dengan model Gemini 1.5 Flash...`,
          `[AI] Menghasilkan 5 modul materi belajar...`,
          `[AI] Penyusunan ringkasan, mindmap, kuis, & podcast selesai!`,
        ]

        let logIndex = 0
        if (logsTimerRef.current) clearInterval(logsTimerRef.current)
        logsTimerRef.current = setInterval(() => {
          if (logIndex < mockLogs.length) {
            setTerminalLogs(prev => [...prev, mockLogs[logIndex]])
            logIndex++
          } else {
            setIsProcessingComplete(true)
            if (logsTimerRef.current) clearInterval(logsTimerRef.current)
            // Wait 2 seconds and advance to step 2
            autoPlayTimerRef.current = setTimeout(() => {
              setStep(2)
            }, 1800)
          }
        }, 600)
      } else if (step === 2) {
        // Result page auto-rotation of tabs
        const tabsOrder = ["summary", "flashcards", "quiz", "mindmap", "podcast"]
        let currentTabIdx = 0
        setActiveResultTab("summary")
        setQuizAnswer(null)
        setFlashcardFlipped(false)
        setPodcastPlaying(false)
        setHoveredNode(null)

        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = setInterval(() => {
          currentTabIdx++
          if (currentTabIdx < tabsOrder.length) {
            setActiveResultTab(tabsOrder[currentTabIdx])
            setHoveredNode(null)
            // Extra mock actions
            if (tabsOrder[currentTabIdx] === "flashcards") {
              setTimeout(() => setFlashcardFlipped(true), 800)
            } else if (tabsOrder[currentTabIdx] === "quiz") {
              setTimeout(() => setQuizAnswer("correct"), 800)
            } else if (tabsOrder[currentTabIdx] === "podcast") {
              setTimeout(() => setPodcastPlaying(true), 600)
            }
          } else {
            if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
            // Cycle back to upload
            autoPlayTimerRef.current = setTimeout(() => {
              setStep(0)
            }, 2500)
          }
        }, 3000)
      }
    }

    cycleSteps()

    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
      if (logsTimerRef.current) clearInterval(logsTimerRef.current)
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
    }
  }, [step, isAutoPlay, selectedSource, activeSourceInfo])

  // Manual Step Trigger
  const handleStepClick = (newStep: number) => {
    setIsAutoPlay(false)
    setStep(newStep)
    // Reset specific states
    if (newStep === 0) {
      setUploadProgress(0)
      setIsUploading(false)
    } else if (newStep === 1) {
      setTerminalLogs([
        `[AI] Membaca file ${activeSourceInfo.name}...`,
        `[AI] Menganalisis isi materi secara komprehensif...`,
        `[AI] Menghasilkan ringkasan dan data pendukung...`,
        `[AI] Proses selesai!`
      ])
      setIsProcessingComplete(true)
    } else if (newStep === 2) {
      setActiveResultTab("summary")
      setQuizAnswer(null)
      setFlashcardFlipped(false)
      setPodcastPlaying(false)
      setHoveredNode(null)
    }
  }

  // Trigger manual upload simulation
  const startManualUpload = (sourceId: SourceType) => {
    setIsAutoPlay(false)
    setSelectedSource(sourceId)
    setIsUploading(true)
    setUploadProgress(0)

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
    uploadTimerRef.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          setIsUploading(false)
          if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
          return 100
        }
        return prev + 20
      })
    }, 150)
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Outer Card Container */}
      <div className="relative rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md border border-border shadow-2xl flex flex-col will-change-transform">

        {/* Header with Interactive Stepper and Autoplay indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 gap-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">AI Interactive Simulator</h3>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1.5 bg-muted/65 p-1 rounded-xl border border-border/50">
            {["Upload", "Proses AI", "Hasil Utama"].map((lbl, idx) => {
              const active = step === idx
              const completed = step > idx
              return (
                <button
                  key={idx}
                  onClick={() => handleStepClick(idx)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center gap-1.5",
                    active
                      ? "bg-orange-600 text-white shadow-md scale-105"
                      : completed
                        ? "text-orange-500 hover:bg-muted/80"
                        : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className={cn(
                    "w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] border",
                    active
                      ? "bg-white text-orange-600 border-white"
                      : completed
                        ? "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400"
                        : "bg-muted border-border"
                  )}>
                    {completed ? "✓" : idx + 1}
                  </span>
                  <span>{lbl}</span>
                </button>
              )
            })}
          </div>

          {/* Autoplay toggle */}
          <button
            onClick={() => {
              setIsAutoPlay(!isAutoPlay)
              // Reset state when toggling
              if (!isAutoPlay) setStep(0)
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all duration-300",
              isAutoPlay
                ? "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20"
                : "bg-muted text-muted-foreground border-border hover:bg-muted-foreground/10"
            )}
          >
            {isAutoPlay ? (
              <>
                <Pause className="h-3 w-3 animate-pulse" />
                <span>Simulasi Aktif</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>Mulai Auto Demo</span>
              </>
            )}
          </button>
        </div>

        {/* Content Section: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-115 divide-y lg:divide-y-0 lg:divide-x divide-border">

          {/* Left Column: Interactive Controls/Triggers */}
          <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-muted/10">
            <AnimatePresence mode="wait">
              {/* STEP 0: Upload Options */}
              {step === 0 && (
                <motion.div
                  key="controls-step-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex flex-col h-full justify-between"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-foreground">1. Pilih Sumber Belajar</h4>
                      <p className="text-sm text-muted-foreground">Pilih atau klik file di bawah ini untuk mensimulasikan proses upload instan.</p>
                    </div>

                    <div className="space-y-2.5">
                      {sourceFiles.map((file) => {
                        const Icon = file.icon
                        const isSelected = selectedSource === file.id
                        return (
                          <button
                            key={file.id}
                            onClick={() => startManualUpload(file.id)}
                            className={cn(
                              "w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 hover:scale-[1.02]",
                              isSelected
                                ? "bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/5"
                                : "bg-card/50 border-border hover:bg-card hover:border-orange-500/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2.5 rounded-xl transition-colors",
                                isSelected ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.typeLabel} • {file.size}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "text-xs font-semibold px-2 py-1 rounded-md",
                              isSelected ? "bg-orange-500/20 text-orange-500" : "bg-muted text-muted-foreground"
                            )}>
                              {isSelected ? "Terpilih" : "Gunakan"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <button
                      disabled={isUploading || uploadProgress < 100}
                      onClick={() => handleStepClick(1)}
                      className={cn(
                        "w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg",
                        uploadProgress === 100
                          ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.02]"
                          : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                      )}
                    >
                      <span>Proses dengan AI</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: AI Processing Logs */}
              {step === 1 && (
                <motion.div
                  key="controls-step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex flex-col h-full justify-between"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-foreground">2. Analisis Konten</h4>
                      <p className="text-sm text-muted-foreground">AI memproses konten Anda untuk memecah materi menjadi berbagai modul interaktif.</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-black/95 p-4 font-mono text-xs text-orange-400 space-y-2 h-55 overflow-y-auto custom-scrollbar shadow-inner">
                      <div className="flex items-center gap-2 border-b border-orange-950/50 pb-2 mb-2 text-orange-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="ml-2 text-[10px] uppercase font-bold tracking-wider">Gemini-1.5-Flash@system</span>
                      </div>

                      {terminalLogs.length === 0 && (
                        <div className="text-orange-600/60 italic animate-pulse">Memulai engine AI...</div>
                      )}

                      {terminalLogs.map((log, idx) => (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={idx}
                          className="leading-relaxed flex gap-2"
                        >
                          <span className="text-orange-600 select-none">&gt;</span>
                          <span>{log}</span>
                        </motion.div>
                      ))}

                      {isProcessingComplete && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-emerald-500 font-bold mt-3 border-t border-emerald-950/30 pt-2 flex items-center gap-1.5"
                        >
                          <Check className="h-4 w-4" />
                          <span>Materi Berhasil Dihasilkan!</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <button
                      disabled={!isProcessingComplete}
                      onClick={() => handleStepClick(2)}
                      className={cn(
                        "w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg",
                        isProcessingComplete
                          ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.02]"
                          : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                      )}
                    >
                      <span>Lihat Hasil Studi</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Results Selector */}
              {step === 2 && (
                <motion.div
                  key="controls-step-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex flex-col h-full justify-between"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-foreground">3. Hasil & Modul</h4>
                      <p className="text-sm text-muted-foreground">Klik tab di bawah untuk melihat preview interaktif dari hasil pemrosesan AI.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {resultTabs.map((tab) => {
                        const TabIcon = tab.icon
                        const isSelected = activeResultTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setIsAutoPlay(false)
                              setActiveResultTab(tab.id)
                              // Reset interactions
                              setQuizAnswer(null)
                              setFlashcardFlipped(false)
                              setPodcastPlaying(false)
                              setHoveredNode(null)
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-left flex items-center gap-3 transition-all duration-300 hover:scale-[1.01]",
                              isSelected
                                ? "bg-orange-500/10 border-orange-500/80 shadow-xs"
                                : "bg-card/50 border-border hover:bg-card hover:border-orange-500/20"
                            )}
                          >
                            <div className={cn("p-2 rounded-lg", tab.bg)}>
                              <TabIcon className={cn("h-4.5 w-4.5", tab.color)} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-xs text-foreground leading-none mb-1">{tab.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {tab.id === "summary" && "Ringkasan tulisan & poin inti"}
                                {tab.id === "flashcards" && "Review kartu bolak-balik"}
                                {tab.id === "quiz" && "Latihan soal & pembahasan"}
                                {tab.id === "mindmap" && "Visualisasi peta konsep"}
                                {tab.id === "podcast" && "Penjelasan audio dialog"}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <button
                      onClick={() => {
                        setIsAutoPlay(false)
                        setStep(0)
                        setUploadProgress(0)
                        setIsUploading(false)
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span>Ulangi Simulasi</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Sandbox Simulator Display */}
          <div className="lg:col-span-7 p-6 md:p-8 flex items-center justify-center bg-card/20 relative overflow-hidden">
            {/* Background grids */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30 dark:opacity-10 pointer-events-none" />

            <AnimatePresence mode="wait">
              {/* DISPLAY 0: UPLOAD ANIMATION */}
              {step === 0 && (
                <motion.div
                  key="display-step-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm relative z-10"
                >
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xl text-center space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-orange-500/3 to-transparent pointer-events-none" />

                    {/* Cloud Upload Icon */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: isUploading ? [1, 1.08, 1] : 1,
                            y: isUploading ? [0, -4, 0] : 0
                          }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner"
                        >
                          <Upload className="h-10 w-10" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground truncate">{activeSourceInfo.name}</h3>
                      <p className="text-xs text-muted-foreground">{activeSourceInfo.typeLabel} • {activeSourceInfo.size}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative border border-border/50">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-linear-to-r from-orange-500 to-amber-500 rounded-full"
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1.5">
                          {isUploading ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin text-orange-500" />
                              <span>Mengunggah...</span>
                            </>
                          ) : uploadProgress === 100 ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">✓ Upload Selesai</span>
                          ) : (
                            <span>Siap diunggah</span>
                          )}
                        </span>
                        <span className="font-bold text-foreground">{uploadProgress}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DISPLAY 1: PROCESSING ORBIT */}
              {step === 1 && (
                <motion.div
                  key="display-step-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm text-center space-y-6 relative z-10"
                >
                  <div className="relative w-36 h-36 mx-auto">
                    {/* Rotating Rings */}
                    <motion.div
                      className="absolute inset-0 rounded-full border border-dashed border-orange-500/40 border-t-orange-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-3 rounded-full border border-orange-500/20 border-b-amber-500"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-6 rounded-full border border-dashed border-purple-500/25 border-l-purple-500"
                      animate={{ rotate: 180 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Central Icon */}
                    <div className="absolute inset-9 bg-linear-to-tr from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Sparkles className="h-10 w-10 text-white fill-white/20" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-foreground">AI Memproses Materi</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Mengolah informasi menjadi ringkasan cerdas, flashcard, dan audio.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* DISPLAY 2: RESULT PREVIEWS */}
              {step === 2 && (
                <motion.div
                  key="display-step-2"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-md relative z-10"
                >
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xl min-h-75 flex flex-col justify-between">

                    {/* Dynamic View based on Active Tab */}
                    <div className="flex-1 flex flex-col justify-center">

                      {/* PREVIEW: SUMMARY */}
                      {activeResultTab === "summary" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 text-left"
                        >
                          <div className="flex items-center gap-2 border-b pb-2 border-border/80">
                            <FileText className="h-5 w-5 text-orange-500" />
                            <h4 className="font-bold text-sm text-foreground">Ringkasan Pintar</h4>
                          </div>

                          <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                            <p className="font-bold text-foreground">Topik: Konsep Turunan & Limit</p>
                            <p>📝 <strong>Turunan</strong> mengukur laju perubahan nilai fungsi terhadap variabel independennya.</p>
                            <p>📝 Rumus dasar untuk fungsi aljabar pangkat n: f(x) = x^n → f'(x) = n · x^(n-1).</p>
                            <p>📝 Digunakan secara luas untuk mencari gradien garis singgung kurva dan titik optimum.</p>
                          </div>
                        </motion.div>
                      )}

                      {/* PREVIEW: FLASHCARDS */}
                      {activeResultTab === "flashcards" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-4"
                        >
                          {/* 3D Flip Card */}
                          <div
                            onClick={() => {
                              setIsAutoPlay(false)
                              setFlashcardFlipped(!flashcardFlipped)
                            }}
                            className="w-70 h-40 cursor-pointer perspective-1000 group/card"
                          >
                            <motion.div
                              className="w-full h-full relative transform-style-3d transition-transform duration-500 rounded-2xl border border-orange-500/20"
                              animate={{ rotateY: flashcardFlipped ? 180 : 0 }}
                            >
                              {/* Front */}
                              <div className="absolute inset-0 backface-hidden bg-orange-500/5 dark:bg-orange-500/2 rounded-2xl p-5 flex flex-col justify-between text-center items-center">
                                <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider">Pertanyaan</span>
                                <p className="font-bold text-sm text-foreground my-auto px-2">Apa definisi dari Turunan (Derivative)?</p>
                                <span className="text-[10px] text-muted-foreground">Klik untuk membalik kartu</span>
                              </div>

                              {/* Back */}
                              <div className="absolute inset-0 backface-hidden bg-orange-600 text-white rounded-2xl p-5 flex flex-col justify-between text-center items-center rotate-y-180">
                                <span className="text-[10px] uppercase font-bold text-orange-100 tracking-wider">Jawaban</span>
                                <p className="font-medium text-xs my-auto leading-relaxed">
                                  Laju perubahan sesaat dari suatu fungsi terhadap perubahan variabel bebasnya.
                                </p>
                                <span className="text-[10px] text-orange-200">Klik untuk membalik kembali</span>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {/* PREVIEW: QUIZ */}
                      {activeResultTab === "quiz" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 text-left"
                        >
                          <div className="flex items-center gap-2 border-b pb-2 border-border/80">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <h4 className="font-bold text-sm text-foreground">Kuis Latihan</h4>
                          </div>

                          <div className="space-y-3">
                            <p className="font-bold text-xs text-foreground">Pertanyaan: Turunan pertama dari fungsi $f(x) = 3x^2 + 5x$ adalah...</p>

                            <div className="grid grid-cols-1 gap-2">
                              {[
                                { key: "a", text: "f'(x) = 3x + 5", status: "incorrect" },
                                { key: "b", text: "f'(x) = 6x + 5", status: "correct" },
                                { key: "c", text: "f'(x) = 6x", status: "incorrect" }
                              ].map((option) => {
                                const isClicked = quizAnswer !== null
                                const isSelected = quizAnswer === option.status
                                return (
                                  <button
                                    key={option.key}
                                    disabled={isClicked}
                                    onClick={() => {
                                      setIsAutoPlay(false)
                                      setQuizAnswer(option.status as any)
                                    }}
                                    className={cn(
                                      "p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all duration-300",
                                      isClicked
                                        ? option.status === "correct"
                                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                          : isSelected
                                            ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"
                                            : "bg-muted border-border text-muted-foreground/50"
                                        : "bg-card border-border hover:bg-muted/50 hover:border-orange-500/20"
                                    )}
                                  >
                                    <span>{option.key.toUpperCase()}. {option.text}</span>
                                    {isClicked && option.status === "correct" && (
                                      <Check className="h-4.5 w-4.5 text-emerald-500" />
                                    )}
                                    {isClicked && isSelected && option.status === "incorrect" && (
                                      <X className="h-4.5 w-4.5 text-red-500" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* PREVIEW: MINDMAP */}
                      {activeResultTab === "mindmap" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-1 w-full space-y-4"
                        >
                          {/* Animated SVG Mindmap */}
                          <div className="relative w-full max-w-[320px] bg-muted/20 rounded-2xl p-2 border border-border/50">
                            <svg className="w-full h-45" viewBox="0 0 300 180">
                              <defs>
                                <linearGradient id="grad-center" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                                <linearGradient id="grad-turunan" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                                <linearGradient id="grad-integral" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#14b8a6" />
                                </linearGradient>
                                <linearGradient id="grad-limit" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#a855f7" />
                                  <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>

                                <linearGradient id="line-turunan" x1="100%" y1="100%" x2="0%" y2="0%">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                                <linearGradient id="line-integral" x1="0%" y1="100%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                                <linearGradient id="line-limit" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>

                              {/* Connector Lines (Background Solid) */}
                              <line x1="150" y1="90" x2="60" y2="50" stroke="#cbd5e1" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                              <line x1="150" y1="90" x2="240" y2="50" stroke="#cbd5e1" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                              <line x1="150" y1="90" x2="150" y2="146" stroke="#cbd5e1" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />

                              {/* Animated Connector Lines (Data Flow) */}
                              <motion.line
                                x1="150" y1="90" x2="60" y2="50"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                                strokeDasharray="5 5"
                                animate={{ strokeDashoffset: [0, -20] }}
                                transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                              />
                              <motion.line
                                x1="150" y1="90" x2="240" y2="50"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeDasharray="5 5"
                                animate={{ strokeDashoffset: [0, -20] }}
                                transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                              />
                              <motion.line
                                x1="150" y1="90" x2="150" y2="146"
                                stroke="#a855f7"
                                strokeWidth="2.5"
                                strokeDasharray="5 5"
                                animate={{ strokeDashoffset: [0, -20] }}
                                transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                              />

                              {/* Central Node: Kalkulus */}
                              <motion.g
                                onMouseEnter={() => setHoveredNode("center")}
                                onMouseLeave={() => setHoveredNode(null)}
                                whileHover={{ scale: 1.05 }}
                                animate={{ y: [0, -2, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="cursor-pointer"
                              >
                                <rect x="105" y="72" width="90" height="36" rx="8" fill="url(#grad-center)" className="shadow-md" />
                                <text x="150" y="94" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Kalkulus</text>
                              </motion.g>

                              {/* Node 1: Turunan */}
                              <motion.g
                                onMouseEnter={() => setHoveredNode("turunan")}
                                onMouseLeave={() => setHoveredNode(null)}
                                whileHover={{ scale: 1.08 }}
                                animate={{ y: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                className="cursor-pointer"
                              >
                                <rect x="20" y="36" width="80" height="28" rx="8" fill="url(#grad-turunan)" className="shadow-md" />
                                <text x="60" y="53" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Turunan</text>
                              </motion.g>

                              {/* Node 2: Integral */}
                              <motion.g
                                onMouseEnter={() => setHoveredNode("integral")}
                                onMouseLeave={() => setHoveredNode(null)}
                                whileHover={{ scale: 1.08 }}
                                animate={{ y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
                                className="cursor-pointer"
                              >
                                <rect x="200" y="36" width="80" height="28" rx="8" fill="url(#grad-integral)" className="shadow-md" />
                                <text x="240" y="53" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Integral</text>
                              </motion.g>

                              {/* Node 3: Limit */}
                              <motion.g
                                onMouseEnter={() => setHoveredNode("limit")}
                                onMouseLeave={() => setHoveredNode(null)}
                                whileHover={{ scale: 1.08 }}
                                animate={{ y: [0, 2, 0] }}
                                transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                                className="cursor-pointer"
                              >
                                <rect x="110" y="132" width="80" height="28" rx="8" fill="url(#grad-limit)" className="shadow-md" />
                                <text x="150" y="149" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Limit</text>
                              </motion.g>
                            </svg>
                          </div>

                          {/* Interactive Description Tooltip */}
                          <div className="w-full text-center h-10 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={hoveredNode || "empty"}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                  "text-xs font-semibold px-4 py-1.5 rounded-full",
                                  hoveredNode
                                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/15"
                                    : "text-muted-foreground/60 italic"
                                )}
                              >
                                {hoveredNode === "center" && "💡 Kalkulus: Bidang studi tentang perubahan kontinuitas."}
                                {hoveredNode === "turunan" && "💡 Turunan: Mengukur laju perubahan sesaat suatu nilai."}
                                {hoveredNode === "integral" && "💡 Integral: Mengukur luas akumulasi di bawah kurva."}
                                {hoveredNode === "limit" && "💡 Limit: Mendekati nilai f(x) ketika x mendekati titik c."}
                                {!hoveredNode && "Sentuh/sorot node untuk penjelasan detail"}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}

                      {/* PREVIEW: PODCAST */}
                      {activeResultTab === "podcast" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 border-b pb-2 border-border/80 text-left">
                            <Mic className="h-5 w-5 text-emerald-500" />
                            <h4 className="font-bold text-sm text-foreground">Podcast Dialog AI</h4>
                          </div>

                          <div className="bg-muted/40 p-4 rounded-2xl flex flex-col items-center gap-3">
                            <div className="flex items-center justify-between w-full">
                              <div className="text-left">
                                <p className="font-bold text-xs text-foreground">Ep 1: Konsep Dasar Kalkulus</p>
                                <p className="text-[10px] text-muted-foreground">Pembicara: Rian & Sarah (AI)</p>
                              </div>
                              <button
                                onClick={() => {
                                  setIsAutoPlay(false)
                                  setPodcastPlaying(!podcastPlaying)
                                }}
                                className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-md cursor-pointer hover:scale-105",
                                  podcastPlaying ? "bg-emerald-600" : "bg-orange-600"
                                )}
                              >
                                {podcastPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-white ml-0.5" />}
                              </button>
                            </div>

                            {/* Equalizer Visualizer */}
                            <div className="flex items-center justify-center gap-1.5 h-8 w-full">
                              {[8, 14, 22, 12, 6, 18, 24, 16, 8, 14, 20, 10, 16, 22, 12, 6].map((h, i) => (
                                <motion.div
                                  key={i}
                                  className="w-1.5 bg-orange-500 rounded-full"
                                  animate={{
                                    height: podcastPlaying ? [4, h, 4] : 4
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8 + (i % 3) * 0.1,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </div>

                    {/* Bottom Status bar */}
                    <div className="border-t border-border/50 pt-3 mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Preview Modul Belajar</span>
                      <span className="font-mono text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                        Siap Digunakan
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  )
}
