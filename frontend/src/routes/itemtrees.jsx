import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { allowPublicAccess } from "../utils/authGuard";

const ItemTree = lazyRouteComponent(
  () => import("../Components/item Tree/ItemTree"),
);

export const Route = createFileRoute("/itemtrees")({
  beforeLoad: allowPublicAccess,
  component: ItemTree,
});
