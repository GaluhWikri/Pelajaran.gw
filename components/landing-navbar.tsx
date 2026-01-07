"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function LandingNavbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/95 backdrop-blur-md">
            <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                        src="/favicon/android-chrome-192x192.png"
                        alt="Pelajaran.gw Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 md:h-10 md:w-10 object-contain"
                    />
                    <h1 className="text-base md:text-xl font-bold whitespace-nowrap">
                        Pelajaran<span className="text-primary">.gw</span>
                    </h1>
                </Link>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 h-9">
                            Masuk
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button size="sm" className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-500/20 text-sm">
                            Daftar
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
