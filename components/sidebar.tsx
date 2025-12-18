"use client"

import { useState, useEffect } from "react"
import { Home, FileText, CreditCard, Trophy, Upload, Clock, Star, Folder, Crown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import Link from "next/link"

const navigation = [
  { name: "Dashboard", icon: Home, href: "/" },
  { name: "All Notes", icon: FileText, href: "/notes" },
  { name: "Favorites", icon: Star, href: "/notes?filter=favorites" },
  { name: "Upload Material", icon: Upload, href: "/upload" },
]

export function Sidebar() {
  const { sidebarOpen, notes, user } = useStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sortedRecentNotes = [...notes].sort((a, b) => {
    const timeA = Math.max(new Date(a.updatedAt).getTime(), a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0)
    const timeB = Math.max(new Date(b.updatedAt).getTime(), b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0)
    return timeB - timeA
  })

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <ScrollArea className="h-full py-6">
        <div className="space-y-6 px-4">


          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </h3>
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Button key={item.name} variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Notes</h3>
              <span className="text-xs text-muted-foreground">{isMounted ? notes.length : "-"}</span>
            </div>
            <div className="space-y-1">
              {isMounted ? (
                <>
                  {sortedRecentNotes.slice(0, 5).map((note) => (
                    <Button key={note.id} variant="ghost" className="w-full justify-start text-sm h-auto py-2" asChild>
                      <Link href={`/notes/${note.id}`}>
                        <div className="truncate text-left">
                          <div className="font-medium truncate">{note.title}</div>
                          <div className="text-xs text-muted-foreground">{note.tags.slice(0, 2).join(", ")}</div>
                        </div>
                      </Link>
                    </Button>
                  ))}
                  {notes.length === 0 && (
                    <p className="px-2 py-4 text-sm text-muted-foreground">No notes yet. Start by uploading material!</p>
                  )}
                </>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="h-10 w-full bg-muted/40 animate-pulse rounded-md" />
                  <div className="h-10 w-full bg-muted/40 animate-pulse rounded-md" />
                  <div className="h-10 w-full bg-muted/40 animate-pulse rounded-md" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-border">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Danger Zone
            </h3>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan.")) {
                  localStorage.removeItem("pelajarin-storage")
                  window.location.href = "/"
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Reset Semua Data
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
