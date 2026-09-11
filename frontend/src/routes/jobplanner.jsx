import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { allowPublicAccess } from "../utils/authGuard";

const JobPlanner = lazyRouteComponent(
  () => import("../Components/Job Planner/JobPlanner"),
);

export const Route = createFileRoute("/jobplanner")({
  beforeLoad: allowPublicAccess,
  component: JobPlanner,
});
