"use client"

import { useState, useCallback, useMemo } from "react"
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
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { generateMindmapFromNote } from "@/lib/ai-service"
import { saveMindmapToSupabase } from "@/lib/supabase-helpers"
import { Loader2, Sparkles, RefreshCw, LayoutGrid, Undo2, Redo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MindmapNode } from "@/lib/types"

interface MindmapTabProps {
    noteId: string
}

// Custom node component for mindmap with handles and relationship subtitle
function MindmapNodeComponent({ data }: { data: { label: string; level: number; edgeLabel?: string } }) {
    const bgColors = [
        "bg-gradient-to-br from-primary to-primary/80", // Root
        "bg-gradient-to-br from-blue-500 to-blue-600", // Level 1
        "bg-gradient-to-br from-emerald-500 to-emerald-600", // Level 2
        "bg-gradient-to-br from-amber-500 to-amber-600", // Level 3
        "bg-gradient-to-br from-purple-500 to-purple-600", // Level 4+
    ]

    const level = Math.min(data.level, 4)

    return (
        <div className="relative">
            {/* Target handle (left side - hidden but functional) */}
            <Handle
                type="target"
                position={Position.Left}
                className="opacity-0! w-2! h-2!"
            />

            {/* Node content with optional relationship subtitle */}
            <div
                className={cn(
                    "px-4 py-2 rounded-lg shadow-lg text-white font-medium text-center transition-transform hover:scale-105",
                    bgColors[level],
                    level === 0 ? "text-lg px-6 py-3" : "text-sm"
                )}
            >
                {/* Relationship subtitle - shows how this node relates to parent */}
                {data.edgeLabel && (
                    <div className="text-[10px] opacity-70 mb-0.5 font-normal italic">
                        {data.edgeLabel}
                    </div>
                )}
                {/* Main label */}
                <div>{data.label}</div>
            </div>

            {/* Source handle (right side - hidden but functional) */}
            <Handle
                type="source"
                position={Position.Right}
                className="opacity-0! w-2! h-2!"
            />
        </div>
    )
}

const nodeTypes = {
    mindmapNode: MindmapNodeComponent,
}

// Convert MindmapNode[] to ReactFlow nodes and edges with tree-based layout
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

    // Layout constants - increased for better spacing
    const ROOT_SPACING = 550        // Jarak khusus dari root ke level 1 (diperbesar)
    const HORIZONTAL_SPACING = 350  // Jarak antar level lainnya (horizontal)
    const VERTICAL_SPACING = 100    // Jarak antar sibling nodes (vertical)

    // Calculate subtree leaf count (for balanced spacing)
    const subtreeLeafCount = new Map<string, number>()

    function calculateLeafCount(nodeId: string): number {
        const children = childrenMap.get(nodeId) || []
        if (children.length === 0) {
            subtreeLeafCount.set(nodeId, 1)
            return 1
        }
        let totalLeaves = 0
        children.forEach((child) => {
            totalLeaves += calculateLeafCount(child.id)
        })
        subtreeLeafCount.set(nodeId, totalLeaves)
        return totalLeaves
    }

    calculateLeafCount(root.id)

    // Position nodes - children first, then center parent among them
    const nodePositions = new Map<string, { x: number; y: number }>()

    function positionSubtree(nodeId: string, x: number, yStart: number, level: number): { endY: number; centerY: number } {
        const children = childrenMap.get(nodeId) || []

        if (children.length === 0) {
            // Leaf node
            nodePositions.set(nodeId, { x, y: yStart })
            return { endY: yStart + VERTICAL_SPACING, centerY: yStart }
        }

        // Determine spacing based on level (root gets extra space)
        const spacing = level === 0 ? ROOT_SPACING : HORIZONTAL_SPACING

        // Position all children and track their centers
        let currentY = yStart
        const childCenters: number[] = []

        children.forEach((child) => {
            const result = positionSubtree(child.id, x + spacing, currentY, level + 1)
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

    // First pass: position everything starting from Y=0
    // Start root at a negative X to shift the whole tree left and make room for children
    positionSubtree(root.id, -100, 0, 0)

    // Second pass: shift everything so root is at Y=0
    const rootPos = nodePositions.get(root.id)
    if (rootPos && rootPos.y !== 0) {
        const offset = rootPos.y
        nodePositions.forEach((pos, nodeId) => {
            nodePositions.set(nodeId, { x: pos.x, y: pos.y - offset })
        })
    }

    // Create ReactFlow nodes
    mindmapNodes.forEach((node) => {
        const position = nodePositions.get(node.id) || { x: 0, y: 0 }
        const level = levelMap.get(node.id) || 0
        const edgeLabel = edgeLabelMap.get(node.id)

        nodes.push({
            id: node.id,
            type: "mindmapNode",
            position,
            data: {
                label: node.label,
                level,
                edgeLabel: edgeLabel || undefined // Pass edgeLabel to node for subtitle display
            },
        })

        // Create clean bezier edge to parent
        if (node.parentId) {
            edges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: "default", // Bezier curve for smoother lines
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

    // Save current state to history
    const saveToHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        setHistory(prev => {
            // Remove any redo states after current index
            const newHistory = prev.slice(0, historyIndex + 1)
            // Add new state
            newHistory.push({
                nodes: currentNodes.map(n => ({ ...n, position: { ...n.position } })),
                edges: [...currentEdges]
            })
            // Limit history to 50 states
            if (newHistory.length > 50) {
                newHistory.shift()
                return newHistory
            }
            return newHistory
        })
        setHistoryIndex(prev => Math.min(prev + 1, 49))
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
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1]
            setNodes(prevState.nodes)
            setEdges(prevState.edges)
            setHistoryIndex(prev => prev - 1)
        }
    }, [history, historyIndex, setNodes, setEdges])

    // Redo function
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1]
            setNodes(nextState.nodes)
            setEdges(nextState.edges)
            setHistoryIndex(prev => prev + 1)
        }
    }, [history, historyIndex, setNodes, setEdges])

    // Check if undo/redo is available
    const canUndo = historyIndex > 0
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
        <div className="h-full flex flex-col">
            {/* Header with reduced padding */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b">
                <div>
                    <h3 className="text-lg font-semibold leading-none">Mindmap</h3>
                </div>
                <div className="flex gap-2">
                    {hasMindmap && (
                        <>
                            {/* Undo/Redo Buttons */}
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

            {error && (
                <div className="mx-4 md:mx-6 mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                </div>
            )}

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
        </div>
    )
}
