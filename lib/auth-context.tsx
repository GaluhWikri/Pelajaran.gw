'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => { },
})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Route Protection Logic
    const pathname = usePathname()
    const protectedRoutes = [
        '/dashboard',
        '/notes',
        '/note',
        '/upload',
        '/leaderboard',
        '/profile',
        '/premium'
    ]

    useEffect(() => {
        if (loading) return

        const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))

        if (isProtectedRoute && !session) {
            router.push('/login')
        }

        if ((pathname === '/login' || pathname === '/register') && session) {
            router.push('/dashboard')
        }
    }, [pathname, session, loading, router])

    const signUp = async (email: string, password: string, fullName?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (data.session) {
                await supabase.auth.signOut()
            }

            if (error) return { error }

            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) return { error }

            router.push('/')
            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Error signing out:", error)
        } finally {
            // 1. Clear global store (Zustand)
            const { clearAll } = (await import('@/lib/store')).useStore.getState()
            clearAll()

            // 2. Manually clear Supabase tokens from LocalStorage
            // This is critical if the API call fails (403) and doesn't clear them automatically
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key)
                }
            })

            // 3. Force hard redirect to clear memory state
            window.location.href = '/login'
        }
    }

    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Check for redirect conditions to prevent flashing content
    const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
    const isAuthRoute = pathname === '/login' || pathname === '/register'

    if ((isProtectedRoute && !session) || (isAuthRoute && session)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
