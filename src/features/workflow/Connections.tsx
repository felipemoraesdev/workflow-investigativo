import { memo } from 'react'
import type { Point, Connection } from '../../types/models'

type ConnectionsProps = {
  connections: Connection[]
  getGroupCenter: (groupId: string) => Point | null
  worldToScreen: (point: Point) => Point
  buildPath: (from: Point, to: Point) => string
  selectedConnectionId: string | null
  onSelectConnection: (id: string) => void
  onDeselectConnection: () => void
  connectingFromId: string | null
  connectingPointer: Point | null
}

const Connections = memo(function Connections({
  connections,
  getGroupCenter,
  worldToScreen,
  buildPath,
  selectedConnectionId,
  onSelectConnection,
  onDeselectConnection,
  connectingFromId,
  connectingPointer,
}: ConnectionsProps) {
  return (
    <svg
      className="pointer-events-auto absolute left-0 top-0 h-full w-full"
      onPointerDown={onDeselectConnection}
    >
      {connections.map((connection) => {
        const from = getGroupCenter(connection.fromGroupId)
        const to = getGroupCenter(connection.toGroupId)

        if (!from || !to) return null

        const start = worldToScreen(from)
        const end = worldToScreen(to)
        const path = buildPath(start, end)
        const isSelected = selectedConnectionId === connection.id

        return (
          <path
            key={connection.id}
            d={path}
            fill="none"
            stroke={isSelected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(56, 189, 248, 0.7)'}
            strokeWidth={isSelected ? 7 : 5}
            onClick={(event) => {
              event.stopPropagation()
              onSelectConnection(connection.id)
            }}
            style={{ pointerEvents: 'stroke' }}
          />
        )
      })}
      {connectingFromId && connectingPointer && (() => {
        const from = getGroupCenter(connectingFromId)
        if (!from) return null
        const start = worldToScreen(from)
        const end = worldToScreen(connectingPointer)
        const path = buildPath(start, end)
        return (
          <path
            d={path}
            fill="none"
            stroke="rgba(148, 163, 184, 0.8)"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        )
      })()}
    </svg>
  )
})

export default Connections
