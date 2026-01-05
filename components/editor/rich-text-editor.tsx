"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
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
    GripVertical,
    Table as TableIcon,
    Unlink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Toggle } from "@/components/ui/toggle"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const extensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3]
        }
    }),
    Underline,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
        },
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
    Table.configure({
        resizable: true,
        HTMLAttributes: {
            class: 'border-collapse table-auto w-full my-4',
        },
    }),
    TableRow,
    TableHeader,
    TableCell,
]

const ToolbarButton = ({
    onClick,
    isActive,
    disabled = false,
    icon: Icon,
    label
}: {
    onClick: () => void,
    isActive?: boolean,
    disabled?: boolean,
    icon: any,
    label: string
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Toggle
                size="sm"
                pressed={isActive}
                onPressedChange={onClick}
                disabled={disabled}
                className={cn(
                    "h-8 w-8",
                    isActive && "bg-muted text-foreground"
                )}
            >
                <Icon className="h-4 w-4" />
            </Toggle>
        </TooltipTrigger>
        <TooltipContent>
            <p>{label}</p>
        </TooltipContent>
    </Tooltip>
)

const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL:', previousUrl)

        // cancelled
        if (url === null) {
            return
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }, [editor])

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-1 mr-2 pr-2 border-r border-border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo</TooltipContent>
                </Tooltip>
            </div>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                icon={Bold}
                label="Bold"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                icon={Italic}
                label="Italic"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                icon={UnderlineIcon}
                label="Underline"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                icon={Strikethrough}
                label="Strikethrough"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive("code")}
                icon={Code}
                label="Code"
            />

            <div className="w-px h-6 bg-border mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                icon={Heading1}
                label="Heading 1"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                icon={Heading2}
                label="Heading 2"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                icon={Heading3}
                label="Heading 3"
            />

            <div className="w-px h-6 bg-border mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                icon={List}
                label="Bullet List"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                icon={ListOrdered}
                label="Ordered List"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive("blockquote")}
                icon={Quote}
                label="Quote"
            />

            <div className="w-px h-6 bg-border mx-1" />

            <ToolbarButton
                onClick={setLink}
                isActive={editor.isActive('link')}
                icon={LinkIcon}
                label="Link"
            />

            <ToolbarButton
                onClick={addTable}
                isActive={editor.isActive('table')}
                icon={TableIcon}
                label="Insert Table"
            />

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
