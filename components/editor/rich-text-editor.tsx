"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    List,
    ListOrdered,
    Undo,
    Redo,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { Toggle } from "@/components/ui/toggle"

const extensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3]
        }
    }),
    Underline,
    Link.configure({
        openOnClick: false,
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
]

const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-1 mr-2 pr-2 border-r border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Bold className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Italic className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("underline")}
                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <UnderlineIcon className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("code")}
                onPressedChange={() => editor.chain().focus().toggleCode().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Code className="h-4 w-4" />
            </Toggle>

            <div className="w-px h-6 bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Heading1 className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Heading2 className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Heading3 className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("blockquote")}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <Quote className="h-4 w-4" />
            </Toggle>

            <div className="w-px h-6 bg-border mx-1" />

            <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <List className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8 data-[state=on]:bg-muted"
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
        </div>
    )
}

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
}

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
    const [isMounted, setIsMounted] = useState(false)

    // Use a ref to track if the update comes from the editor itself to prevent loops
    const isInternalUpdate = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const editor = useEditor({
        immediatelyRender: false,
        extensions: extensions,
        content: content,
        editable: editable,
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none w-full focus:outline-none min-h-[500px] p-6',
            },
        },
        onUpdate: ({ editor }) => {
            // isInternalUpdate.current = true
            onChange(editor.getHTML())
            // setTimeout(() => isInternalUpdate.current = false, 0)
        },
    })

    // Sync external content changes if needed
    // useEffect(() => {
    //   if (editor && content !== editor.getHTML() && !isInternalUpdate.current) {
    //     editor.commands.setContent(content)
    //   }
    // }, [content, editor])

    if (!isMounted) return null

    return (
        <div className="flex flex-col border rounded-md overflow-hidden bg-background">
            {editable && <Toolbar editor={editor} />}
            <div className="relative">
                {/* Grip handle visual simulation as requested */}
                <div className="absolute left-2 top-8 opacity-20 hover:opacity-100 cursor-grab transition-opacity">
                    <GripVertical className="h-5 w-5" />
                </div>

                <EditorContent editor={editor} className="pl-6" />
            </div>
        </div>
    )
}
