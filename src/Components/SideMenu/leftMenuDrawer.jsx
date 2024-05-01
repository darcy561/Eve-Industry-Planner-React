import { useState } from "react";
import { Box, Divider, Drawer, IconButton, Toolbar } from "@mui/material";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";

function CollapseableMenuDrawer({
  DrawerContents,
  expandRightContentMenu,
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID
}) {
  const localStorageItemKey = "sideMenuExpanded";
  const [expandedDrawer, setExpandedDrawer] = useState(() => {
    const state = localStorage.getItem(localStorageItemKey);
    if (state == null) return true;
    return state === "true";
  });
  const drawerWitdh = expandedDrawer ? 240 : 50;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open={expandedDrawer}
      sx={{
        width: drawerWitdh,
        flexShrink: 0,
        transition: "width 0.3s ease-in-out",
        [`& .MuiDrawer-paper`]: {
          width: drawerWitdh,
          boxSizing: "border-box",
          transition: "width 0.3s ease-in-out",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          <DrawerContents
            expandedState={expandedDrawer}
            expandRightContentMenu={expandRightContentMenu}
            updateExpandRightContentMenu={updateExpandRightContentMenu}
            rightContentMenuContentID={rightContentMenuContentID}
            updateRightContentMenuContentID={updateRightContentMenuContentID}
          />
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            padding: 2,
          }}
        >
          <IconButton
            onClick={() => {
              localStorage.setItem(localStorageItemKey, !expandedDrawer);
              setExpandedDrawer((prev) => !prev);
            }}
          >
            {expandedDrawer ? (
              <KeyboardDoubleArrowLeftOutlinedIcon />
            ) : (
              <KeyboardDoubleArrowRightOutlinedIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}

export default CollapseableMenuDrawer;
