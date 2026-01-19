"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    Handle,
    Position,
    useReactFlow,
    ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { generateMindmapFromNote } from "@/lib/ai-service"
import { saveMindmapToSupabase } from "@/lib/supabase-helpers"
import { Loader2, Sparkles, RefreshCw, LayoutGrid, Undo2, Redo2, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MindmapNode } from "@/lib/types"

interface MindmapTabProps {
    noteId: string
}

// Custom node component for mindmap with modern, attractive design
function MindmapNodeComponent({ data }: { data: { label: string; level: number; edgeLabel?: string; side?: 'left' | 'right' | 'center' } }) {
    // Modern color schemes with gradients and glow effects
    const nodeStyles = [
        // Root - Premium orange/amber with glow
        {
            bg: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500",
            shadow: "shadow-[0_0_30px_rgba(251,146,60,0.4)]",
            border: "ring-2 ring-orange-300/50",
        },
        // Level 1 - Vibrant blue
        {
            bg: "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500",
            shadow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
            border: "ring-1 ring-blue-300/30",
        },
        // Level 2 - Fresh green/teal
        {
            bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
            shadow: "shadow-[0_0_15px_rgba(20,184,166,0.3)]",
            border: "ring-1 ring-emerald-300/30",
        },
        // Level 3 - Warm rose/pink
        {
            bg: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500",
            shadow: "shadow-[0_0_15px_rgba(236,72,153,0.3)]",
            border: "ring-1 ring-rose-300/30",
        },
        // Level 4+ - Rich purple/violet
        {
            bg: "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500",
            shadow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
            border: "ring-1 ring-violet-300/30",
        },
    ]

    const level = Math.min(data.level, 4)
    const side = data.side || 'right'
    const isCenter = side === 'center'
    const style = nodeStyles[level]

    return (
        <div className="relative group">
            {/* Left handle */}
            <Handle
                type={isCenter || side === 'left' ? 'source' : 'target'}
                position={Position.Left}
                id="left"
                className="opacity-0! w-2! h-2!"
            />

            {/* Node content with glassmorphism effect */}
            <div
                className={cn(
                    // Base styles
                    "relative px-5 py-3 rounded-2xl text-white font-semibold text-center",
                    // Modern effects
                    "backdrop-blur-sm",
                    style.bg,
                    style.shadow,
                    style.border,
                    // Text wrapping
                    "max-w-[220px] break-words",
                    // Smooth animations
                    "transition-all duration-300 ease-out",
                    "hover:scale-105 hover:shadow-xl",
                    "cursor-pointer",
                    // Root specific
                    level === 0 && "text-lg px-8 py-4 max-w-[280px] rounded-3xl font-bold",
                    // Child nodes
                    level > 0 && "text-sm"
                )}
            >
                {/* Subtle inner glow overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none"
                    style={{ borderRadius: level === 0 ? '1.5rem' : '1rem' }} />

                {/* Relationship subtitle badge */}
                {data.edgeLabel && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[9px] text-white/80 font-normal whitespace-nowrap">
                        {data.edgeLabel}
                    </div>
                )}

                {/* Main label */}
                <div className="relative z-10 whitespace-pre-wrap leading-snug">
                    {data.label}
                </div>
            </div>

            {/* Right handle */}
            <Handle
                type={isCenter || side === 'right' ? 'source' : 'target'}
                position={Position.Right}
                id="right"
                className="opacity-0! w-2! h-2!"
            />
        </div>
    )
}

const nodeTypes = {
    mindmapNode: MindmapNodeComponent,
}

