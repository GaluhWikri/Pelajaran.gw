"use client"

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react"
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
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

// Memoize the node component to prevent unnecessary re-renders in large maps
const MindmapNodeComponent = memo(({ data }: { data: { label: string; level: number; edgeLabel?: string; side?: 'left' | 'right' | 'center'; isActivePath?: boolean } }) => {
    // Determining styling level
    const level = Math.min(data.level, 4)
    const side = data.side || 'right'
    const isCenter = side === 'center'

    // Configurable styles for different levels
    const nodeStyles = [
        {
            wrapper: "bg-slate-900 border-2 border-orange-500 shadow-md",
            text: "text-orange-100 font-bold",
            badge: "bg-orange-500/20 text-orange-200",
        },
        {
            wrapper: "bg-slate-900 border-2 border-blue-500 shadow-sm",
            text: "text-blue-100 font-semibold",
            badge: "bg-blue-500/20 text-blue-200",
        },
        {
            wrapper: "bg-slate-900 border-2 border-emerald-500 shadow-sm",
            text: "text-emerald-100 font-medium",
            badge: "bg-emerald-500/20 text-emerald-200",
        },
        {
            wrapper: "bg-slate-900 border-2 border-pink-500 shadow-sm",
            text: "text-pink-100",
            badge: "bg-pink-500/20 text-pink-200",
        },
        {
            wrapper: "bg-slate-900 border-2 border-violet-500 shadow-sm",
            text: "text-violet-100",
            badge: "bg-violet-500/20 text-violet-200",
        },
    ]

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

            {/* Node Content */}
            <div
                className={cn(
                    // Shape & Base
                    "relative px-5 py-4 rounded-xl",
                    style.wrapper,
                    style.text,
                    // Layout & Stability - Exclusive sizing to prevent conflicts
                    "flex flex-col items-center justify-center text-center",
                    level === 0 ? "w-[280px] min-h-[90px] text-lg rounded-2xl" : "w-[220px] min-h-[70px] text-sm",
                    "break-words overflow-visible",
                    // Performance Optimization - Stable 2D Transform
                    "will-change-transform transition-transform duration-200 ease-out",
                    data.isActivePath ? "scale-105 shadow-xl brightness-110 ring-2 ring-white/40" : "hover:scale-105 hover:-translate-y-2 hover:shadow-2xl",
                    "cursor-pointer",
                )}
            >
                {/* Relationship Badge (Pill) - Removed backdrop-blur for SVG stability */}
                {data.edgeLabel && (
                    <div className={cn(
                        "absolute -top-2 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm border border-white/10",
                        style.badge
                    )}>
                        {data.edgeLabel}
                    </div>
                )}

                {/* Main Label */}
                <div className="relative z-10 whitespace-pre-wrap leading-tight">
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
})
MindmapNodeComponent.displayName = "MindmapNodeComponent"

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

    // Recursive helper to position subtrees
    function positionNode(
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

        const xOffset = side === 'left' ? -HORIZONTAL_SPACING : HORIZONTAL_SPACING
        let currentY = yStart
        const childCenters: number[] = []

        children.forEach((child) => {
            const result = positionNode(child.id, x + xOffset, currentY, side)
            childCenters.push(result.centerY)
            currentY = result.endY
        })

        const centerY = (childCenters[0] + childCenters[childCenters.length - 1]) / 2
        nodePositions.set(nodeId, { x, y: centerY })

        return { endY: currentY, centerY }
    }

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

    // Position root at center (0, 0)
    nodePositions.set(root.id, { x: 0, y: 0 })
    nodeSideMap.set(root.id, 'center')

    // Calculate start Y to balance both sides around root's Y=0
    const calculateSideHeight = (sideChildren: MindmapNode[]) =>
        sideChildren.reduce((acc, child) => acc + calculateLeafCount(child.id), 0) * VERTICAL_SPACING

    const rightHeight = calculateSideHeight(rightChildren)
    const leftHeight = calculateSideHeight(leftChildren)
    const maxH = Math.max(rightHeight, leftHeight)
    const startY = -maxH / 2

    // Position sides
    let currentRightY = startY + (maxH - rightHeight) / 2
    rightChildren.forEach((child) => {
        const result = positionNode(child.id, HORIZONTAL_SPACING, currentRightY, 'right')
        currentRightY = result.endY
    })

    let currentLeftY = startY + (maxH - leftHeight) / 2
    leftChildren.forEach((child) => {
        const result = positionNode(child.id, -HORIZONTAL_SPACING, currentLeftY, 'left')
        currentLeftY = result.endY
    })

    // Create ReactFlow nodes & edges with safety check for orphans
    mindmapNodes.forEach((node) => {
        if (!nodePositions.has(node.id)) return // Skip orphans to prevent stray lines at (0,0)

        const position = nodePositions.get(node.id)!
        const level = levelMap.get(node.id) || 0
        const edgeLabel = edgeLabelMap.get(node.id)
        const side = nodeSideMap.get(node.id) || 'right'

        nodes.push({
            id: node.id,
            type: "mindmapNode",
            position,
            data: { label: node.label, level, edgeLabel: edgeLabel || undefined, side },
        })

        if (node.parentId && nodePositions.has(node.parentId)) {
            edges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: "default", // Reverted to curved edges as requested
                sourceHandle: side === 'left' ? 'left' : 'right',
                targetHandle: side === 'left' ? 'right' : 'left',
                style: { stroke: '#64748b', strokeWidth: 2 },
                animated: false,
            })
        }
    })

    return { nodes, edges }
}

