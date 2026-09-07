import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

const AssetLibrary = lazyRouteComponent(() => import('../../Components/Assets/assets'))

export const Route = createFileRoute('/_protected/asset-library')({
  component: AssetLibrary,
})