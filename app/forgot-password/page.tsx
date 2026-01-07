'use client'

import { useState } from 'react'
import { LandingNavbar } from '@/components/landing-navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setMessage('')

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })

            if (error) throw error

            setStatus('success')
        } catch (error: any) {
            setStatus('error')
            setMessage(error.message || 'Gagal mengirim email reset password.')
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
                <LandingNavbar />

                <div className="w-full max-w-md mb-4 flex items-center">
                    <Link href="/login" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Login
                    </Link>
                </div>

                <Card className="border-border bg-card/80 backdrop-blur-sm w-full max-w-md shadow-2xl">
                    <CardHeader className="space-y-1 text-center pb-2">
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
                        <CardTitle className="text-lg text-muted-foreground font-medium">Reset Password</CardTitle>
                        <CardDescription>
                            Masukkan email Anda untuk menerima link reset password.
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
                                    <h3 className="font-medium text-lg">Cek Email Anda</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
                                        Silakan cek inbox atau folder spam Anda.
                                    </p>
                                </div>
                                <Button
                                    className="w-full mt-4"
                                    onClick={() => {
                                        setStatus('idle')
                                        setEmail('')
                                    }}
                                    variant="outline"
                                >
                                    Kirim Ulang
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
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nama@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-11 bg-background"
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
                                            Mengirim...
                                        </>
                                    ) : (
                                        "Kirim Link Reset"
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
