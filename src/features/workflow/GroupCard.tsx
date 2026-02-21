import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { Point, MediaType } from '../../types/models'
import Icon from '../../components/Icon'
import { useShallow } from 'zustand/shallow'
import PistaItem from './PistaItem'
import Button from '../../components/Button'
import PistaModal from './PistaModal'
import { twMerge } from 'tailwind-merge'
import { useDroppable } from '@dnd-kit/react'

type GroupCardProps = {
  groupId: string
  getScale: () => number
  onMove: (id: string, position: Point) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  isSelected: boolean
  dragOverGroupId: string | null
  activePistaId: string | null
  activeGroupId: string | null
}

const GroupCard = memo(function GroupCard({
  groupId,
  getScale,
  onMove,
  onSelect,
  onEdit,
  isSelected,
  dragOverGroupId,
  activePistaId,
  activeGroupId,
}: GroupCardProps) {
  const group = useWorkflowStore((state) => state.groups[groupId])
  const dragState = useRef<{ start: Point; origin: Point } | null>(null)

  const pistaIdsSelector = useMemo(
    () => (state: ReturnType<typeof useWorkflowStore.getState>) =>
      Object.values(state.pistas)
        .filter((pista) => pista.groupId === groupId)
        .sort((a, b) => a.order - b.order)
        .map((pista) => pista.id),
    [groupId]
  )
  const pistaIds = useWorkflowStore(useShallow(pistaIdsSelector))

  const createPista = useWorkflowStore((state) => state.createPista)
  const [isPistaOpen, setIsPistaOpen] = useState(false)

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !group) return

    const target = event.target as HTMLElement

    if (target.closest('button')) return

    event.stopPropagation()
    onSelect(groupId)

    dragState.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: { ...group.position },
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }, [group, groupId, onSelect])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return

    const scale = getScale()
    const deltaX = (event.clientX - dragState.current.start.x) / scale
    const deltaY = (event.clientY - dragState.current.start.y) / scale

    onMove(groupId, {
      x: dragState.current.origin.x + deltaX,
      y: dragState.current.origin.y + deltaY,
    })
  }, [getScale, groupId, onMove])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return

    dragState.current = null
    
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleTitleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onSelect(groupId)
  }, [groupId, onSelect])

  const handleEditClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onEdit(groupId)
  },[groupId, onEdit])

  const handleAddPista = useCallback(() => {
    setIsPistaOpen(true)
  }, [])

  const handleCreatePista = useCallback((data: { type: MediaType; description: string; content: string | null; mediaUrl?: string }) => {
    const trimmed = data.content?.trim() ?? ''

    if (!group) return
    if (!data.description.trim()) return
    if (data.type === 'text' && !trimmed) return
    if (data.type !== 'text' && !data.mediaUrl) return

    createPista(group.id, {
      order: pistaIds.length,
      type: data.type,
      description: data.description.trim(),
      content: data.type === 'text' ? trimmed : null,
      createdAt: new Date().toISOString(),
      mediaUrl: data.mediaUrl,
    })

    setIsPistaOpen(false)
  },[createPista, group, pistaIds.length])

  const handleCancelPista = useCallback(() => {
    setIsPistaOpen(false)
  }, [])

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: groupId,
    type: 'column',
    accept: ['pista'],
  })

  const isDragOver = dragOverGroupId === groupId

  const showPlaceholder =
    isDragOver 
    && activeGroupId !== null
    && activeGroupId !== groupId

  const showOriginPlaceholder =
    activeGroupId === groupId 
    && dragOverGroupId !== null 
    && dragOverGroupId !== groupId

  if (!group) return null

  return (
    <div
      data-group="true"
      className={twMerge(
        "pointer-events-auto absolute w-[360px] select-none rounded-xl border bg-slate-900/90 shadow-lg", 
        isSelected ? "border-cyan-400/80 ring-2 ring-cyan-400/30" : "border-slate-800"
      )}
      style={{
        transform: `translate(${group.position.x}px, ${group.position.y}px)`,
      }}
    >
      <div
        className="flex items-center justify-between rounded-t-xl border-b border-slate-800 bg-slate-900 px-3 py-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs font-semibold text-slate-100"
            onClick={handleTitleClick}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {group.title}
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-400 transition hover:text-cyan-200 cursor-pointer"
            onClick={handleEditClick}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Editar nome do grupo"
            title="Editar"
          >
            <Icon name="edit" size={14} />
          </button>
        </div>
      </div>
      <div className="px-3 py-3" ref={droppableRef}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Pistas</span>
          <Button variant="secondary" onClick={handleAddPista} className="px-2 py-1">
            Adicionar pista
          </Button>
        </div>
        <div
          className={twMerge(
            'flex flex-col gap-2 rounded-lg border border-transparent p-1',
          )}
        >
          {pistaIds.map((pistaId, index) => (
            <PistaItem
              key={pistaId}
              pistaId={pistaId}
              index={index}
              groupId={groupId}
              isActive={activePistaId === pistaId}
            />
          ))}
          
          {showOriginPlaceholder && (
            <div className="rounded-lg border border-dashed border-rose-400/60 bg-rose-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-rose-200">
              Removendo
            </div>
          )}
          {showPlaceholder && (
            <div className="rounded-lg border border-dashed border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-200">
              Solte aqui
            </div>
          )}

        </div>
      </div>
      {isPistaOpen && (
        <PistaModal onConfirm={handleCreatePista} onCancel={handleCancelPista} />
      )}
    </div>
  )
})

export default GroupCard
