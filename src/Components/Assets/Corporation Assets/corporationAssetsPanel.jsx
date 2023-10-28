import { useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Tab, Tabs, useMediaQuery } from "@mui/material";
import { OfficesPage_Corporation } from "./Standard Layout/officesPage";
import { AssetsPage_Corporation } from "./Standard Layout/assetsPage";
import { DeliveriesPage_Corporation } from "./Standard Layout/deliveriesPage";
import { AssetSafetyPage_Corporation } from "./Standard Layout/assetSafetyPage";
import uuid from "react-uuid";

export function CorporationAssetsPanel({parentUser}) {
  const [tabSelect, updateTabSelect] = useState("Assets");

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  function onTabChange(event, newValue) {
    updateTabSelect(newValue);
  }

  return (
    <TabContext value={tabSelect}>
      <Tabs
        value={tabSelect}
        onChange={onTabChange}
        variant={deviceNotMobile ? "standard" : "scrollable"}
      >
        <Tab key={uuid()} label="Assets" value="Assets" />;
        <Tab key={uuid()} label="Offices" value="Offices" />
        <Tab key={uuid()} label="Deliveries" value="Deliveries" />;
        <Tab key={uuid()} label="Asset Safety" value="Asset Safety" />;
      </Tabs>
      <TabPanel key={uuid()} value="Assets">
        <AssetsPage_Corporation />
      </TabPanel>
      <TabPanel key={uuid()} value="Offices">
        <OfficesPage_Corporation />
      </TabPanel>
      <TabPanel key={uuid()} value="Deliveries">
        <DeliveriesPage_Corporation />
      </TabPanel>
      <TabPanel key={uuid()} value="Asset Safety">
        <AssetSafetyPage_Corporation />
      </TabPanel>
    </TabContext>
  );
}
