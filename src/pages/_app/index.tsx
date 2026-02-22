import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { selectWorkflowsByCreatedAt, useWorkflowStore } from '../../store/workflowStore'

export const Route = createFileRoute('/_app/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "CIW | Workflow's" }],
  })
})

function RouteComponent() {
  const workflowsSelector = useMemo(() => selectWorkflowsByCreatedAt, [])
  const workflows = useWorkflowStore(useShallow(workflowsSelector))

  const createWorkflow = useWorkflowStore((state) => state.createWorkflow)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')

  const handleOpenCreate = () => {
    setIsCreateOpen(true)
  }

  const handleCloseCreate = () => {
    setIsCreateOpen(false)
    setName('')
  }

  const handleConfirmCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    
    createWorkflow(trimmed)

    setIsCreateOpen(false)
    setName('')
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 p-6 md:p-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow Investigativo</p>
          <h1 className="text-3xl font-semibold text-slate-100">Workflows</h1>
        </div>
        <Button onClick={handleOpenCreate}>Novo workflow</Button>
      </header>

      {workflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          Nenhum workflow criado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => (
            <Link
              key={workflow.id}
              to="/workflow/$id"
              params={{ id: workflow.id }}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-cyan-500/60 hover:bg-slate-900"
            >
              <p className="text-sm font-medium text-slate-100">{workflow.name}</p>
              <p className="mt-2 text-xs text-slate-400">Criado em: {workflow.createdAt}</p>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        title="Novo workflow"
        description="Informe o nome do workflow"
        onClose={handleCloseCreate}
        classNameModal="w-lg max-w-lg"
      >
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
          placeholder="Nome do workflow"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleConfirmCreate()
            if (event.key === 'Escape') handleCloseCreate()
          }}
        />
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={handleCloseCreate}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmCreate}>Criar</Button>
        </div>
      </Modal>
    </section>
  )
}
