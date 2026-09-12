import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Accounts = lazyRouteComponent(
  () => import("../../Components/Accounts/Accounts"),
);

export const Route = createFileRoute("/_protected/accounts")({
  staticData: { audience: "private" },
  component: Accounts,
});
