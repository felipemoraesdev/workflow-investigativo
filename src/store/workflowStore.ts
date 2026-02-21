import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Connection, Entities, Group, Pista, Workflow, Point } from '../types/models'

type WorkflowState = {
  workflows: Entities<Workflow>
  groups: Entities<Group>
  pistas: Entities<Pista>
  connections: Entities<Connection>
}

type WorkflowActions = {
  createWorkflow: (name: string, createdAt?: string) => string
  updateWorkflow: (id: string, data: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
}

type GroupActions = {
  createGroup: (workflowId: string, title: string, position: Point) => string
  updateGroup: (id: string, data: Partial<Group>) => void
  moveGroup: (id: string, position: Point) => void
  deleteGroup: (id: string) => void
}

type PistaActions = {
  createPista: (groupId: string, data: Omit<Pista, 'id' | 'groupId'>) => string
  updatePista: (id: string, data: Partial<Pista>) => void
  movePista: (id: string, groupId: string, order: number) => void
  deletePista: (id: string) => void
  reorderPistasInGroup: (groupId: string, orderedIds: string[]) => void
}

type ConnectionActions = {
  createConnection: (workflowId: string, fromGroupId: string, toGroupId: string) => string
  deleteConnection: (id: string) => void
}

export type WorkflowStore = 
  WorkflowState & 
  WorkflowActions & 
  GroupActions & 
  PistaActions & 
  ConnectionActions

const createWorkflowSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  WorkflowActions
> = (set) => ({
  createWorkflow: (name, createdAt = new Date().toISOString()) => {
    const id = uuidv4()
    set((state) => ({
      workflows: {
        ...state.workflows,
        [id]: { id, name, createdAt },
      },
    }))
    return id
  },
  updateWorkflow: (id, data) => {
    set((state) => {
      const workflow = state.workflows[id]
      if (!workflow) return state
      return {
        workflows: {
          ...state.workflows,
          [id]: { ...workflow, ...data },
        },
      }
    })
  },
  deleteWorkflow: (id) => {
    set((state) => {
      if (!state.workflows[id]) return state
      const { [id]: _deleted, ...rest } = state.workflows
      return {
        workflows: rest,
      }
    })
  },
})

const createGroupSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  GroupActions
> = (set) => ({
  createGroup: (workflowId, title, position) => {
    const id = uuidv4()
    set((state) => ({
      groups: {
        ...state.groups,
        [id]: { id, workflowId, title, position },
      },
    }))
    return id
  },
  updateGroup: (id, data) => {
    set((state) => {
      const group = state.groups[id]
      if (!group) return state
      return {
        groups: {
          ...state.groups,
          [id]: { ...group, ...data },
        },
      }
    })
  },
  moveGroup: (id, position) => {
    set((state) => {
      const group = state.groups[id]
      if (!group) return state
      return {
        groups: {
          ...state.groups,
          [id]: { ...group, position },
        },
      }
    })
  },
  deleteGroup: (id) => {
    set((state) => {
      if (!state.groups[id]) return state
      const { [id]: _deleted, ...rest } = state.groups
      const pistas = { ...state.pistas }
      Object.values(state.pistas).forEach((pista) => {
        if (pista.groupId === id) delete pistas[pista.id]
      })
      return { groups: rest, pistas }
    })
  },
})

const createPistaSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  PistaActions
> = (set) => ({
  createPista: (groupId, data) => {
    const id = uuidv4()
    set((state) => ({
      pistas: {
        ...state.pistas,
        [id]: { id, groupId, ...data },
      },
    }))
    return id
  },
  updatePista: (id, data) => {
    set((state) => {
      const pista = state.pistas[id]
      if (!pista) return state
      return {
        pistas: {
          ...state.pistas,
          [id]: { ...pista, ...data },
        },
      }
    })
  },
  movePista: (id, groupId, order) => {
    set((state) => {
      const pista = state.pistas[id]
      if (!pista) return state
      return {
        pistas: {
          ...state.pistas,
          [id]: { ...pista, groupId, order },
        },
      }
    })
  },
  deletePista: (id) => {
    set((state) => {
      if (!state.pistas[id]) return state
      const { [id]: _deleted, ...rest } = state.pistas
      return { pistas: rest }
    })
  },
  reorderPistasInGroup: (groupId, orderedIds) => {
    set((state) => {
      const updated = { ...state.pistas }
      orderedIds.forEach((id, index) => {
        const pista = updated[id]
        if (!pista || pista.groupId !== groupId) return
        updated[id] = { ...pista, order: index }
      })
      return { pistas: updated }
    })
  },
})

const createConnectionSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  ConnectionActions
> = (set) => ({
  createConnection: (workflowId, fromGroupId, toGroupId) => {
    const id = uuidv4()
    set((state) => ({
      connections: {
        ...state.connections,
        [id]: { id, workflowId, fromGroupId, toGroupId, createdAt: new Date().toISOString() },
      },
    }))
    return id
  },
  deleteConnection: (id) => {
    set((state) => {
      if (!state.connections[id]) return state
      const { [id]: _deleted, ...rest } = state.connections
      return { connections: rest }
    })
  },
})

const initialState: WorkflowState = {
  workflows: {},
  groups: {},
  pistas: {},
  connections: {},
}

export const useWorkflowStore = create<WorkflowStore>()((...a) => ({
  ...initialState,
  ...createWorkflowSlice(...a),
  ...createGroupSlice(...a),
  ...createPistaSlice(...a),
  ...createConnectionSlice(...a),
}))

export const selectWorkflowById = (id: string) => (state: WorkflowStore) =>
  state.workflows[id]

export const selectWorkflowsByCreatedAt = (state: WorkflowStore) =>
  Object.values(state.workflows).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

export const selectGroupsByWorkflow = (workflowId: string) => (state: WorkflowStore) =>
  Object.values(state.groups).filter((group) => group.workflowId === workflowId)

export const selectGroupIdsByWorkflow = (workflowId: string) => (state: WorkflowStore) =>
  Object.values(state.groups)
    .filter((group) => group.workflowId === workflowId)
    .map((group) => group.id)

export const selectGroupById = (id: string) => (state: WorkflowStore) => state.groups[id]

export const selectPistasByGroup = (groupId: string) => (state: WorkflowStore) =>
  Object.values(state.pistas)
    .filter((pista) => pista.groupId === groupId)
    .sort((a, b) => a.order - b.order)

export const selectPistaIdsByGroup = (groupId: string) => (state: WorkflowStore) =>
  Object.values(state.pistas)
    .filter((pista) => pista.groupId === groupId)
    .sort((a, b) => a.order - b.order)
    .map((pista) => pista.id)

export const selectPistaById = (id: string) => (state: WorkflowStore) => state.pistas[id]

export const selectConnectionsByWorkflow = (workflowId: string) => (state: WorkflowStore) =>
  Object.values(state.connections).filter((connection) => connection.workflowId === workflowId)
