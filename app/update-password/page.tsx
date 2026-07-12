'use client'

import { useState, useEffect } from 'react'
import { LandingNavbar } from '@/components/landing-navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/logo'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const router = useRouter()

    // Exchange code for session (for PKCE flow) and ensure session exists
    useEffect(() => {
        const handleRecovery = async () => {
            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')

            if (code) {
                setStatus('loading')
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    setStatus('error')
                    setMessage(error.message || 'Token reset password tidak valid atau telah kedaluwarsa.')
                } else {
                    setStatus('idle')
                }
            } else {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    setStatus('error')
                    setMessage('Sesi tidak ditemukan. Silakan minta link reset password baru.')
                }
            }
        }

        handleRecovery()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Password tidak sama')
            return
        }

        if (password.length < 6) {
            setStatus('error')
            setMessage('Password minimal 6 karakter')
            return
        }

        setStatus('loading')
        setMessage('')

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setStatus('success')
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error: any) {
            setStatus('error')
            setMessage(error.message || 'Gagal mengubah password.')
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
                <LandingNavbar />

                <Card className="border-border bg-card/80 backdrop-blur-sm w-full max-w-md shadow-2xl">
                    <CardHeader className="space-y-1 text-center pb-2">
                        <div className="flex flex-col items-center justify-center gap-3 mb-2">
                            <div className="flex items-center gap-3">
                                <Logo width={64} height={64} className="w-16 h-16 object-contain" />
                                <div className="text-4xl font-bold tracking-tight">
                                    Pelajaran<span className="text-orange-500">ku</span>
                                </div>
                            </div>
                        </div>
                        <CardTitle className="text-lg text-muted-foreground font-medium">Buat Password Baru</CardTitle>
                        <CardDescription>
                            Masukkan password baru Anda untuk mengamankan akun.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === 'success' ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="flex justify-center">
                                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-medium text-lg">Password Berhasil Diubah!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Anda akan dialihkan ke halaman login dalam beberapa detik...
                                    </p>
                                </div>
                                <Button
                                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                                    onClick={() => router.push('/login')}
                                >
                                    Login Sekarang
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {status === 'error' && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password Baru</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 h-11 bg-background"
                                            disabled={status === 'loading'}
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

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 pr-10 h-11 bg-background"
                                            disabled={status === 'loading'}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        "Simpan Password Baru"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
