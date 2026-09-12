import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Settings = lazyRouteComponent(
  () => import("../../Components/Settings/settingsPage"),
);

export const Route = createFileRoute("/_protected/settings")({
  staticData: { audience: "private" },
  component: Settings,
});
