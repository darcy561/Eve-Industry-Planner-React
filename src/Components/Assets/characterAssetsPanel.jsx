import { useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Tab, Tabs } from "@mui/material";
import { AssetSafetyPage_Character } from "./Character Assets/assetSafetyPage";
import { DeliveriesPage_Character } from "./Character Assets/deliveriesPage";
import { AssetsPage_Character } from "./Character Assets/assetsPage";
import uuid from "react-uuid";

export function CharacterAssetsPanel({}) {
  const [tabSelect, updateTabSelect] = useState("Assets");

  function onTabChange(event, newValue) {
    updateTabSelect(newValue);
  }

  return (
    <TabContext value={tabSelect}>
      <Tabs value={tabSelect} onChange={onTabChange} variant="standard">
        <Tab key={uuid()} label="Assets" value="Assets" />;
        <Tab key={uuid()} label="Deliveries" value="Deliveries" />;
        <Tab key={uuid()} label="Asset Safety" value="Asset Safety" />;
      </Tabs>
      <TabPanel key={uuid()} value="Assets">
        <AssetsPage_Character />
      </TabPanel>
      <TabPanel key={uuid()} value="Deliveries">
        <DeliveriesPage_Character />
      </TabPanel>
      <TabPanel key={uuid()} value="Asset Safety">
        <AssetSafetyPage_Character />
      </TabPanel>
    </TabContext>
  );
}
