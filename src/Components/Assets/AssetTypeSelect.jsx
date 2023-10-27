import { useState } from "react";
import { Paper, Tab, Tabs } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { CharacterAssetsPanel } from "./characterAssetsPanel";
import { CorporationAssetsPanel } from "./corporationAssetsPanel";

export function AssetTypeSelectPanel({}) {
  const [tabSelect, updateTabSelect] = useState(0);

  function onTabChange(event, newValue) {
    updateTabSelect(newValue);
  }

  return (
    <Paper
      square
      elevation={2}
      sx={{
        padding: "20px",
      }}
    >
      <TabContext value={tabSelect}>
        <Tabs value={tabSelect} onChange={onTabChange} variant="fullWidth">
          <Tab label="Character Assets" value={0} />
          <Tab label="Corporation Assets" value={1} />
        </Tabs>

        <TabPanel value={0}>
          <CharacterAssetsPanel />
        </TabPanel>
        <TabPanel value={1}>
          <CorporationAssetsPanel />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
