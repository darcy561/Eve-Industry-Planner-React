import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useCloseActiveJob } from "../../Hooks/JobHooks/useCloseActiveJob";
import { useLocation, useNavigate } from "react-router-dom";

export function SaveJobIcon({
  activeJob,
  jobModified,
  temporaryChildJobs,
  esiDataToLink,
  parentChildToEdit,
}) {
  const { closeActiveJob } = useCloseActiveJob();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  async function onClick() {
    await closeActiveJob(
      activeJob,
      jobModified,
      temporaryChildJobs,
      esiDataToLink,
      parentChildToEdit
    );
    const groupIDFromParams = queryParams.get("activeGroup");
    const returnURL = groupIDFromParams
      ? `/group/${groupIDFromParams}`
      : "/jobplanner";
    navigate(returnURL);
  }
  return (
    <Tooltip
      title="Saves all changes and returns to the job planner page."
      arrow
      placement="bottom"
    >
      <IconButton color="primary" size="medium" onClick={onClick}>
        <SaveIcon />
      </IconButton>
    </Tooltip>
  );
}
