import { useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { AssetLocationFlagPage_Character } from "./Standard Layout/assetLocationFlagPage";
import { AssetsPage_Character } from "./Standard Layout/assetsPage";
import uuid from "react-uuid";
import { CharacterSelectDropdown } from "./characterSelect";

export function CharacterAssetsPanel({ parentUser }) {
  const [tabSelect, updateTabSelect] = useState("Assets");
  const [selectedCharacter, updateSelectedCharacter] = useState(
    parentUser.CharacterHash
  );
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  function onTabChange(event, newValue) {
    updateTabSelect(newValue);
  }

  return (
    <Grid container>
      <Grid item xs={12} align={deviceNotMobile ? "right" : "center"}>
        <CharacterSelectDropdown
          selectedCharacter={selectedCharacter}
          updateSelectedCharacter={updateSelectedCharacter}
        />
      </Grid>
      <Grid item xs={12}>
        <TabContext value={tabSelect}>
          <Tabs
            value={tabSelect}
            onChange={onTabChange}
            variant={deviceNotMobile ? "standard" : "scrollable"}
          >
            <Tab key={uuid()} label="Assets" value="Assets" />;
            <Tab key={uuid()} label="Deliveries" value="Deliveries" />;
            <Tab key={uuid()} label="Asset Safety" value="Asset Safety" />;
          </Tabs>
          <TabPanel
            key={uuid()}
            value="Assets"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <AssetsPage_Character selectedCharacter={selectedCharacter} />
          </TabPanel>
          <TabPanel
            key={uuid()}
            value="Deliveries"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <AssetLocationFlagPage_Character
              selectedCharacter={selectedCharacter}
              assetLocationFlagRequest={"Deliveries"}
            />
          </TabPanel>
          <TabPanel
            key={uuid()}
            value="Asset Safety"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <AssetLocationFlagPage_Character
              selectedCharacter={selectedCharacter}
              assetLocationFlagRequest={"AssetSafety"}
            />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  );
}
