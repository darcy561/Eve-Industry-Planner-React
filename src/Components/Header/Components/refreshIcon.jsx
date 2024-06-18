import { useContext, useEffect, useState } from "react";
import { Tooltip, IconButton } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import {
  RefreshStateContext,
  UserLoginUIContext,
} from "../../../Context/LayoutContext";
import { useRefreshApiData } from "../../../Hooks/GeneralHooks/useRefreshApiData";

export function RefreshApiIcon() {
  const { refreshState } = useContext(RefreshStateContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const [refreshTrigger, updateRefreshTrigger] = useState(false);
  const { refreshApiData } = useRefreshApiData();

  useEffect(() => {
    if (refreshTrigger) {
      refreshApiData(updateRefreshTrigger);
    }
  }, [refreshTrigger]);

  if (!loginInProgressComplete) {
    return null;
  }

  if (refreshState === 1) {
    return (
      <Tooltip title="Refresh API Data" arrow>
        <IconButton
          color="inherit"
          onClick={() => {
            updateRefreshTrigger((prev) => !prev);
          }}
          sx={{ marginRight: "5px" }}
        >
          <AutorenewIcon />
        </IconButton>
      </Tooltip>
    );
  }
  if (refreshState === 2) {
    return (
      <Tooltip title="Refreshing API Data" arrow>
        <IconButton disableRipple color="inherit" sx={{ marginRight: "5px" }}>
          <SyncAltIcon />
        </IconButton>
      </Tooltip>
    );
  }

  if (refreshState === 3) {
    return (
      <Tooltip title="Next refresh available in 15 mins" arrow>
        <IconButton disableRipple color="inherit" sx={{ marginRight: "5px" }}>
          <TimerIcon />
        </IconButton>
      </Tooltip>
    );
  }
}
