import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useCloseActiveJob } from "../../Hooks/JobHooks/useCloseActiveJob";
import { useNavigate } from "react-router-dom";

export function SaveJobIcon({ activeJob, jobModified }) {
  const { closeActiveJob } = useCloseActiveJob();
  const navigate = useNavigate();
  return (
    <Tooltip
      title="Saves all changes and returns to the job planner page."
      arrow
      placement="bottom"
    >
      <IconButton
        color="primary"
        size="medium"
        onClick={async () => {
          await closeActiveJob(activeJob, jobModified);
          navigate("/jobplanner");
        }}
      >
        <SaveIcon />
      </IconButton>
    </Tooltip>
  );
}
