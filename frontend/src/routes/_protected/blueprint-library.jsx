import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const BlueprintLibrary = lazyRouteComponent(
  () => import("../../Components/Blueprint Library/BlueprintLibrary"),
);

export const Route = createFileRoute("/_protected/blueprint-library")({
  component: BlueprintLibrary,
});
