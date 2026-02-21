export type MediaType = 'text' | 'image' | 'video' | 'audio'

export type Point = { x: number; y: number }

export type Workflow = {
  id: string
  name: string
  createdAt: string
}

export type Group = {
  id: string
  workflowId: string
  title: string
  position: Point
}

export type Pista = {
  id: string
  groupId: string
  order: number
  type: MediaType
  description: string
  content: string | null
  createdAt: string
  mediaUrl?: string
}

export type Connection = {
  id: string
  workflowId: string
  fromGroupId: string
  toGroupId: string
  createdAt: string
}

export type Entities<T> = Record<string, T>
