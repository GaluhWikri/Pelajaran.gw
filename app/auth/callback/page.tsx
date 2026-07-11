'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // Supabase dengan PKCE flow akan otomatis menukar code/token via onAuthStateChange
        // Kita hanya perlu menunggu session terbentuk lalu redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Login berhasil, redirect ke dashboard
                router.replace('/dashboard')
            } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                // Gagal, redirect ke login
                router.replace('/login?error=oauth_gagal')
            }
        })

        // Juga cek session yang sudah ada (jika halaman di-refresh)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.replace('/dashboard')
            }
        })

        // Timeout safety - jika 10 detik tidak ada session, redirect ke login
        const timeout = setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                    router.replace('/login?error=timeout')
                }
            })
        }, 10000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [router])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-muted-foreground text-sm font-medium">
                Memverifikasi akun Google kamu...
            </p>
        </div>
    )
}
