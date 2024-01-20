import { useMediaQuery } from "@mui/material";
import { Planning_StandardLayout_EditJob } from "./Standard Layout/standardLayout";
import { Planning_MobileLayout_EditJob } from "./Mobile Layout/mobileLayout";

export function LayoutSelector_EditJob_Planning({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  esiDataToLink,
  parentChildToEdit,
  updateParentChildToEdit
}) {
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  switch (deviceNotMobile) {
    case true:
      return (
        <Planning_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
          esiDataToLink={esiDataToLink}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
      );
    case false:
      return (
        <Planning_MobileLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
          esiDataToLink={esiDataToLink}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
      );
    default:
      return (
        <Planning_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
          esiDataToLink={esiDataToLink}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
      );
  }
}
