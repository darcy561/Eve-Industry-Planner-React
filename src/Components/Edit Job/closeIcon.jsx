import { IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";

export function CloseJobIcon({ backupJob }) {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  function onClick() {
    const newJobArray = [
      ...jobArray.filter((i) => i.jobID !== backupJob.jobID),
      backupJob,
    ];
    const groupIDFromParams = queryParams.get("activeGroup");
    const returnURL = groupIDFromParams
      ? `/group/${groupIDFromParams}`
      : "/jobplanner";
    updateJobArray(newJobArray);
    updateActiveJob(null);
    navigate(returnURL);
  }

  return (
    <Tooltip
      title="Returns to the job planner without saving changes to the job."
      arrow
      placement="bottom"
    >
      <IconButton color="primary" size="medium" onClick={onClick}>
        <CloseIcon />
      </IconButton>
    </Tooltip>
  );
}
