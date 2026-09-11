import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { allowPublicAccess } from "../../utils/authGuard";
import { parseGroupPageViewSearchParam } from "../../Functions/Groups/groupPageViewSearch";

const EditJob = lazyRouteComponent(
  () => import("../../Components/Edit Job/editJob"),
);

export const Route = createFileRoute("/editjob/$jobID")({
  beforeLoad: allowPublicAccess,
  validateSearch: (raw) => ({
    activeGroup:
      typeof raw.activeGroup === "string" && raw.activeGroup.length > 0
        ? raw.activeGroup
        : undefined,
    pageView: parseGroupPageViewSearchParam(raw.pageView),
  }),
  component: EditJob,
});
