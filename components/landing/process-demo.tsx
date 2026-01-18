"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Upload, Sparkles, CheckCircle2, CreditCard, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

// Optimized transition variants for mobile performance
const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
}

const slideUpVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
}

export function ProcessDemo() {
    const [step, setStep] = useState(0)

    // Memoize steps data to prevent re-renders
    const stepsData = useMemo(() => [
        { icon: Upload, label: "Upload" },
        { icon: Sparkles, label: "AI Process" },
        { icon: CheckCircle2, label: "Result" }
    ], [])

    const resultsData = useMemo(() => [
        { icon: FileText, title: "Ringkasan Materi", subtitle: "Lengkap & Terstruktur", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
        { icon: CreditCard, title: "7 Flashcards", subtitle: "Siap untuk dihafal", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        { icon: Zap, title: "10 Soal Kuis", subtitle: "Uji pemahamanmu", color: "text-orange-300", bg: "bg-orange-300/10", border: "border-orange-300/20" }
    ], [])

    // Single robust timer effect for the animation loop
    useEffect(() => {
        const durations = [4000, 2000, 2000]
        const timer = setTimeout(() => setStep((prev) => (prev + 1) % 3), durations[step])
        return () => clearTimeout(timer)
    }, [step])

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            {/* Main Card Container */}
            <div className="relative rounded-3xl overflow-hidden bg-[#080A0E] border border-white/10 shadow-2xl flex flex-col will-change-transform">

                {/* Top Progress / Stepper Header - Removed backdrop-blur for mobile performance */}
                <div className="flex items-center justify-between px-6 md:px-12 pt-8 pb-12 relative z-20 bg-[#0f1219]/80 border-b border-white/5">
                    {/* Connector Line Background */}
                    <div className="absolute top-13 left-11 md:left-17 right-11 md:right-17 h-0.5 bg-white/10 -z-10 -translate-y-1/2" />

                    {/* Active Progress Line - Using transform for GPU acceleration */}
                    <div
                        className={cn(
                            "absolute top-13 left-11 md:left-17 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 -z-10 -translate-y-1/2 transition-[width] duration-500 ease-out will-change-[width]",
                            step === 0 ? "w-0" : step === 1 ? "w-[calc(50%-2.75rem)] md:w-[calc(50%-4.25rem)]" : "w-[calc(100%-5.5rem)] md:w-[calc(100%-8.5rem)]"
                        )}
                    />

                    {/* Steps */}
                    {stepsData.map((s, i) => {
                        const isActive = step >= i
                        const isCurrent = step === i

                        return (
                            <div key={i} className="flex flex-col items-center gap-3 relative">
                                <div
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center border-2 relative z-10 transition-[background-color,border-color,transform] duration-300 will-change-transform",
                                        isActive
                                            ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-110"
                                            : "bg-[#1a1f2e] border-white/10 text-muted-foreground scale-100"
                                    )}
                                >
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <span className={cn(
                                    "text-xs font-medium absolute -bottom-8 whitespace-nowrap transition-colors duration-200",
                                    isActive ? "text-white" : "text-muted-foreground/50",
                                    isCurrent && "text-orange-400"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Content Area - Fixed Height to prevent layout shift */}
                <div className="px-6 py-8 md:p-10 relative min-h-[360px] flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">

                        {/* STEP 0: UPLOAD UI */}
                        {step === 0 && (
                            <motion.div
                                key="step-0"
                                variants={slideUpVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full max-w-sm mx-auto will-change-transform"
                            >
                                <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-8 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-orange-500/5" />

                                    <motion.div
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        className="flex justify-center mb-6 relative will-change-transform"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500/20 rounded-full scale-150" />
                                            <Upload className="h-16 w-16 text-orange-400 relative z-10" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-lg font-bold text-white mb-2">lecture-notes.pdf</h3>
                                    <p className="text-sm text-muted-foreground mb-6">2.4 MB • PDF Document</p>

                                    {/* Progress Bar Container - Optimized */}
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-300 will-change-transform"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 3.5, ease: "easeOut" }}
                                            style={{ transformOrigin: "left" }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
                                        <span>Uploading...</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 1: PROCESSING UI */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                variants={fadeVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center justify-center text-center w-full will-change-transform"
                            >
                                <div className="relative w-28 h-28 md:w-32 md:h-32 mb-8 mx-auto">
                                    {/* Rotating Orbital Rings - Using CSS transform for GPU */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-orange-500/30 border-t-orange-500 will-change-transform"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                    />
                                    <motion.div
                                        className="absolute inset-2 rounded-full border-2 border-amber-500/20 border-b-amber-500 will-change-transform"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                                    />

                                    {/* Central Icon - Removed blur for performance */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-14 h-14 md:w-16 md:h-16">
                                        <div className="absolute inset-0 bg-orange-500/30 rounded-full scale-150" />
                                        <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-white relative z-10 fill-white/20" />
                                    </div>
                                </div>

                                <motion.h3
                                    className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white mb-2"
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    AI Sedang Menganalisis...
                                </motion.h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    Mengekstrak poin penting, membuat ringkasan, dan menghasilkan kuis.
                                </p>
                            </motion.div>
                        )}

                        {/* STEP 2: RESULTS UI */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                variants={fadeVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full space-y-3 max-w-md mx-auto will-change-transform"
                            >
                                {resultsData.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.3, ease: "easeOut" }}
                                        className={cn(
                                            "flex items-center p-3.5 rounded-xl border bg-white/5 cursor-default group will-change-transform",
                                            item.border
                                        )}
                                    >
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mr-4", item.bg)}>
                                            <item.icon className={cn("h-5 w-5", item.color)} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.1 + 0.2, duration: 0.2 }}
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-orange-500" />
                                        </motion.div>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-center pt-2"
                                >
                                    <span className="text-xs font-mono text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                                        Selesai dalam 10 detik
                                    </span>
                                </motion.div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
