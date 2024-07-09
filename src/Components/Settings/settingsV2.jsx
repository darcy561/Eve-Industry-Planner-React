import { useState } from "react";
import { Header } from "../Header";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Paper, Tab, useMediaQuery } from "@mui/material";
import { Footer } from "../Footer/Footer";
import LayoutSettingsFrame from "./Standard Layout/layoutSettingsFrame";
import JobSettingsFrame from "./Standard Layout/jobSettingsFrame";
import CustomStructuresFrame from "./Standard Layout/customStructuresFrame";

function SettingsPageV2({ colorMode }) {
  const [selectedTab, changeSelectedTab] = useState("0");

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  function updateTab(event, newValue) {
    changeSelectedTab(newValue);
  }
  return (
    <>
      <Header colorMode={colorMode} />
      <Box sx={{ height: "100%", width: "100%" }}>
        <Paper
          square
          elevation={3}
          sx={{
            height: "100%",
            width: "100%",

            padding: 2,
            marginTop: 10,
            marginBottom: 2,
          }}
        >
          <TabContext value={selectedTab}>
            <Box
              sx={{
                height: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: deviceNotMobile ? "row" : "column",
              }}
            >
              <Box
                sx={{
                  height: deviceNotMobile ? "100%" : "10%",
                  width: deviceNotMobile ? "15%" : "100%",
                }}
              >
                <TabList
                  variant="scrollable"
                  value={selectedTab}
                  onChange={updateTab}
                  fullWidth
                  orientation={deviceNotMobile ? "vertical" : "horizontal"}
                  allowScrollButtonsMobile
                  centered
                >
                  <Tab label={"Layout Settings"} wrapped value={"0"} />
                  <Tab label={"Job Settings"} wrapped value={"1"} />
                  <Tab label={"Custom Structures"} wrapped value={"2"} />
                </TabList>
              </Box>
              <Box sx={{ width: "85%", padding: deviceNotMobile ? 2 : 0 }}>
                <TabPanel value={"0"}>
                  <LayoutSettingsFrame />
                </TabPanel>
                <TabPanel value={"1"}>
                  <JobSettingsFrame />
                </TabPanel>
                <TabPanel value={"2"}>
                  <CustomStructuresFrame />
                </TabPanel>
              </Box>
            </Box>
          </TabContext>
        </Paper>
        <Footer />
      </Box>
    </>
  );
}

export default SettingsPageV2;
