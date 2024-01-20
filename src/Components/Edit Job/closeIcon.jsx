import { IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

export function CloseJobIcon() {
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
          navigate("/jobplanner");
        }}
      >
        <CloseIcon />
      </IconButton>
    </Tooltip>
  );
}
