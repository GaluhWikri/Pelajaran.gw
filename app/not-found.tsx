"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, MoveLeft } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-center p-4">
            {/* Custom Animation Style */}
            <style jsx global>{`
        @keyframes glow-pulse {
          0% {
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
          }
          50% {
             filter: drop-shadow(0 0 25px rgba(255, 255, 255, 0.8));
          }
           100% {
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
          }
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s infinite ease-in-out;
        }
      `}</style>

            <div className="space-y-10 max-w-md w-full flex flex-col items-center">

                {/* Animated Icon */}
                <div className="relative group">
                    {/* Background ambient glow */}
                    <div className="absolute inset-0 bg-white/20 blur-[60px] rounded-full animate-pulse" />

                    <img
                        src="/favicon/android-chrome-512x512.png"
                        alt="Logo"
                        className="relative h-48 w-48 md:h-64 md:w-64 object-contain animate-glow-pulse"
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
                        404
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                        Ups, Halaman Hilang
                    </h2>
                    <p className="text-white/60 max-w-lg text-sm md:text-base leading-relaxed">
                        Entah kesedot lubang hitam digital atau diculik alien, yang jelas halaman yang kamu tuju tidak ada di sini.
                    </p>
                </div>

                <div className="flex flex-row items-center justify-center gap-4 w-full pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.history.back()}
                        className="h-12 px-6 gap-2 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all hover:scale-105"
                    >
                        <MoveLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    <Link href="/">
                        <Button
                            size="lg"
                            className="h-12 px-6 gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white border-none rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                        >
                            <Home className="h-4 w-4" />
                            Ke Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
