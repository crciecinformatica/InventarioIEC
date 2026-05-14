import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      {/* pt-14 on mobile to offset fixed top bar; 0 on desktop (sidebar is in flow) */}
      <main className="flex-1 overflow-y-auto min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
