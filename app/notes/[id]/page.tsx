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

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // We use notes to find the note, but for the effect trigger we only care about existence
  // to avoid infinite loops caused by object reference updates.
  const { notes, chatPanelOpen, toggleChatPanel, markNoteAsAccessed } = useStore()
  const router = useRouter()

  const note = notes.find((n) => n.id === id)
  const noteExists = !!note

  useEffect(() => {
    if (!noteExists) {
      // Small timeout to allow hydration? No, usually unnecessary with persistent store if we handle loading state.
      // But here we just redirect.
      // We can't easily wait for "loading" in this simple store. 
      // If it's truly missing, we redirect.
      router.push("/notes")
    }
  }, [noteExists, router])

  useEffect(() => {
    if (noteExists) {
      markNoteAsAccessed(id)
    }
  }, [id, noteExists, markNoteAsAccessed])

  if (!note) {
    return null
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className="lg:pl-64 pt-16">
        <div className="flex h-[calc(100vh-4rem)]">
          <div className={`flex-1 transition-all ${chatPanelOpen ? "mr-96" : "mr-0"}`}>
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
