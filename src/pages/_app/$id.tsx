import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/$id')({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [{ title: `CIW | Workflow ${params.id}` }],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-6 md:p-10">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow Selecionado</p>
      <h1 className="text-3xl font-semibold text-slate-100">{id}</h1>
      <p className="text-sm text-slate-300">
        Quadro visual de investigacao criminal.
      </p>
    </section>
  )
}
