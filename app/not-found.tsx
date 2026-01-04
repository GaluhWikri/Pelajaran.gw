"use client"

import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 overflow-hidden relative font-sans">

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

                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-orange-600/20 via-transparent to-transparent animate-[spin_3s_linear_infinite] blur-xl"></div>

                <div className="absolute inset-10 rounded-full bg-black border border-orange-500/50 shadow-[0_0_30px_rgba(234,88,12,0.4)]"></div>

                {/* Floating Alien/Ghost & Book */}
                <div className="relative z-10 animate-[bounce_3s_infinite]">
                    {/* Alien/Ghost Icon replaced by Image */}
                    <img
                        src="/favicon/android-chrome-512x512.png"
                        alt="Logo"
                        className="w-24 h-24 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />


                </div>
            </div>

            {/* Text Content */}
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter">404</h1>

            <h2 className="text-xl md:text-2xl font-semibold text-orange-500 mb-4">
                Halaman Ini Lenyap!
            </h2>

            <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                Entah kesedot lubang hitam digital atau diculik alien, yang jelas halaman yang kamu tuju tidak ada di sini.
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-2 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    ← Kembali
                </button>
                <Link
                    href="/"
                    className="px-6 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
                >
                    🏠 Ke Home
                </Link>
            </div>

        </div>
    )
}
