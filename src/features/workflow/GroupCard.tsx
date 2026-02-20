import { memo, useCallback, useRef } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { Point } from '../../types/models'
import Icon from '../../components/Icon'

type GroupCardProps = {
  groupId: string
  getScale: () => number
  onMove: (id: string, position: Point) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  isSelected: boolean
}

const GroupCard = memo(function ({
  groupId,
  getScale,
  onMove,
  onSelect,
  onEdit,
  isSelected,
}: GroupCardProps) {
  const group = useWorkflowStore((state) => state.groups[groupId])
  const dragState = useRef<{ start: Point; origin: Point } | null>(null)

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

  const handleEditClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      onEdit(groupId)
    },
    [groupId, onEdit],
  )

  if (!group) return null

  return (
    <div
      data-group="true"
      className={`pointer-events-auto absolute w-64 select-none rounded-xl border bg-slate-900/90 shadow-lg ${
        isSelected ? 'border-cyan-400/80 ring-2 ring-cyan-400/30' : 'border-slate-800'
      }`}
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
      <div className="p-3 text-xs text-slate-400">Arraste pelo topo para mover.</div>
    </div>
  )
})

export default GroupCard
