import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const JobPlanner = lazyRouteComponent(
  () => import("../Components/Job Planner/JobPlanner"),
);

export const Route = createFileRoute("/jobplanner")({
  staticData: { audience: "public" },
  component: JobPlanner,
});
