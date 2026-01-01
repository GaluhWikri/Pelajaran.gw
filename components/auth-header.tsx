'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

interface AuthHeaderProps {
    currentPage?: 'login' | 'register'
}

export function AuthHeader({ currentPage }: AuthHeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
            <div className="flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-3">
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

                <div className="flex items-center gap-3">
                    {currentPage === 'login' ? (
                        <Link href="/register">
                            <Button className="gap-2 bg-primary hover:bg-primary/90">
                                <UserPlus className="h-4 w-4" />
                                <span>Sign Up</span>
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" className="gap-2">
                                <LogIn className="h-4 w-4" />
                                <span>Sign In</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}
