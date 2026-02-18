import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "CIW | Workflow's" }],
  })
})

function RouteComponent() {
  const mockWorkflows = [
    { id: '1', name: 'Investigacao Banco Central', createdAt: '2026-02-18' },
    { id: '2', name: 'Caso do Veiculo Vermelho', createdAt: '2026-02-18' },
  ]

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 p-6 md:p-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow Investigativo</p>
          <h1 className="text-3xl font-semibold text-slate-100">Workflows</h1>
        </div>
        <button
          type="button"
          className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-200"
        >
          Novo workflow
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mockWorkflows.map((workflow) => (
          <Link
            key={workflow.id}
            to="/$id"
            params={{ id: workflow.id }}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-cyan-500/60 hover:bg-slate-900"
          >
            <p className="text-sm font-medium text-slate-100">{workflow.name}</p>
            <p className="mt-2 text-xs text-slate-400">Criado em: {workflow.createdAt}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}