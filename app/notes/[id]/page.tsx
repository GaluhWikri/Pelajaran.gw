"use client"

import { use } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { NoteEditorTabs } from "@/components/note-editor-tabs"
import { AIAssistantPanel } from "@/components/ai-assistant-panel"

import { useStore } from "@/lib/store"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { notes, chatPanelOpen, toggleChatPanel } = useStore()
  const note = notes.find((n) => n.id === id)

  if (!note) {
    notFound()
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
