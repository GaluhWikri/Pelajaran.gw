"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Upload, Sparkles, CheckCircle2, CreditCard, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProcessDemo() {
    const [step, setStep] = useState(0)

    // Single robust timer effect for the animation loop
    useEffect(() => {
        let timer: NodeJS.Timeout

        if (step === 0) {
            // Step 0: Uploading (Show for 4s)
            timer = setTimeout(() => setStep(1), 4000)
        } else if (step === 1) {
            // Step 1: Data Processing (Show for 3.5s)
            timer = setTimeout(() => setStep(2), 3500)
        } else if (step === 2) {
            // Step 2: Results (Show for 5s then reset)
            timer = setTimeout(() => setStep(0), 5000)
        }

        return () => clearTimeout(timer)
    }, [step])

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            {/* Main Card Container */}
            <div className="relative rounded-3xl overflow-hidden bg-[#080A0E] border border-white/10 shadow-2xl flex flex-col">

                {/* Top Progress / Stepper Header */}
                <div className="flex items-center justify-between px-6 md:px-12 pt-8 pb-12 relative z-20 bg-[#0f1219]/50 backdrop-blur-sm border-b border-white/5">
                    {/* Connector Line Background */}
                    <div className="absolute top-13 left-11 md:left-17 right-11 md:right-17 h-0.5 bg-white/10 -z-10 -translate-y-1/2" />

                    {/* Active Progress Line */}
                    <div
                        className={cn(
                            "absolute top-13 left-11 md:left-17 h-0.5 bg-linear-to-r from-orange-500 to-amber-500 transition-all duration-700 ease-in-out -z-10 -translate-y-1/2",
                            step === 0 ? "w-0" : step === 1 ? "w-[calc(50%-2.75rem)] md:w-[calc(50%-4.25rem)]" : "w-[calc(100%-5.5rem)] md:w-[calc(100%-8.5rem)]"
                        )}
                    />

                    {/* Steps */}
                    {[
                        { icon: Upload, label: "Upload" },
                        { icon: Sparkles, label: "AI Process" },
                        { icon: CheckCircle2, label: "Result" }
                    ].map((s, i) => {
                        const isActive = step >= i
                        const isCurrent = step === i

                        return (
                            <div key={i} className="flex flex-col items-center gap-3 relative">
                                <div
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 relative z-10",
                                        isActive
                                            ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110"
                                            : "bg-[#1a1f2e] border-white/10 text-muted-foreground scale-100"
                                    )}
                                >
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <span className={cn(
                                    "text-xs font-medium transition-colors duration-300 absolute -bottom-8 whitespace-nowrap",
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
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                                transition={{ duration: 0.4 }}
                                className="w-full max-w-sm mx-auto"
                            >
                                <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-8 text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />

                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                        className="flex justify-center mb-6 relative"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20" />
                                            <Upload className="h-16 w-16 text-orange-400 relative z-10" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-lg font-bold text-white mb-2">lecture-notes.pdf</h3>
                                    <p className="text-sm text-muted-foreground mb-6">2.4 MB • PDF Document</p>

                                    {/* Progress Bar Container */}
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 bg-linear-to-r from-orange-500 to-orange-300"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
                                        <span>Uploading...</span>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            100%
                                        </motion.span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 1: PROCESSING UI */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center justify-center text-center w-full"
                            >
                                <div className="relative w-32 h-32 mb-8 mx-auto">
                                    {/* Rotating Orbital Rings */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-orange-500/30 border-t-orange-500"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    <motion.div
                                        className="absolute inset-2 rounded-full border-2 border-amber-500/20 border-b-amber-500"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />

                                    {/* Central Icon */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-16 h-16">
                                        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-40 animate-pulse rounded-full" />
                                        <Sparkles className="h-10 w-10 text-white relative z-10 fill-white/20" />
                                    </div>
                                </div>

                                <motion.h3
                                    className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-orange-400 to-white mb-2"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.4 }}
                                className="w-full space-y-3 max-w-md mx-auto"
                            >
                                {[
                                    { icon: FileText, title: "Ringkasan Materi", subtitle: "Lengkap & Terstruktur", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
                                    { icon: CreditCard, title: "7 Flashcards", subtitle: "Siap untuk dihafal", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                                    { icon: Zap, title: "10 Soal Kuis", subtitle: "Uji pemahamanmu", color: "text-orange-300", bg: "bg-orange-300/10", border: "border-orange-300/20" }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.15 + 0.1, type: "spring", stiffness: 100 }}
                                        className={cn(
                                            "flex items-center p-3.5 rounded-xl border bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default group",
                                            item.border
                                        )}
                                    >
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mr-4 shadow-inner", item.bg)}>
                                            <item.icon className={cn("h-5 w-5", item.color)} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <h4 className="text-white font-semibold text-sm group-hover:text-orange-200 transition-colors">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: idx * 0.15 + 0.4, type: "spring" }}
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                                        </motion.div>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
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
