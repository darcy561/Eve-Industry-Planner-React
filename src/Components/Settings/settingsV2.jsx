import { useState } from "react";
import { Header } from "../Header";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Paper, Tab } from "@mui/material";
import { Footer } from "../Footer/Footer";

function SettingsPageV2({ colorMode }) {
  const [selectedTab, changeSelectedTab] = useState("0");

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
            display: "flex",
            flexDirection: "row",
            padding: 2,
            marginTop: 10,
            marginBottom: 2,
          }}
        >
          <TabContext value={selectedTab}>
            <Box sx={{ height: "100vh", width: "100vw", display: "flex" }}>
              <Box sx={{ height: "100%", width: "15%" }}>
                <TabList
                  value={selectedTab}
                  onChange={updateTab}
                  fullWidth
                  orientation="vertical"
                  allowScrollButtonsMobile
                  centered
                >
                  <Tab label={"Layout Settings"} wrapped value={"0"} />
                  <Tab label={"Job Settings"} wrapped value={"1"} />
                  <Tab label={"Custom Structures"} wrapped value={"2"} />
                </TabList>
              </Box>
              <Box sx={{ width: "85%", padding: 2 }}>
                <TabPanel value={"0"}>0</TabPanel>
                <TabPanel value={"1"}>1</TabPanel>
                <TabPanel value={"2"}>2</TabPanel>
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
