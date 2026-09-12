import {
  createFileRoute,
  lazyRouteComponent,
  notFound,
} from "@tanstack/react-router";
import { parseGroupPageViewSearchParam } from "../../Functions/Groups/groupPageViewSearch";
import { ensureGroupJobs } from "../../Functions/Groups/ensureGroupJobs";

const GroupFrame = lazyRouteComponent(
  () => import("../../Components/Groups/groupFrame"),
);

export const Route = createFileRoute("/group/$groupID")({
  staticData: { audience: "public" },
  validateSearch: (raw) => ({
    pageView: parseGroupPageViewSearchParam(raw.pageView),
    focusJobId:
      typeof raw.focusJobId === "string" && raw.focusJobId.trim() !== ""
        ? raw.focusJobId.trim()
        : undefined,
  }),
  loader: async ({ params }) => {
    if (!(await ensureGroupJobs(params.groupID))) throw notFound();
  },
  component: GroupFrame,
});
