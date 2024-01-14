import { Button } from "@mui/material";
import { useCloseActiveJob } from "../../../../../../../Hooks/JobHooks/useCloseActiveJob";
import { useNavigate } from "react-router-dom";

export function OpenChildJobButon_ChildJobPopoverFrame({
  activeJob,
  jobModified,
  temporaryChildJobs,
  esiDataToLink,
  parentChildToEdit,
  childJobObjects,
  jobDisplay,
}) {
  const { closeActiveJob } = useCloseActiveJob();
  const navigate = useNavigate();

  return (
    <Button
      size="small"
      onClick={async () => {
        await closeActiveJob(
          activeJob,
          jobModified,
          temporaryChildJobs,
          esiDataToLink,
          parentChildToEdit
        );
        navigate(`/editjob/${childJobObjects[jobDisplay].jobID}`);
      }}
    >
      Open Child Job
    </Button>
  );
}
