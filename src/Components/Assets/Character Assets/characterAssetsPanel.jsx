import { useContext, useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { AssetSafetyPage_Character } from "./Standard Layout/assetSafetyPage";
import { DeliveriesPage_Character } from "./Standard Layout/deliveriesPage";
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
          <TabPanel key={uuid()} value="Assets">
            <AssetsPage_Character selectedCharacter={selectedCharacter} />
          </TabPanel>
          <TabPanel key={uuid()} value="Deliveries">
            <DeliveriesPage_Character selectedCharacter={selectedCharacter} />
          </TabPanel>
          <TabPanel key={uuid()} value="Asset Safety">
            <AssetSafetyPage_Character selectedCharacter={selectedCharacter} />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  );
}