// Convert MindmapNode[] to ReactFlow nodes and edges with CENTERED layout
// Root in center, children split to left and right sides
function convertToReactFlow(mindmapNodes: MindmapNode[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Build parent-child relationships and store edgeLabels
    const childrenMap = new Map<string | null, MindmapNode[]>()
    const edgeLabelMap = new Map<string, string>()
    const nodeById = new Map<string, MindmapNode>()

    mindmapNodes.forEach((node) => {
        nodeById.set(node.id, node)
        const parentId = node.parentId
        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)!.push(node)
        if (node.edgeLabel) {
            edgeLabelMap.set(node.id, node.edgeLabel)
        }
    })

    // Calculate levels for each node
    const levelMap = new Map<string, number>()
    function calculateLevel(nodeId: string, level: number) {
        levelMap.set(nodeId, level)
        const children = childrenMap.get(nodeId) || []
        children.forEach((child) => calculateLevel(child.id, level + 1))
    }

    const root = mindmapNodes.find((n) => n.parentId === null)
    if (!root) return { nodes, edges }

    calculateLevel(root.id, 0)

    // Layout constants for centered layout
    const HORIZONTAL_SPACING = 350  // Jarak antar level
    const VERTICAL_SPACING = 100    // Jarak antar sibling nodes

    // Track which side each node is on
    const nodeSideMap = new Map<string, 'left' | 'right' | 'center'>()

    // Position nodes - centered layout
    const nodePositions = new Map<string, { x: number; y: number }>()

    // Get all level 1 children (direct children of root)
    const rootChildren = childrenMap.get(root.id) || []

    // Split children into left and right groups
    const leftChildren: MindmapNode[] = []
    const rightChildren: MindmapNode[] = []

    rootChildren.forEach((child, index) => {
        if (index % 2 === 0) {
            rightChildren.push(child)
        } else {
            leftChildren.push(child)
        }
    })

    // Calculate subtree leaf count (for balanced spacing)
    function calculateLeafCount(nodeId: string): number {
        const children = childrenMap.get(nodeId) || []
        if (children.length === 0) {
            return 1
        }
        let totalLeaves = 0
        children.forEach((child) => {
            totalLeaves += calculateLeafCount(child.id)
        })
        return totalLeaves
    }

    // Position a subtree on either left or right side
    function positionSubtree(
        nodeId: string,
        x: number,
        yStart: number,
        side: 'left' | 'right'
    ): { endY: number; centerY: number } {
        const children = childrenMap.get(nodeId) || []
        nodeSideMap.set(nodeId, side)

        if (children.length === 0) {
            // Leaf node
            nodePositions.set(nodeId, { x, y: yStart })
            return { endY: yStart + VERTICAL_SPACING, centerY: yStart }
        }

        // Determine X direction based on side
        const xOffset = side === 'left' ? -HORIZONTAL_SPACING : HORIZONTAL_SPACING

        // Position all children and track their centers
        let currentY = yStart
        const childCenters: number[] = []

        children.forEach((child) => {
            const result = positionSubtree(child.id, x + xOffset, currentY, side)
            childCenters.push(result.centerY)
            currentY = result.endY
        })

        // Position this node at the center of its children's centers
        const firstChildCenter = childCenters[0]
        const lastChildCenter = childCenters[childCenters.length - 1]
        const centerY = (firstChildCenter + lastChildCenter) / 2

        nodePositions.set(nodeId, { x, y: centerY })

        return { endY: currentY, centerY }
    }

    // Position root at center (0, 0)
    nodePositions.set(root.id, { x: 0, y: 0 })
    nodeSideMap.set(root.id, 'center')

    // Calculate total heights for both sides
    let rightTotalHeight = 0
    rightChildren.forEach(child => {
        rightTotalHeight += calculateLeafCount(child.id) * VERTICAL_SPACING
    })

    let leftTotalHeight = 0
    leftChildren.forEach(child => {
        leftTotalHeight += calculateLeafCount(child.id) * VERTICAL_SPACING
    })

    // Use the MAXIMUM height so both sides are balanced around root
    const maxTotalHeight = Math.max(rightTotalHeight, leftTotalHeight)
    const startY = -maxTotalHeight / 2

    // Position right side children - start from root's position (0), children will be at HORIZONTAL_SPACING
    let currentRightY = startY + (maxTotalHeight - rightTotalHeight) / 2
    rightChildren.forEach((child) => {
        // Level 1 nodes will be positioned at x=0, then offset by positionSubtree
        // But we need them at HORIZONTAL_SPACING directly
        nodeSideMap.set(child.id, 'right')
        const result = positionSubtreeFromRoot(child.id, HORIZONTAL_SPACING, currentRightY, 'right')
        currentRightY = result.endY
    })

    // Position left side children - mirror of right side
    let currentLeftY = startY + (maxTotalHeight - leftTotalHeight) / 2
    leftChildren.forEach((child) => {
        nodeSideMap.set(child.id, 'left')
        const result = positionSubtreeFromRoot(child.id, -HORIZONTAL_SPACING, currentLeftY, 'left')
        currentLeftY = result.endY
    })

    // Helper to position subtree starting from a specific position (for level 1 nodes)
    function positionSubtreeFromRoot(
        nodeId: string,
        x: number,
        yStart: number,
        side: 'left' | 'right'
    ): { endY: number; centerY: number } {
        const children = childrenMap.get(nodeId) || []
        nodeSideMap.set(nodeId, side)

        if (children.length === 0) {
            nodePositions.set(nodeId, { x, y: yStart })
            return { endY: yStart + VERTICAL_SPACING, centerY: yStart }
        }

        // X offset direction based on side
        const xOffset = side === 'left' ? -HORIZONTAL_SPACING : HORIZONTAL_SPACING

        let currentY = yStart
        const childCenters: number[] = []

        children.forEach((child) => {
            const result = positionSubtreeFromRoot(child.id, x + xOffset, currentY, side)
            childCenters.push(result.centerY)
            currentY = result.endY
        })

        const firstChildCenter = childCenters[0]
        const lastChildCenter = childCenters[childCenters.length - 1]
        const centerY = (firstChildCenter + lastChildCenter) / 2

        nodePositions.set(nodeId, { x, y: centerY })

        return { endY: currentY, centerY }
    }

    // Create ReactFlow nodes
    mindmapNodes.forEach((node) => {
        const position = nodePositions.get(node.id) || { x: 0, y: 0 }
        const level = levelMap.get(node.id) || 0
        const edgeLabel = edgeLabelMap.get(node.id)
        const side = nodeSideMap.get(node.id) || 'right'

        nodes.push({
            id: node.id,
            type: "mindmapNode",
            position,
            data: {
                label: node.label,
                level,
                edgeLabel: edgeLabel || undefined,
                side // Pass side info to node component
            },
        })

        // Create edge to parent
        if (node.parentId) {
            const parentSide = nodeSideMap.get(node.parentId) || 'center'
            const nodeSide = nodeSideMap.get(node.id) || 'right'

            edges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: "default",
                sourceHandle: nodeSide === 'left' ? 'left' : 'right',
                targetHandle: nodeSide === 'left' ? 'right' : 'left',
                style: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                },
                animated: false,
            })
        }
    })

    return { nodes, edges }
}

