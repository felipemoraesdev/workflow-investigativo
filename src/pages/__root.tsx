import { HeadContent, Navigate, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <Navigate to="/" />,
  head: () => ({
    meta: [{ title: 'CIW' }],
    links: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  }),
})

function RootComponent() {
  return (
    <>
      <HeadContent />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <Outlet />
      </main>
    </>
  )
}