const MindmapContent = ({ noteId }: MindmapTabProps) => {
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
    const hoveredNodeId = useRef<string | null>(null) // Hover Guard Ref
    const { fitView, getEdges } = useReactFlow()

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
                    fitView({
                        padding: 0.3,
                        duration: 500,
                        includeHiddenNodes: true
                    })
                }, 300)
            }, 200) // Match animation duration
        } else {
            setIsFullscreen(true)
            // Wait longer for fullscreen transition to finish before calculating map bounds
            setTimeout(() => {
                fitView({
                    padding: 0.3,
                    duration: 500,
                    includeHiddenNodes: true
                })
            }, 500) // Longer delay to ensure container is fully expanded
        }
    }, [isFullscreen, fitView])

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

    // Sync ReactFlow state when a mindmap is loaded or regenerated
    const nodesJson = JSON.stringify(existingMindmap?.nodes)
    useEffect(() => {
        if (existingMindmap?.nodes && existingMindmap.nodes.length > 0) {
            const { nodes: newNodes, edges: newEdges } = convertToReactFlow(existingMindmap.nodes)
            setNodes(newNodes)
            setEdges(newEdges)
            // Reset history when a fresh mindmap is loaded from store
            setHistory([{ nodes: newNodes, edges: newEdges }])
            setHistoryIndex(0)

            // Auto-fit view when mindmap changes
            setTimeout(() => {
                fitView({ padding: 0.3, duration: 400, includeHiddenNodes: true })
            }, 100)
        }
    }, [noteId, nodesJson, setNodes, setEdges, fitView]) // Re-run when switching notes OR when mindmap content changes

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

    // Animate edges on node hover - traces path to root AND all descendants
    const onNodeMouseEnter = useCallback((_event: any, node: Node) => {
        if (hoveredNodeId.current === node.id) return
        hoveredNodeId.current = node.id

        const currentEdges = getEdges()
        const pathNodeIds = new Set<string>([node.id])
        const pathEdgeIds = new Set<string>()

        // 1. Recursive Helpers using current state from getEdges()
        const findPathToRoot = (targetId: string) => {
            const incomingEdge = currentEdges.find(e => e.target === targetId)
            if (incomingEdge) {
                pathEdgeIds.add(incomingEdge.id)
                pathNodeIds.add(incomingEdge.source)
                findPathToRoot(incomingEdge.source)
            }
        }

        const findDescendants = (sourceId: string) => {
            const outgoingEdges = currentEdges.filter(e => e.source === sourceId)
            outgoingEdges.forEach(edge => {
                pathEdgeIds.add(edge.id)
                pathNodeIds.add(edge.target)
                findDescendants(edge.target)
            })
        }

        findPathToRoot(node.id)
        findDescendants(node.id)

        // 2. Optimized State Updates with zIndex boosting
        setNodes((nds) => nds.map(n => {
            const shouldBeActive = pathNodeIds.has(n.id)
            if (n.data.isActivePath === shouldBeActive) return n
            return {
                ...n,
                zIndex: shouldBeActive ? 1000 : 0, // Boost active path to front
                data: { ...n.data, isActivePath: shouldBeActive }
            }
        }))

        setEdges((eds) => eds.map((edge) => {
            const isPathEdge = pathEdgeIds.has(edge.id)
            if (edge.animated === isPathEdge) return edge

            return {
                ...edge,
                animated: isPathEdge,
                style: {
                    ...edge.style,
                    stroke: isPathEdge ? '#6366f1' : '#64748b',
                    strokeWidth: isPathEdge ? 3 : 2
                },
            }
        }))
    }, [getEdges, setEdges, setNodes])

    const onNodeMouseLeave = useCallback((_event: any, node: Node) => {
        // ONLY reset if we are truly leaving the current hovered node
        // and not just moving to a child or parent node
        if (hoveredNodeId.current !== node.id) return
        hoveredNodeId.current = null

        setNodes((nds) => {
            if (!nds.some(n => n.data.isActivePath)) return nds
            return nds.map(n => ({
                ...n,
                zIndex: 0,
                data: { ...n.data, isActivePath: false }
            }))
        })

        setEdges((eds) => {
            if (!eds.some(e => e.animated)) return eds
            return eds.map((edge) => ({
                ...edge,
                animated: false,
                style: { ...edge.style, stroke: '#64748b', strokeWidth: 2 },
            }))
        })
    }, [setEdges, setNodes])

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
            "flex flex-col bg-background transition-all duration-300 ease-in-out",
            isFullscreen && !isExitingFullscreen
                ? "fixed inset-0 z-50 h-screen animate-in fade-in"
                : isExitingFullscreen
                    ? "fixed inset-0 z-50 h-screen animate-out fade-out"
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
                                onNodeMouseEnter={onNodeMouseEnter}
                                onNodeMouseLeave={onNodeMouseLeave}
                                nodeTypes={nodeTypes}
                                nodeOrigin={[0.5, 0.5]}
                                fitView
                                fitViewOptions={{
                                    padding: 0.1,
                                    includeHiddenNodes: true
                                }}
                                minZoom={0.05}
                                maxZoom={1.5}
                                onlyRenderVisibleElements={false} // Prevent elements disappearing on zoom
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

export function MindmapTab(props: MindmapTabProps) {
    return (
        <ReactFlowProvider>
            <MindmapContent {...props} />
        </ReactFlowProvider>
    )
}
