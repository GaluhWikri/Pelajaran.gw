"use client"

import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { LandingNavbar } from "@/components/landing-navbar"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 overflow-hidden relative font-sans">

            <LandingNavbar />

            {/* Background Star Field */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-75"></div>
                <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-slate-500 rounded-full animate-pulse delay-150"></div>
                <div className="absolute top-1/2 right-10 w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-10 right-1/3 w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-500"></div>
                <div className="absolute top-20 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
            </div>

            {/* Visual Animation Container */}
            <div className="relative w-64 h-64 mb-8 flex items-center justify-center">

                {/* Black Hole Effects */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-600/30 animate-[spin_10s_linear_infinite]"></div>

                <div className="absolute inset-4 rounded-full bg-linear-to-tr from-orange-600/20 via-transparent to-transparent animate-[spin_3s_linear_infinite] blur-xl"></div>

                <div className="absolute inset-10 rounded-full bg-black border border-orange-500/50 shadow-[0_0_30px_rgba(234,88,12,0.4)]"></div>

                {/* Floating Icon Container */}
                <div className="relative z-10 animate-[bounce_3s_infinite]">
                    <img
                        src="/favicon/android-chrome-512x512.png"
                        alt="Logo"
                        className="w-24 h-24 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                </div>
            </div>

            {/* Text Content */}
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter">404</h1>

            <h2 className="text-2xl md:text-3xl font-bold text-orange-500 mb-4">
                Halaman Ini Lenyap!
            </h2>

            <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                Entah kesedot lubang hitam digital atau diculik alien, yang jelas halaman yang kamu tuju tidak ada di sini.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 w-full px-4">

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-[0_4px_20px_rgba(234,88,12,0.3)] hover:shadow-[0_6px_25px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
                >
                    <Home className="h-5 w-5" strokeWidth={2.5} />
                    <span>Kembali ke Beranda</span>
                </Link>

                <button
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1d1d1d] text-white font-bold hover:bg-[#3f3f3f] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                    <span>Halaman Sebelumnya</span>
                </button>

            </div>

        </div>
    )
}
