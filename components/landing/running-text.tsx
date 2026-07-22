"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, Brain, Zap, FileText, Network, Mic, CheckCircle, Flame, Play } from "lucide-react"

const row1 = [
  { text: "Smart Notes", icon: FileText, color: "text-orange-500" },
  { text: "AI Tutor 24/7", icon: Brain, color: "text-purple-500" },
  { text: "Kuis Interaktif", icon: Zap, color: "text-yellow-500" },
  { text: "Visual Mind Map", icon: Network, color: "text-blue-500" },
  { text: "Audio Podcast", icon: Mic, color: "text-green-500" },
  { text: "Gemini 1.5 Flash", icon: Sparkles, color: "text-pink-500" },
  { text: "7-Day Streak", icon: Flame, color: "text-red-500" },
  { text: "100% Otomatis", icon: CheckCircle, color: "text-emerald-500" },
]

const row2 = [
  { text: "PDF Documents", icon: FileText, color: "text-red-400" },
  { text: "YouTube Videos", icon: Play, color: "text-red-600" },
  { text: "Voice Recordings", icon: Mic, color: "text-blue-400" },
  { text: "Website Links", icon: Network, color: "text-teal-400" },
  { text: "Study Flashcards", icon: Brain, color: "text-amber-400" },
  { text: "Leaderboard Ranks", icon: Sparkles, color: "text-yellow-400" },
]

interface MarqueeRowProps {
  items: typeof row1
  direction: "left" | "right"
  speed?: number
}

function MarqueeRow({ items, direction, speed = 40 }: MarqueeRowProps) {
  // Duplicate items to ensure smooth infinite loop
  const duplicatedItems = [...items, ...items, ...items, ...items]

  return (
    <div className="flex w-full overflow-hidden py-3">
      <motion.div
        className="flex gap-4 pr-4 shrink-0 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, "-33.33%"] : ["-33.33%", 0]
        }}
        transition={{
          ease: "linear",
          duration: speed,
          repeat: Infinity,
        }}
      >
        {duplicatedItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-card/40 dark:bg-card/25 border border-border/40 backdrop-blur-xs hover:border-orange-500/30 hover:bg-card/75 dark:hover:bg-card/40 transition-all duration-300 group shadow-xs hover:shadow-md hover:shadow-orange-500/5 cursor-default"
            >
              <Icon className="h-4.5 w-4.5 text-orange-500 group-hover:scale-110 transition-all duration-300" />
              <span className="text-sm font-semibold tracking-wide text-foreground/90 group-hover:text-foreground transition-colors duration-300">
                {item.text}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

export function RunningText() {
  return (
    <section className="py-12 md:py-16 overflow-hidden bg-transparent relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-37.5 bg-orange-500/5 dark:bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 mb-4 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full">
          Teknologi & Fitur Utama
        </span>
      </div>

      {/* Gradient mask at the edges to fade out the marquee content */}
      <div className="relative w-full mask-[linear-gradient(to_right,transparent,white_15%,white_85%,transparent)] md:mask-[linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
        <div className="flex flex-col gap-2">
          <MarqueeRow items={row1} direction="left" speed={30} />
          <MarqueeRow items={row2} direction="right" speed={28} />
        </div>
      </div>
    </section>
  )
}
