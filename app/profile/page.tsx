"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Settings, User, Mail, Save, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2 } from "lucide-react"

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth()
    const { user: storeUser, setUser, sidebarOpen } = useStore()
    const [name, setName] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const router = useRouter()


    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login")
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (storeUser?.name) {
            setName(storeUser.name)
        }
    }, [storeUser])

    const handleSave = async () => {
        if (!user) return

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ full_name: name })
                .eq("id", user.id)

            if (error) throw error

            // Update local store
            setUser({ ...storeUser!, name: name })

            // Show success modal
            setShowSuccessModal(true)
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Gagal memperbarui profil.")
        } finally {
            setIsSaving(false)
        }
    }

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <Sidebar />

            <main className={cn("pt-14 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
                <div className="p-6 space-y-8 max-w-2xl mx-auto">

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Profil</h1>
                            <p className="text-muted-foreground">Perbarui informasi akun Anda</p>
                        </div>
                    </div>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6 space-y-6">

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Nama Lengkap
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Masukkan nama lengkap anda"
                                        className="h-12 text-base bg-background/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-base flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="h-12 text-base bg-muted/50 text-muted-foreground cursor-not-allowed opacity-100"
                                    />
                                    <p className="text-xs text-muted-foreground ml-1">
                                        * Email tidak dapat diubah
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || name === storeUser?.name}
                                    className="w-full md:w-auto min-w-[120px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </main>

            <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader className="items-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <AlertDialogTitle className="text-xl">Berhasil Disimpan!</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Informasi profil Anda telah berhasil diperbarui.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center mt-4">
                        <AlertDialogAction onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto min-w-[120px]">
                            Tutup
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
