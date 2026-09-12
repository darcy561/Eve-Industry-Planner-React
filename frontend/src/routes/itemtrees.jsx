import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const ItemTree = lazyRouteComponent(
  () => import("../Components/item Tree/ItemTree"),
);

export const Route = createFileRoute("/itemtrees")({
  staticData: { audience: "public" },
  component: ItemTree,
});
