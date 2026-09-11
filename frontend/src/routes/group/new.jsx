import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { allowPublicAccess } from "../../utils/authGuard";

const NewGroup = lazyRouteComponent(
  () => import("../../Components/Groups/New Group/newGroupPage"),
);

export const Route = createFileRoute("/group/new")({
  beforeLoad: allowPublicAccess,
  component: NewGroup,
});
