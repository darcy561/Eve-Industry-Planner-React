import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export function SaveJobIcon({ jobModified }) {
  return (
    <Tooltip
      title="Saves all changes and returns to the job planner page."
      arrow
      placement="bottom"
    >
      <IconButton color="primary" size="medium" onClick={async () => {}}>
        <SaveIcon />
      </IconButton>
    </Tooltip>
  );
}
