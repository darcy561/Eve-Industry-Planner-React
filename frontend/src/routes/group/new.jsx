import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const NewGroup = lazyRouteComponent(
  () => import("../../Components/Groups/New Group/newGroupPage"),
);

export const Route = createFileRoute("/group/new")({
  staticData: { audience: "public" },
  component: NewGroup,
});
