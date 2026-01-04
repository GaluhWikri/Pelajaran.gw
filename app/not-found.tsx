"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, MoveLeft } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <div className="space-y-6 max-w-md w-full relative">
                {/* Background Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full -z-10" />

                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center backdrop-blur-sm border border-border/50 shadow-xl">
                        <AlertCircle className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <Button variant="outline" size="lg" onClick={() => window.history.back()} className="w-full sm:w-auto gap-2">
                        <MoveLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    <Link href="/" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary/20">
                            <Home className="h-4 w-4" />
                            Ke Home
                        </Button>
                    </Link>
                </div>
            </div>


        </div>
    )
}
