import { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";

function CollapseableMenuDrawer({
  DrawerContents,
  expandRightContentMenu,
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID,
}) {
  const localStorageItemKey = "sideMenuExpanded";
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const [expandedDrawer, setExpandedDrawer] = useState(
    getInitialExpandedDrawerState(deviceNotMobile)
  );

  useEffect(() => {
    try {
      localStorage.setItem(localStorageItemKey, expandedDrawer.toString());
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  }, [expandedDrawer]);

  function getInitialExpandedDrawerState(mobileDevice) {
    try {
      const state = localStorage.getItem(localStorageItemKey);
      if (!mobileDevice) return false;
      if (state == null) return true;
      return state === "true";
    } catch (error) {
      console.error("Error accessing localStorage", error);
      return deviceNotMobile;
    }
  }

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
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <List sx={{ width: "100%" }}>
            <ListItem
              disablePadding
              onClick={() => {
                localStorage.setItem(localStorageItemKey, !expandedDrawer);
                setExpandedDrawer((prev) => !prev);
              }}
              sx={{
                display: "block",
                "&:hover": {
                  "& .MuiListItemIcon-root, & .MuiListItemText-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: "center",
                  paddingRight: 2.5,
                  paddingLeft: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                  }}
                >
                  {expandedDrawer ? (
                    <KeyboardDoubleArrowLeftOutlinedIcon />
                  ) : (
                    <KeyboardDoubleArrowRightOutlinedIcon />
                  )}
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}

export default CollapseableMenuDrawer;
