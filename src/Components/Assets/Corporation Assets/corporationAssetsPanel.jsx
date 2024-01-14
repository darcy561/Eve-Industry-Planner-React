import { useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { OfficesPage_Corporation } from "./Standard Layout/officesPage";
import { AssetLocationFlagPage_Corporation } from "./Standard Layout/assetLocationFlagPage";
import uuid from "react-uuid";
import { CorporationSelectDropdown } from "./corporationSelect";

export function CorporationAssetsPanel({ parentUser }) {
  const [tabSelect, updateTabSelect] = useState("Offices");

  const [selectedCorporation, updateSelectedCorporation] = useState(
    parentUser.corporation_id
  );

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  function onTabChange(event, newValue) {
    updateTabSelect(newValue);
  }

  return (
    <Grid container>
      <Grid item xs={12} align={deviceNotMobile ? "right" : "center"}>
        <CorporationSelectDropdown
          selectedCorporation={selectedCorporation}
          updateSelectedCorporation={updateSelectedCorporation}
        />
      </Grid>
      <Grid item xs={12}>
        <TabContext value={tabSelect}>
          <Tabs
            value={tabSelect}
            onChange={onTabChange}
            variant={deviceNotMobile ? "standard" : "scrollable"}
          >
            <Tab key={uuid()} label="Offices" value="Offices" />
            <Tab key={uuid()} label="Deliveries" value="Deliveries" />;
            <Tab key={uuid()} label="Asset Safety" value="Asset Safety" />;
          </Tabs>
          <TabPanel
            key={uuid()}
            value="Offices"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <OfficesPage_Corporation
              selectedCorporation={selectedCorporation}
            />
          </TabPanel>
          <TabPanel
            key={uuid()}
            value="Deliveries"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <AssetLocationFlagPage_Corporation
              selectedCorporation={selectedCorporation}
              assetLocationFlagRequest={"CorpDeliveries"}
            />
          </TabPanel>
          <TabPanel
            key={uuid()}
            value="Asset Safety"
            sx={{ paddingRight: 0, paddingLeft: 0 }}
          >
            <AssetLocationFlagPage_Corporation
              selectedCorporation={selectedCorporation}
              assetLocationFlagRequest={"AssetSafety"}
            />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  );
}
