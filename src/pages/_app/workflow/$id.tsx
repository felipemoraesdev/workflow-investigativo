import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import Icon from '../../../components/Icon'
import WorkflowCanvas from '../../../features/workflow/WorkflowCanvas'
import { selectWorkflowById, useWorkflowStore } from '../../../store/workflowStore'

export const Route = createFileRoute('/_app/workflow/$id')({
  loader: ({ params }) => {
    const workflow = useWorkflowStore.getState().workflows[params.id]
    if (!workflow) {
      throw redirect({ to: '/' })
    }
    return { workflowName: workflow?.name ?? params.id }
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [{ title: `CIW | Workflow ${loaderData?.workflowName}` }],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { workflowName } = Route.useLoaderData()

  const workflow = useWorkflowStore(selectWorkflowById(id))

  if (!workflow) return

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 w-full px-4 pt-4 md:px-10 md:pt-6">
        <div className="pointer-events-auto inline-flex max-w-[90vw] flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-xs text-slate-300 hover:text-cyan-200"
          >
            <Icon name="back" size={14} />
            Voltar
          </Link>
          <h1 className="text-xl font-semibold text-slate-100 md:text-2xl">{workflowName}</h1>
        </div>
      </div>
      <WorkflowCanvas workflowId={id} />
    </section>
  )
}
