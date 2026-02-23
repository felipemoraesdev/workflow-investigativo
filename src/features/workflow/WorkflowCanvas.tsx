import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/shallow'
import { DragDropProvider, useDragDropMonitor } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import type { Point } from '../../types/models'
import {
  selectConnectionsByWorkflow,
  selectGroupIdsByWorkflow,
  useWorkflowStore,
} from '../../store/workflowStore'
import Button from '../../components/Button'
import GroupCard from './GroupCard'
import GroupModal from './GroupModal'
import Connections from './Connections'

const GRID_SIZE = 28
const GRID_COLOR = 'rgba(148, 163, 184, 0.5)'
const GROUP_WIDTH = 360
const GROUP_HEIGHT = 110
const MIN_SCALE = 0.3
const MAX_SCALE = 2.5
const ZOOM_STEP = 0.1

const WorkflowCanvas = memo(function WorkflowCanvas({ workflowId }: { workflowId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [size, setSize] = useState({ width: 1, height: 1, dpr: 1 })
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  const scaleRef = useRef(1)
  const dragRef = useRef<{ start: Point; origin: Point } | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [activePistaId, setActivePistaId] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [hoverGroupId, setHoverGroupId] = useState<string | null>(null)
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)
  const [connectingPointer, setConnectingPointer] = useState<Point | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const groupIdsSelector = useMemo(() => selectGroupIdsByWorkflow(workflowId), [workflowId])
  const groupIds = useWorkflowStore(useShallow(groupIdsSelector))
  const groups = useWorkflowStore((state) => state.groups)

  const connectionsSelector = useMemo(() => selectConnectionsByWorkflow(workflowId), [workflowId])
  const connections = useWorkflowStore(useShallow(connectionsSelector))

  const createGroup = useWorkflowStore((state) => state.createGroup)
  const moveGroup = useWorkflowStore((state) => state.moveGroup)
  const updateGroup = useWorkflowStore((state) => state.updateGroup)
  const deleteGroup = useWorkflowStore((state) => state.deleteGroup)

  const movePista = useWorkflowStore((state) => state.movePista)

  const createConnection = useWorkflowStore((state) => state.createConnection)
  const deleteConnection = useWorkflowStore((state) => state.deleteConnection)
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const clampScale = useCallback((value: number) => {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
  }, [])

  const screenToWorld = useCallback(
    (point: Point) => ({
      x: (point.x - offset.x) / scale,
      y: (point.y - offset.y) / scale,
    }),
    [offset.x, offset.y, scale],
  )

  const worldToScreen = useCallback((point: Point) => ({
      x: point.x * scale + offset.x,
      y: point.y * scale + offset.y,
    }), [offset.x, offset.y, scale])

  const getGroupCenter = useCallback((groupId: string) => {
    const group = groups[groupId]
    if (!group) return null

    return {
      x: group.position.x + GROUP_WIDTH / 2,
      y: group.position.y + GROUP_HEIGHT / 2,
    }
  }, [groups])

  const getPointerWorld = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return null

      const screenPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      return screenToWorld(screenPoint)
    },
    [screenToWorld],
  )

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr))
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr))

    if (
      nextWidth === Math.floor(size.width * size.dpr) &&
      nextHeight === Math.floor(size.height * size.dpr) &&
      dpr === size.dpr
    ) {
      return
    }

    canvas.width = nextWidth
    canvas.height = nextHeight
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    setSize({ width: rect.width, height: rect.height, dpr })
  }, [size.dpr, size.height, size.width])

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [resizeCanvas])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    ctx.clearRect(0, 0, size.width, size.height)

    const topLeft = screenToWorld({ x: 0, y: 0 })
    const bottomRight = screenToWorld({ x: size.width, y: size.height })
    const startX = Math.floor(topLeft.x / GRID_SIZE) * GRID_SIZE
    const startY = Math.floor(topLeft.y / GRID_SIZE) * GRID_SIZE

    ctx.fillStyle = GRID_COLOR
    for (let x = startX; x < bottomRight.x + GRID_SIZE; x += GRID_SIZE) {
      for (let y = startY; y < bottomRight.y + GRID_SIZE; y += GRID_SIZE) {
        const screen = worldToScreen({ x, y })
        ctx.fillRect(screen.x + 1, screen.y + 1, 1, 1)
      }
    }
  }, [scale, screenToWorld, size.dpr, size.height, size.width, worldToScreen])

  useEffect(() => {
    draw()
  }, [draw])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
    setSelectedGroupId(null)

    dragRef.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: { ...offset },
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }, [offset])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') {
      dragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
      return
    }
    if (event.buttons !== 1) {
      dragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
      return
    }
    const delta = {
      x: event.clientX - drag.start.x,
      y: event.clientY - drag.start.y,
    }
    setOffset({ x: drag.origin.x + delta.x, y: drag.origin.y + delta.y })
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleContainerPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
      if (!connectingFromId) return

      const worldPoint = getPointerWorld(event)

      if (worldPoint) {
        setConnectingPointer(worldPoint)
      }
    },
    [connectingFromId, getPointerWorld],
  )

  const handleContainerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
      setSelectedConnectionId(null)

      if (!connectingFromId) return

      const target = event.target as HTMLElement

      if (!target.closest('[data-group="true"]')) {
        handleCancelConnection()
      }
    },
    [connectingFromId],
  )

  const handleContainerPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
      const target = event.target as HTMLElement

      if (target.closest('button')) return
      if (target.closest('[data-group="true"]')) return
      if (target.closest('path')) return

      handlePointerDown(event)
    },
    [handlePointerDown],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
      event.preventDefault()
      const container = containerRef.current

      if (!container) return

      const rect = container.getBoundingClientRect()
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }

      if (event.ctrlKey || event.metaKey) {
        const direction = event.deltaY > 0 ? -1 : 1
        const nextScale = clampScale(scale + direction * ZOOM_STEP)
        const ratio = nextScale / scale

        setOffset((current) => ({
          x: pointer.x - (pointer.x - current.x) * ratio,
          y: pointer.y - (pointer.y - current.y) * ratio,
        }))
        setScale(nextScale)

        return
      }

      setOffset((current) => ({
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      }))
    },
    [clampScale, scale],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handler = (event: WheelEvent) => handleWheel(event)

    container.addEventListener('wheel', handler, { passive: false })

    return () => container.removeEventListener('wheel', handler)
  }, [handleWheel])

  const handleAddGroup = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleExportWorkflow = useCallback(() => {
    const state = useWorkflowStore.getState()
    const workflow = state.workflows[workflowId]
    if (!workflow) return

    const groups = Object.values(state.groups).filter((group) => group.workflowId === workflowId)
    const groupIds = new Set(groups.map((group) => group.id))
    const pistas = Object.values(state.pistas)
      .filter((pista) => groupIds.has(pista.groupId))
      .sort((a, b) => a.order - b.order)

    const connections = Object.values(state.connections).filter(
      (connection) => connection.workflowId === workflowId,
    )

    const payload = {
      workflow,
      groups,
      pistas,
      connections,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-${workflowId}.json`
    link.click()

    URL.revokeObjectURL(url)
  }, [workflowId])

  const handleCancelConnection = useCallback(() => {
    setConnectingFromId(null)
    setConnectingPointer(null)
    setHoverGroupId(null)
  }, [])

  const handleStartConnection = useCallback(
    (groupId: string) => {
      if (connectingFromId === groupId) {
        handleCancelConnection()
        return
      }

      const center = getGroupCenter(groupId)
      if (!center) return

      setConnectingFromId(groupId)
      setConnectingPointer(center)
      setHoverGroupId(null)
    },
    [connectingFromId, getGroupCenter, handleCancelConnection],
  )

  const handleConnectTarget = useCallback(
    (targetGroupId: string) => {
      if (!connectingFromId) return

      if (connectingFromId === targetGroupId) {
        handleCancelConnection()
        return
      }
      
      const state = useWorkflowStore.getState()
      const exists = Object
        .values(state.connections)
        .some(
          (connection) =>
            (
              connection.fromGroupId === connectingFromId &&
              connection.toGroupId === targetGroupId
            ) || (
              connection.fromGroupId === targetGroupId &&
              connection.toGroupId === connectingFromId
            )
      )

      if (!exists) {
        createConnection(workflowId, connectingFromId, targetGroupId)
      }

      handleCancelConnection()
    },
    [connectingFromId, createConnection, handleCancelConnection, workflowId],
  )

  const handleCreateGroup = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const center = screenToWorld({ x: rect.width / 2, y: rect.height / 2 })

    createGroup(workflowId, trimmed, {
      x: center.x - GROUP_WIDTH / 2,
      y: center.y - GROUP_HEIGHT / 2,
    })

    setIsCreateOpen(false)
  }, [createGroup, screenToWorld, workflowId])

  const handleCancelCreate = useCallback(() => {
    setIsCreateOpen(false)
  }, [])

  const handleMoveGroup = useCallback((id: string, position: Point) => {
    moveGroup(id, position)
  }, [moveGroup])

  const handleOpenEdit = useCallback((id: string) => {
    const group = useWorkflowStore.getState().groups[id]
    if (!group) return

    setEditingGroupId(id)
    setEditingGroupName(group.title)
    setIsEditOpen(true)
  }, [])

  const handleConfirmEdit = useCallback((value: string) => {
    if (!editingGroupId) return
    const trimmed = value.trim()

    if (trimmed) updateGroup(editingGroupId, { title: trimmed })

    setIsEditOpen(false)
    setEditingGroupId(null)
    setEditingGroupName('')
  }, [editingGroupId, updateGroup])

  const handleCancelEdit = useCallback(() => {
    setIsEditOpen(false)
    setEditingGroupId(null)
    setEditingGroupName('')
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && connectingFromId) {
        handleCancelConnection()
        return
      }

      if (event.key === 'Delete' && selectedConnectionId) {
        const confirmed = window.confirm('Deseja realmente excluir esta conexão?')
        if (!confirmed) return
        deleteConnection(selectedConnectionId)
        setSelectedConnectionId(null)
        return
      }

      if (!selectedGroupId) return
      if (event.key !== 'Delete') return

      const confirmed = window.confirm('Deseja realmente excluir este grupo?')
      if (!confirmed) return

      deleteGroup(selectedGroupId)
      setSelectedGroupId(null)
    }

    window.addEventListener('keydown', handler)
    
    return () => window.removeEventListener('keydown', handler)
  }, [
    connectingFromId,
    deleteConnection,
    deleteGroup,
    handleCancelConnection,
    selectedConnectionId,
    selectedGroupId,
  ])

  useEffect(() => {
    if (selectedGroupId && !groupIds.includes(selectedGroupId)) {
      setSelectedGroupId(null)
    }
  }, [groupIds, selectedGroupId])

  const overlayStyle = useMemo<CSSProperties>(
    () => ({
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      transformOrigin: '0 0',
    }),
    [offset.x, offset.y, scale],
  )

  const getScale = useCallback(() => scaleRef.current, [])

  const buildPath = useCallback((from: Point, to: Point) => {
    const c1 = { x: from.x, y: from.y }
    const c2 = { x: to.x, y: to.y }
    return `M ${from.x},${from.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`
  }, [])

  const buildGroupedPistas = useCallback(() => {
    const state = useWorkflowStore.getState()
    const grouped: Record<string, string[]> = {}
    Object.values(state.groups).forEach((group) => {
      if (group.workflowId === workflowId) grouped[group.id] = []
    })
    Object.values(state.pistas).forEach((pista) => {
      if (grouped[pista.groupId]) grouped[pista.groupId].push(pista.id)
    })
    Object.entries(grouped).forEach(([groupId, ids]) => {
      ids.sort((a, b) => state.pistas[a].order - state.pistas[b].order)
      grouped[groupId] = ids
    })
    return grouped
  }, [workflowId])

  const groupedPistasRef = useRef<Record<string, string[]> | null>(null)

  const applyGrouped = useCallback(
    (next: Record<string, string[]>) => {
      const state = useWorkflowStore.getState()
      Object.entries(next).forEach(([groupId, ids]) => {
        ids.forEach((id, index) => {
          const pista = state.pistas[id]
          if (!pista) return
          if (pista.groupId !== groupId || pista.order !== index) {
            movePista(id, groupId, index)
          }
        })
      })
    },
    [movePista],
  )

  const handlePistaDragStart = useCallback(() => {
    groupedPistasRef.current = buildGroupedPistas()
  }, [buildGroupedPistas])

  const handlePistaDragOver = useCallback(
    (event: unknown) => {
      if (!groupedPistasRef.current) {
        groupedPistasRef.current = buildGroupedPistas()
      }
      const next = move(groupedPistasRef.current, event)
      if (!next) return
      groupedPistasRef.current = next
      applyGrouped(next)
    },
    [applyGrouped, buildGroupedPistas],
  )

  const handlePistaDragEnd = useCallback(
    (event: { canceled: boolean }) => {
      if (event.canceled && groupedPistasRef.current) {
        applyGrouped(groupedPistasRef.current)
      }
      groupedPistasRef.current = null
    },
    [applyGrouped],
  )

  const DragMonitor = () => {
    useDragDropMonitor({
      onDragStart(event) {
        const source = event.operation.source as {
          id?: string | number
          sortable?: { group?: string | number }
        } | null
        setActivePistaId(source?.id ? String(source.id) : null)
        setActiveGroupId(source?.sortable?.group ? String(source.sortable.group) : null)
      },
      onDragOver(event) {
        const target = event.operation.target as {
          id?: string | number
          type?: string
          sortable?: { group?: string | number }
        } | null

        const targetGroup = target?.sortable?.group

        if (targetGroup) {
          setDragOverGroupId(String(targetGroup))
          return
        }

        if (target?.type === 'column') {
          setDragOverGroupId(target?.id ? String(target.id) : null)
          return
        }

        setDragOverGroupId(null)
      },
      onDragEnd() {
        setDragOverGroupId(null)
        setActivePistaId(null)
        setActiveGroupId(null)
      },
    })
    return null
  }

  return (
    <div className="relative h-[100svh] w-full">
      <DragDropProvider
        onDragStart={handlePistaDragStart}
        onDragOver={handlePistaDragOver}
        onDragEnd={handlePistaDragEnd}
      >
        <DragMonitor />
        <div
          ref={containerRef}
          className="relative h-full w-full overflow-hidden bg-slate-950/40"
          onPointerMove={handleContainerPointerMove}
          onPointerDown={handleContainerPointerDown}
          onPointerDownCapture={handleContainerPointerDownCapture}
          onPointerMoveCapture={(event) => {
            if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
            if (dragRef.current) handlePointerMove(event)
          }}
          onPointerUpCapture={(event) => {
            if (typeof document !== 'undefined' && document.body.dataset.modalOpen === 'true') return
            if (dragRef.current) handlePointerUp(event)
          }}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ touchAction: 'none' }}
          />
          <Connections
            connections={connections}
            getGroupCenter={getGroupCenter}
            worldToScreen={worldToScreen}
            buildPath={buildPath}
            selectedConnectionId={selectedConnectionId}
            onSelectConnection={(id) => {
              setSelectedConnectionId(id)
              setSelectedGroupId(null)
            }}
            onDeselectConnection={() => setSelectedConnectionId(null)}
            connectingFromId={connectingFromId}
            connectingPointer={connectingPointer}
          />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
            <div className="absolute left-0 top-0" style={overlayStyle}>
              {groupIds.map((groupId) => (
                <GroupCard
                  key={groupId}
                  groupId={groupId}
                  getScale={getScale}
                  onMove={handleMoveGroup}
                  onSelect={setSelectedGroupId}
                  onEdit={handleOpenEdit}
                  onConnectStart={handleStartConnection}
                  onConnectTarget={handleConnectTarget}
                  onHoverConnectTarget={setHoverGroupId}
                  isSelected={selectedGroupId === groupId}
                  dragOverGroupId={dragOverGroupId}
                  activePistaId={activePistaId}
                  activeGroupId={activeGroupId}
                  isConnectingMode={Boolean(connectingFromId)}
                  isConnectingFrom={connectingFromId === groupId}
                  isConnectTarget={hoverGroupId === groupId && connectingFromId !== groupId}
                />
              ))}
            </div>
          </div>
        </div>
      </DragDropProvider>

      <div className="pointer-events-auto absolute right-6 top-6 z-10 flex items-center gap-3">
        <Button variant="secondary" onClick={handleExportWorkflow}>
          Exportar JSON
        </Button>
        <Button onClick={handleAddGroup}>Novo grupo</Button>
      </div>
      
      <GroupModal
        isOpen={isCreateOpen}
        title="Novo grupo"
        description="Informe o nome do grupo para criar."
        confirmLabel="Criar"
        initialValue=""
        onConfirm={handleCreateGroup}
        onCancel={handleCancelCreate}
      />
      
      <GroupModal
        isOpen={isEditOpen}
        title="Editar grupo"
        description="Atualize o nome do grupo selecionado."
        confirmLabel="Salvar"
        initialValue={editingGroupName}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />
      
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-400 backdrop-blur sm:bottom-6 sm:left-6 sm:text-xs">
        <span>Zoom: Ctrl/Cmd + scroll</span>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-400 backdrop-blur sm:bottom-6 sm:right-6 sm:text-xs">
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
})

export default WorkflowCanvas
