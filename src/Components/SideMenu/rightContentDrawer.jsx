import { Box, Divider, Drawer, Toolbar, useMediaQuery } from "@mui/material";
import { useEffect } from "react";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

function CollapseableContentDrawer_Right({
  DrawerContent,
  expandRightContentMenu,
  updateExpandRightContentMenu,
}) {
  const { checkDisplayTutorials } = useHelperFunction();

  useEffect(() => {
    updateExpandRightContentMenu(checkDisplayTutorials());
  }, []);
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const drawerWidth = expandRightContentMenu
    ? deviceNotMobile
      ? "25%"
      : "90%"
    : 0;

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      open={expandRightContentMenu}
      sx={{
        display: "flex",
        width: drawerWidth,
        flexShrink: 0,
        transition: "width 0.3s ease-in-out",
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          transition: "width 0.3s ease-in-out",
        },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <Box
          sx={{
            width:"100%",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          {DrawerContent}
        </Box>
        <Divider />
      </Box>
    </Drawer>
  );
}

export default CollapseableContentDrawer_Right;
