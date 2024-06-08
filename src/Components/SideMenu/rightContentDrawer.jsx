import {
  Box,
  Divider,
  Drawer,
  Grid,
  Paper,
  Slide,
  Toolbar,
} from "@mui/material";
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

  const drawerWitdh = expandRightContentMenu ? "25%" : 0;

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      open={expandRightContentMenu}
      sx={{
        display: "flex",
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
          {DrawerContent}
        </Box>
        <Divider />
      </Box>
    </Drawer>
  );
}

export default CollapseableContentDrawer_Right;
