import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { allowPublicAccess } from '../utils/authGuard'

const Reprocessing = lazyRouteComponent(() => import('../Components/Reprocessing/reprocessingPage'))

export const Route = createFileRoute('/reprocessing')({
  beforeLoad: allowPublicAccess,
  component: Reprocessing,
})
