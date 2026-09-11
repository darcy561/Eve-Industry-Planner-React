import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Dashboard = lazyRouteComponent(
  () => import("../../Components/Dashboard/Dashboard"),
);

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
});
