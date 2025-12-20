"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Lightbulb, HelpCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { generateChatResponse } from "@/lib/ai-service"

interface AIAssistantPanelProps {
  noteId: string
}

const suggestedPrompts = [
  {
    icon: Lightbulb,
    text: "Explain this concept in simpler terms",
  },
  {
    icon: HelpCircle,
    text: "What are the key takeaways?",
  },
  {
    icon: RotateCcw,
    text: "Generate practice questions",
  },
  {
    icon: Sparkles,
    text: "Suggest study strategies",
  },
]

export function AIAssistantPanel({ noteId }: AIAssistantPanelProps) {
  const { chatPanelOpen, toggleChatPanel, chatMessages, addChatMessage, notes } = useStore()
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const note = notes.find((n) => n.id === noteId)
  const relevantMessages = chatMessages.filter((m) => m.noteId === noteId)

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [relevantMessages, isThinking])

  const handleSend = async (message?: string) => {
    const textToSend = message || input
    if (!textToSend.trim()) return

    addChatMessage({
      userId: "demo-user",
      noteId,
      role: "user",
      content: textToSend,
    })

    setInput("")
    setIsThinking(true)

    // AI Service response
    let response = ""
    if (note) {
      response = await generateChatResponse(textToSend, note)
    } else {
      response = "I couldn't find the notes you are referring to. Please make sure the note is selected."
    }

    addChatMessage({
      userId: "demo-user",
      noteId,
      role: "assistant",
      content: response,
    })

    setIsThinking(false)
  }

  if (!chatPanelOpen) return null

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 border-l border-border bg-card z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask anything about your notes</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleChatPanel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {relevantMessages.length === 0 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">How can I help you learn?</p>
                <p className="text-xs text-muted-foreground">Ask me anything about your notes</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">Try asking:</p>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-left"
                  >
                    <prompt.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {relevantMessages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{formatDistanceToNow(message.timestamp, { addSuffix: true })}</p>
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                  <span className="text-xs font-medium">You</span>
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-accent rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            disabled={isThinking}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isThinking}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses are context-aware based on your notes
        </p>
      </div>
    </aside>
  )
}
