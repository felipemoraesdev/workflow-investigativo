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

type HistoryState = {
  historyPast: WorkflowState[]
  historyFuture: WorkflowState[]
  historyBatchDepth: number
  historyBatchSnapshotTaken: boolean
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

type HistoryActions = {
  undo: () => void
  redo: () => void
  resetHistory: () => void
  beginHistoryBatch: () => void
  endHistoryBatch: () => void
}

export type WorkflowStore = 
  WorkflowState &
  HistoryState &
  WorkflowActions &
  GroupActions &
  PistaActions &
  ConnectionActions &
  HistoryActions

const HISTORY_LIMIT = 50

const createSnapshot = (state: WorkflowState): WorkflowState => ({
  workflows: { ...state.workflows },
  groups: { ...state.groups },
  pistas: { ...state.pistas },
  connections: { ...state.connections },
})

const pushHistory = (set: (next: Partial<WorkflowStore>) => void, get: () => WorkflowStore) => {
  const state = get()
  const snapshot = createSnapshot(state)
  const nextPast = [...state.historyPast, snapshot].slice(-HISTORY_LIMIT)

  if (state.historyBatchDepth > 0) {
    if (state.historyBatchSnapshotTaken) return
    set({
      historyPast: nextPast,
      historyFuture: [],
      historyBatchSnapshotTaken: true,
    })
    return
  }

  set({ historyPast: nextPast, historyFuture: [] })
}

const createWorkflowSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  WorkflowActions
> = (set, get) => ({
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
> = (set, get) => ({
  createGroup: (workflowId, title, position) => {
    const id = uuidv4()
    pushHistory(set, get)
    set((state) => ({
      groups: {
        ...state.groups,
        [id]: { id, workflowId, title, position },
      },
    }))
    return id
  },
  updateGroup: (id, data) => {
    pushHistory(set, get)
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
    pushHistory(set, get)
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
    pushHistory(set, get)
    set((state) => {
      if (!state.groups[id]) return state
      const { [id]: _deleted, ...rest } = state.groups
      const pistas = { ...state.pistas }
      Object.values(state.pistas).forEach((pista) => {
        if (pista.groupId === id) delete pistas[pista.id]
      })
      const connections = { ...state.connections }
      Object.values(state.connections).forEach((connection) => {
        if (connection.fromGroupId === id || connection.toGroupId === id) {
          delete connections[connection.id]
        }
      })
      return { groups: rest, pistas, connections }
    })
  },
})

const createPistaSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  PistaActions
> = (set, get) => ({
  createPista: (groupId, data) => {
    const id = uuidv4()
    pushHistory(set, get)
    set((state) => ({
      pistas: {
        ...state.pistas,
        [id]: { id, groupId, ...data },
      },
    }))
    return id
  },
  updatePista: (id, data) => {
    pushHistory(set, get)
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
    pushHistory(set, get)
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
    pushHistory(set, get)
    set((state) => {
      if (!state.pistas[id]) return state
      const { [id]: _deleted, ...rest } = state.pistas
      return { pistas: rest }
    })
  },
  reorderPistasInGroup: (groupId, orderedIds) => {
    pushHistory(set, get)
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
> = (set, get) => ({
  createConnection: (workflowId, fromGroupId, toGroupId) => {
    const id = uuidv4()
    pushHistory(set, get)
    set((state) => ({
      connections: {
        ...state.connections,
        [id]: { id, workflowId, fromGroupId, toGroupId, createdAt: new Date().toISOString() },
      },
    }))
    return id
  },
  deleteConnection: (id) => {
    pushHistory(set, get)
    set((state) => {
      if (!state.connections[id]) return state
      const { [id]: _deleted, ...rest } = state.connections
      return { connections: rest }
    })
  },
})

const createHistorySlice: StateCreator<
  WorkflowStore,
  [],
  [],
  HistoryActions
> = (set, get) => ({
  undo: () => {
    set((state) => {
      if (state.historyPast.length === 0) return state
      const previous = state.historyPast[state.historyPast.length - 1]
      const past = state.historyPast.slice(0, -1)
      const future = [createSnapshot(state), ...state.historyFuture]
      return {
        ...previous,
        historyPast: past,
        historyFuture: future,
        historyBatchDepth: 0,
        historyBatchSnapshotTaken: false,
      }
    })
  },
  redo: () => {
    set((state) => {
      if (state.historyFuture.length === 0) return state
      const next = state.historyFuture[0]
      const future = state.historyFuture.slice(1)
      const past = [...state.historyPast, createSnapshot(state)].slice(-HISTORY_LIMIT)
      return {
        ...next,
        historyPast: past,
        historyFuture: future,
        historyBatchDepth: 0,
        historyBatchSnapshotTaken: false,
      }
    })
  },
  resetHistory: () => {
    set({
      historyPast: [],
      historyFuture: [],
      historyBatchDepth: 0,
      historyBatchSnapshotTaken: false,
    })
  },
  beginHistoryBatch: () => {
    set((state) => ({
      historyBatchDepth: state.historyBatchDepth + 1,
      historyBatchSnapshotTaken:
        state.historyBatchDepth === 0 ? false : state.historyBatchSnapshotTaken,
    }))
  },
  endHistoryBatch: () => {
    set((state) => ({
      historyBatchDepth: Math.max(0, state.historyBatchDepth - 1),
      historyBatchSnapshotTaken:
        state.historyBatchDepth <= 1 ? false : state.historyBatchSnapshotTaken,
    }))
  },
})

const initialState: WorkflowState = {
  workflows: {},
  groups: {},
  pistas: {},
  connections: {},
}

const initialHistory: HistoryState = {
  historyPast: [],
  historyFuture: [],
  historyBatchDepth: 0,
  historyBatchSnapshotTaken: false,
}

export const useWorkflowStore = create<WorkflowStore>()((...a) => ({
  ...initialState,
  ...initialHistory,
  ...createWorkflowSlice(...a),
  ...createGroupSlice(...a),
  ...createPistaSlice(...a),
  ...createConnectionSlice(...a),
  ...createHistorySlice(...a),
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
