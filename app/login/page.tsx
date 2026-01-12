'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LandingNavbar } from '@/components/landing-navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()

    const handleOAuthLogin = async (provider: 'google') => {
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })
            if (error) throw error
        } catch (error: any) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!email || !password) {
            setError('Please fill in all fields')
            setLoading(false)
            return
        }

        const { error } = await signIn(email, password)

        if (error) {
            let errorMessage = error.message || 'Failed to sign in'
            if (errorMessage.includes('Invalid login credentials')) {
                errorMessage = 'Incorrect email or password'
            }
            setError(errorMessage)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 pt-20 relative overflow-hidden">
                {/* Background Blobs similar to landing/404 for consistency */}
                <LandingNavbar />
                <div className="w-full max-w-md mb-4 flex items-center">
                    <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke beranda
                    </Link>
                </div>

                <Card className="border-border bg-card/80 backdrop-blur-sm w-full max-w-md shadow-2xl">
                    <CardHeader className="space-y-1 text-center pb-2">
                        {/* Branding Header */}
                        <div className="flex flex-col items-center justify-center gap-3 mb-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/favicon/android-chrome-512x512.png"
                                    alt="Logo"
                                    className="w-16 h-16 object-contain"
                                />
                                <div className="text-4xl font-bold tracking-tight">
                                    <span className="text-foreground">Pelajaran</span>
                                    <span className="text-orange-500">.gw</span>
                                </div>
                            </div>
                        </div>

                        <CardTitle className="text-lg text-muted-foreground font-medium">Masuk ke akun Anda</CardTitle>
                        <CardDescription>
                            Selamat datang di Pelajaran.gw
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="w-full h-11 bg-[#1e293b] hover:bg-[#334155] border-transparent text-white justify-start relative px-4"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span className="flex-1 text-center font-semibold">Lanjutkan dengan Google</span>
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground uppercase tracking-wider">Atau</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-background"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11 bg-background"
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Masuk...
                                    </>
                                ) : (
                                    <>
                                        Masuk
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="space-y-4 text-center text-sm">
                                <Link
                                    href="/forgot-password"
                                    className="text-orange-500 hover:text-orange-400 font-medium block"
                                >
                                    Lupa password?
                                </Link>
                                <div className="text-muted-foreground">
                                    Belum punya akun?{' '}
                                    <Link
                                        href="/register"
                                        className="text-orange-500 hover:text-orange-400 font-bold hover:underline"
                                    >
                                        Daftar sekarang
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
