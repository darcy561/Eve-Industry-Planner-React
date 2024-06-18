import { Avatar, Tooltip } from "@mui/material";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import { useContext } from "react";
import { IsLoggedInContext } from "../../../../../../Context/AuthContext";

export function AssetsAvatar_Purchasing({ updateItemAssetsDialogTrigger }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);

  if (!isLoggedIn) return null;

  return (
    <Tooltip title="View Assets" arrow placement="top">
      <Avatar
        variant="circle"
        sx={{
          color: "white",
          bgcolor: "primary.main",
          height: "30px",
          width: "30px",
          position: "absolute",
          top: "5px",
          right: "5px",
          cursor: "pointer",
          boxShadow: 4,
        }}
        onClick={() => {
          updateItemAssetsDialogTrigger((prev) => !prev);
        }}
      >
        A
      </Avatar>
    </Tooltip>
  );
}
