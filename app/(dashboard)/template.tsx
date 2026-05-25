import { RouteTransition } from '@/components/layout/motion-primitives'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>
}
