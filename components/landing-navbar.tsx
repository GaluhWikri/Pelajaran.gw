"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function LandingNavbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo - Same as DashboardHeader */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Image
                        src="/favicon/android-chrome-192x192.png"
                        alt="Pelajaran.gw Logo"
                        width={40}
                        height={40}
                        className="h-10 w-auto object-contain"
                    />
                    <h1 className="text-xl font-bold">
                        Pelajaran<span className="text-primary">.gw</span>
                    </h1>
                </Link>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" size="sm">
                            Masuk
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button size="sm" className="gap-2">
                            Daftar Gratis
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
