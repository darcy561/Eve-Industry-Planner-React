import { IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";

export function CloseJobIcon({ backupJob }) {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const navigate = useNavigate();

  return (
    <Tooltip
      title="Returns to the job planner without saving changes to the job."
      arrow
      placement="bottom"
    >
      <IconButton
        color="primary"
        size="medium"
        onClick={async () => {
          const newJobArray = jobArray.filter(
            (i) => i.jobID !== backupJob.jobID
          );
          newJobArray.push(backupJob);
          updateJobArray(newJobArray);
          updateActiveJob(null);
          navigate("/jobplanner");
        }}
      >
        <CloseIcon />
      </IconButton>
    </Tooltip>
  );
}
