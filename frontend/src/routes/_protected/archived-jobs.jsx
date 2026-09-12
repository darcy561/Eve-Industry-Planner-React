import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const ArchivedJobs = lazyRouteComponent(
  () => import("../../Components/Archived Jobs/ArchivedJobsPage"),
);

export const Route = createFileRoute("/_protected/archived-jobs")({
  staticData: { audience: "private" },
  component: ArchivedJobs,
});
