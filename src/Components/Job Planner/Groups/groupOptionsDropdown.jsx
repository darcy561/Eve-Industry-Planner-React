import { useContext, useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useArchiveGroupJobs } from "../../../Hooks/GroupHooks/useArchiveGroupJobs";
import { JobPlannerPageTriggerContext } from "../../../Context/LayoutContext";
import { useBuildChildJobs } from "../../../Hooks/GroupHooks/useBuildChildJobs";
import { ActiveJobContext } from "../../../Context/JobContext";

export function GroupOptionsDropDown({
  groupJobs,
  updateImportFitDialogueTrigger,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { archiveGroupJobs } = useArchiveGroupJobs();
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { buildChildJobs } = useBuildChildJobs();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        id="moreGroupOptionsButton"
        onClick={handleMenuClick}
        aria-controls={Boolean(anchorEl) ? "moreGroupOptionsMenu" : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) ? "true" : undefined}
      >
        <MoreVertIcon color="primary" />
      </IconButton>

      <Menu
        id="moreGroupOptionsMenu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "moreGroupOptionsButton",
        }}
      >
        <MenuItem
          onClick={() => {
            updateImportFitDialogueTrigger((prev) => !prev);
            handleMenuClose();
          }}
        >
          Import Fit From Clipboard
        </MenuItem>
        <MenuItem
          onClick={() => {
            archiveGroupJobs(groupJobs);
            updateEditGroupTrigger((prev) => !prev);
          }}
        >
          Archive Group Jobs
        </MenuItem>
      </Menu>
    </>
  );
}
