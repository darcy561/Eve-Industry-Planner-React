import { Box, Divider, Drawer, Grid, Paper, Slide, Toolbar } from "@mui/material";


function CollapseableContentDrawer_Right({
  DrawerContent,
  expandRightContentMenu,
  updateExpandRightContentMenu,
}) {
  const drawerWitdh = expandRightContentMenu ? "25%" : 0;
  console.log(DrawerContent);

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
          {DrawerContent && <DrawerContent />}
        </Box>
        <Divider />
        {/* <Box
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
        </Box> */}
      </Box>
    </Drawer>
  );
}

export default CollapseableContentDrawer_Right;
