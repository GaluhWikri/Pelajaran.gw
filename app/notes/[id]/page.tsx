"use client"

import { use, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { NoteEditorTabs } from "@/components/note-editor-tabs"
import { AIAssistantPanel } from "@/components/ai-assistant-panel"

import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // We use notes to find the note, but for the effect trigger we only care about existence
  // to avoid infinite loops caused by object reference updates.
  const { notes, chatPanelOpen, toggleChatPanel, markNoteAsAccessed, setActiveNote, sidebarOpen } = useStore()
  const router = useRouter()

  const note = notes.find((n) => n.id === id)
  const noteExists = !!note

  useEffect(() => {
    if (!noteExists) {
      router.push("/notes")
    } else {
      // Mark as accessed immediately when note is loaded
      markNoteAsAccessed(id)
      setActiveNote(id)
    }
  }, [id, noteExists, markNoteAsAccessed, setActiveNote, router])

  if (!note) {
    return null
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className={cn("pt-20 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
        <div className="flex min-h-[calc(100vh-6rem)]">
          <div className={`flex-1 w-full min-w-0 transition-all ${chatPanelOpen ? "mr-0 lg:mr-96" : "mr-0"}`}>
            <NoteEditorTabs noteId={id} />
          </div>

          {!chatPanelOpen && (
            <Button
              onClick={toggleChatPanel}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
              size="icon"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          )}

          <AIAssistantPanel noteId={id} />

        </div>
      </main>
    </div>
  )
}
