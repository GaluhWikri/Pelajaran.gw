"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { BubbleMenu as BubbleMenuExtension } from "@tiptap/extension-bubble-menu"
import DragHandle from '@tiptap/extension-drag-handle-react'
import AutoJoiner from 'tiptap-extension-auto-joiner'
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
    Unlink,
    Trash2,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Merge,
    Split,
    Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
        },
        dropcursor: {
            color: '#ffffff',
            width: 2,
        },
        gapcursor: false,
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
            class: 'border-collapse table-auto w-full my-4 prose-table:border prose-th:border prose-td:border prose-th:p-2 prose-td:p-2',
        },
    }),
    TableRow,
    TableHeader,
    TableCell,
    TableHeader,
    TableCell,
    BubbleMenuExtension,
    TableHeader,
    TableCell,
    BubbleMenuExtension,
    AutoJoiner.configure({
        elementsToJoin: ['bulletList', 'orderedList'],
    }),
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
        <div className="flex flex-wrap items-center gap-1 p-2 w-full">
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
    const isDropRefresh = useRef(false)

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
                class: 'prose prose-sm dark:prose-invert max-w-none w-full focus:outline-none p-4 md:p-6 pb-20 break-words',
                spellcheck: 'false',
            },
        },
        onUpdate: ({ editor }) => {
            if (isDropRefresh.current) return // Skip onChange during drop content refresh
            onChange(editor.getHTML())
        },
    })

    // Fix: Listen for drop events directly on the editor DOM and force a full content refresh
    // This fixes the TipTap DragHandle bug where text visually disappears after drag-and-drop
    useEffect(() => {
        if (!editor) return

        const editorDom = editor.view.dom

        // Hide the browser's native drag caret during drag
        const handleDragStart = () => {
            editorDom.classList.add('is-dragging')
        }

        const handleDragEnd = () => {
            editorDom.classList.remove('is-dragging')
        }

        const handleDrop = () => {
            // Instantly remove the dropcursor element from DOM.
            const parent = editorDom.offsetParent || document.body
            parent.querySelectorAll('.prosemirror-dropcursor-block, .prosemirror-dropcursor-inline').forEach(el => {
                ; (el as HTMLElement).style.display = 'none'
            })

            editorDom.classList.remove('is-dragging')

            // Then refresh content to fix text disappearing bug
            requestAnimationFrame(() => {
                if (!editor || editor.isDestroyed) return
                const currentHTML = editor.getHTML()
                isDropRefresh.current = true
                editor.commands.setContent(currentHTML)
                isDropRefresh.current = false
                onChange(currentHTML)
                editor.commands.blur()
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur()
                }
                window.getSelection()?.removeAllRanges()
            })
        }

        editorDom.addEventListener('dragstart', handleDragStart)
        editorDom.addEventListener('dragend', handleDragEnd)
        editorDom.addEventListener('drop', handleDrop)
        return () => {
            editorDom.removeEventListener('dragstart', handleDragStart)
            editorDom.removeEventListener('dragend', handleDragEnd)
            editorDom.removeEventListener('drop', handleDrop)
        }
    }, [editor, onChange])

    if (!isMounted) return null

    return (
        <div className="flex flex-col border rounded-md bg-background w-full max-w-full">
            {editable && (
                <div className="sticky top-[72px] z-20 bg-background border-b rounded-t-md">
                    <Toolbar editor={editor} />
                </div>
            )}
            <div className="relative w-full max-w-full overflow-x-auto">
                <EditorContent editor={editor} className="pl-0 md:pl-6" />

                {editor && (
                    <>
                        <DragHandle
                            editor={editor}
                            className="drag-handle hidden md:block"
                            onNodeChange={(data) => {
                                // console.log('Drag node:', data.node.type.name)
                            }}
                        >
                            <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                                <GripVertical size={24} />
                            </div>
                        </DragHandle>

                        <BubbleMenu
                            editor={editor}
                            shouldShow={({ editor }: { editor: Editor }) => {
                                // Only show if table is active
                                return editor.isActive('table')
                            }}
                            className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border rounded-lg shadow-md overflow-hidden animate-in fade-in zoom-in-95"
                        >
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addColumnBefore().run()}
                                icon={ArrowLeft}
                                label="Add Column Before"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                icon={ArrowRight}
                                label="Add Column After"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().deleteColumn().run()}
                                icon={Trash}
                                label="Delete Column"
                            />
                            <div className="w-px h-4 bg-border mx-1" />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addRowBefore().run()}
                                icon={ArrowUp}
                                label="Add Row Before"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                icon={ArrowDown}
                                label="Add Row After"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().deleteRow().run()}
                                icon={Trash}
                                label="Delete Row"
                            />
                            <div className="w-px h-4 bg-border mx-1" />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().mergeCells().run()}
                                icon={Merge}
                                label="Merge Cells"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().splitCell().run()}
                                icon={Split}
                                label="Split Cell"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                                isActive={editor.isActive('tableHeader')}
                                icon={TableIcon}
                                label="Toggle Header"
                            />
                            <div className="w-px h-4 bg-border mx-1" />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                icon={Trash2}
                                label="Delete Table"
                                disabled={!editor.can().deleteTable()}
                            />
                        </BubbleMenu>
                    </>
                )}
            </div>
        </div>
    )
}