export function MindmapTab({ noteId }: MindmapTabProps) {
    const { notes, getMindmapByNoteId, addMindmap, updateMindmap, addXP } = useStore()
    const { user } = useAuth()
    const note = notes.find((n) => n.id === noteId)

    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // History state for undo/redo
    const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [isDragging, setIsDragging] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isExitingFullscreen, setIsExitingFullscreen] = useState(false)
    const reactFlowInstance = useRef<any>(null)

    // Toggle fullscreen with exit animation (desktop only)
    const toggleFullscreen = useCallback(() => {
        if (isFullscreen) {
            // Exiting fullscreen - trigger exit animation first
            setIsExitingFullscreen(true)
            // Wait for animation then actually exit
            setTimeout(() => {
                setIsFullscreen(false)
                setIsExitingFullscreen(false)
                // FitView after exiting fullscreen (wait for layout to update)
                setTimeout(() => {
                    if (reactFlowInstance.current) {
                        reactFlowInstance.current.fitView({ padding: 0.1, duration: 300 })
                    }
                }, 100)
            }, 200) // Match animation duration
        } else {
            setIsFullscreen(true)
            // FitView after entering fullscreen (wait for layout to update)
            setTimeout(() => {
                if (reactFlowInstance.current) {
                    reactFlowInstance.current.fitView({ padding: 0.1, duration: 300 })
                }
            }, 100)
        }
    }, [isFullscreen])

    // Get existing mindmap from store
    const existingMindmap = getMindmapByNoteId(noteId)

    // Convert mindmap nodes to ReactFlow format
    const { initialNodes, initialEdges } = useMemo(() => {
        if (existingMindmap?.nodes && existingMindmap.nodes.length > 0) {
            const { nodes, edges } = convertToReactFlow(existingMindmap.nodes)
            return { initialNodes: nodes, initialEdges: edges }
        }
        return { initialNodes: [], initialEdges: [] }
    }, [existingMindmap])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // Save current state to history - use functional update to avoid stale closure
    const saveToHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        setHistory(prev => {
            // Get the actual current index from previous state
            const currentIndex = prev.length - 1
            // Remove any redo states after current position (if we're not at the end)
            const newHistory = historyIndex >= 0 && historyIndex < prev.length - 1
                ? prev.slice(0, historyIndex + 1)
                : [...prev]
            // Add new state
            newHistory.push({
                nodes: currentNodes.map(n => ({ ...n, position: { ...n.position } })),
                edges: [...currentEdges]
            })
            // Limit history to 50 states
            if (newHistory.length > 50) {
                newHistory.shift()
            }
            // Update historyIndex to point to the new state
            setHistoryIndex(newHistory.length - 1)
            return newHistory
        })
    }, [historyIndex])

    // Handle node changes with history tracking
    const handleNodesChange = useCallback((changes: any) => {
        // Check if any change is a position change (dragging)
        const positionChanges = changes.filter((c: any) => c.type === 'position')

        // Track drag start
        if (positionChanges.some((c: any) => c.dragging === true) && !isDragging) {
            setIsDragging(true)
            // Save state before drag starts
            saveToHistory(nodes, edges)
        }

        // Track drag end
        if (positionChanges.some((c: any) => c.dragging === false) && isDragging) {
            setIsDragging(false)
        }

        onNodesChange(changes)
    }, [onNodesChange, isDragging, nodes, edges, saveToHistory])

    // Undo function
    const handleUndo = useCallback(() => {
        if (historyIndex > 0 && history[historyIndex - 1]) {
            const prevState = history[historyIndex - 1]
            if (prevState && prevState.nodes && prevState.edges) {
                setNodes(prevState.nodes)
                setEdges(prevState.edges)
                setHistoryIndex(prev => prev - 1)
            }
        }
    }, [history, historyIndex, setNodes, setEdges])

    // Redo function
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
            const nextState = history[historyIndex + 1]
            if (nextState && nextState.nodes && nextState.edges) {
                setNodes(nextState.nodes)
                setEdges(nextState.edges)
                setHistoryIndex(prev => prev + 1)
            }
        }
    }, [history, historyIndex, setNodes, setEdges])

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z for undo (or Cmd+Z on Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
            }
            // Ctrl+Y for redo (or Ctrl+Shift+Z / Cmd+Shift+Z)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                handleRedo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo, handleRedo])

    // Check if undo/redo is available
    const canUndo = historyIndex > 0 && history.length > 0
    const canRedo = historyIndex < history.length - 1

    const handleGenerateMindmap = async () => {
        if (!note) return

        setIsGenerating(true)
        setError(null)

        try {
            // Generate mindmap using AI
            const mindmapNodes = await generateMindmapFromNote(note.content, note.title)

            const isNewMindmap = !existingMindmap
            const mindmapId = existingMindmap?.id || crypto.randomUUID()

            // Save to store (differentiate create vs regenerate)
            if (isNewMindmap) {
                addMindmap({
                    id: mindmapId,
                    noteId: noteId,
                    userId: user?.id || "demo-user",
                    nodes: mindmapNodes,
                })
                // Award XP for creating new mindmap
                addXP(20)
            } else {
                // Update existing mindmap (regenerate = edit activity)
                updateMindmap(existingMindmap.id, {
                    nodes: mindmapNodes,
                })
            }

            // Save to Supabase
            if (user) {
                await saveMindmapToSupabase({
                    id: mindmapId,
                    noteId: noteId,
                    userId: user.id,
                    nodes: mindmapNodes,
                })
            }

            // Update ReactFlow display
            const { nodes: newNodes, edges: newEdges } = convertToReactFlow(mindmapNodes)
            setNodes(newNodes)
            setEdges(newEdges)

            // Reset history when generating new mindmap
            setHistory([{ nodes: newNodes, edges: newEdges }])
            setHistoryIndex(0)
        } catch (err: any) {
            console.error("Error generating mindmap:", err)
            setError(err.message || "Gagal generate mindmap")
        } finally {
            setIsGenerating(false)
        }
    }

    // Reset layout to original calculated positions
    const handleResetLayout = () => {
        if (existingMindmap?.nodes && existingMindmap.nodes.length > 0) {
            // Save current state before reset
            saveToHistory(nodes, edges)

            const { nodes: resetNodes, edges: resetEdges } = convertToReactFlow(existingMindmap.nodes)
            setNodes(resetNodes)
            setEdges(resetEdges)
        }
    }

    const hasMindmap = nodes.length > 0

    return (
        <div className={cn(
            "flex flex-col bg-background",
            // Animation only on desktop (md and above) to avoid mobile performance issues
            "md:transition-all md:duration-200 md:ease-in-out",
            isFullscreen && !isExitingFullscreen
                ? "fixed inset-0 z-50 h-screen md:animate-in md:fade-in md:zoom-in-95"
                : isExitingFullscreen
                    ? "fixed inset-0 z-50 h-screen md:animate-out md:fade-out md:zoom-out-95"
                    : "h-full"
        )}>
            {/* Header with reduced padding */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b">
                <div>
                    <h3 className="text-lg font-semibold leading-none">Mindmap</h3>
                </div>
                <div className="flex gap-2">
                    {hasMindmap && (
                        <>
                            {/* Undo/Redo/Fullscreen Buttons */}
                            <div className="flex gap-1">
                                <Button
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Undo (Batalkan drag terakhir)"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Redo (Ulangi drag yang dibatalkan)"
                                >
                                    <Redo2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    onClick={toggleFullscreen}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                            <Button
                                onClick={handleResetLayout}
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                title="Reset posisi node ke layout asli"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                Reset Layout
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleGenerateMindmap}
                        disabled={isGenerating}
                        variant={hasMindmap ? "outline" : "default"}
                        className="h-8 gap-2"
                        size="sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Generating...
                            </>
                        ) : hasMindmap ? (
                            <>
                                <RefreshCw className="h-3.5 w-3.5" />
                                Regenerate
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                Generate Mindmap
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {
                error && (
                    <div className="mx-4 md:mx-6 mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )
            }

            {/* Mindmap Canvas - Truly Full bleed */}
            <div className="flex-1 flex flex-col min-h-[500px]">
                <Card className="flex-1 overflow-hidden border-none shadow-none rounded-none py-0!">
                    <CardContent className="p-0 h-full relative">
                        {hasMindmap ? (
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={handleNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodeTypes={nodeTypes}
                                onInit={(instance) => { reactFlowInstance.current = instance }}
                                fitView
                                fitViewOptions={{
                                    padding: 0.1,
                                    includeHiddenNodes: true
                                }}
                                minZoom={0.05}
                                maxZoom={1.5}
                                className="bg-background"
                            >
                                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                                <Controls
                                    showZoom={true}
                                    showFitView={true}
                                    showInteractive={false}
                                    className="bg-card border rounded-lg"
                                />
                            </ReactFlow>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h4 className="text-lg font-medium mb-2">Belum Ada Mindmap</h4>
                                <p className="text-muted-foreground max-w-sm mb-6">
                                    Klik tombol "Generate Mindmap" untuk membuat peta konsep dari catatan Anda secara otomatis menggunakan AI.
                                </p>
                                <Button onClick={handleGenerateMindmap} disabled={isGenerating} className="gap-2">
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Generate Mindmap
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
