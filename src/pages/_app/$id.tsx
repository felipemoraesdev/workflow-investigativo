import { createFileRoute, Link } from '@tanstack/react-router'
import Icon from '../../components/Icon'
import WorkflowCanvas from '../../features/workflow/WorkflowCanvas'

export const Route = createFileRoute('/_app/$id')({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [{ title: `CIW | Workflow ${params.id}` }],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 w-full px-4 pt-4 md:px-10 md:pt-6">
        <div className="pointer-events-auto inline-flex max-w-[90vw] flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-xs text-slate-300 hover:text-cyan-200"
          >
            <Icon name="back" size={14} />
            Voltar
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow Selecionado</p>
          <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">{id}</h1>
          <p className="text-sm text-slate-300">
            Quadro visual de investigacao criminal.
          </p>
        </div>
      </div>
      <WorkflowCanvas workflowId={id} />
    </section>
  )
}
