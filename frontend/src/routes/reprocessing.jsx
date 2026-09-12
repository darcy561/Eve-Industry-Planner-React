import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Reprocessing = lazyRouteComponent(
  () => import("../Components/Reprocessing/reprocessingPage"),
);

export const Route = createFileRoute("/reprocessing")({
  staticData: { audience: "public" },
  component: Reprocessing,
});
