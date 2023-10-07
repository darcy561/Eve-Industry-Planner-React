import { useState } from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab } from "@mui/material";
import { useMarketOrderFunctions } from "../../../../../../Hooks/GeneralHooks/useMarketOrderFunctions";
import { AvailableMarketOrdersTab } from "./availableOrdersTab";
import { LinkedMarketOrdersTab } from "./linkedMarketOrdersTab";

export function MarketOrderPanel({
  activeJob,
  updateActiveJob,
  setJobModified,
  updateShowAvailableOrders,
  activeOrder,
  updateActiveOrder,
  esiDataToLink,
  updateEsiDataToLink
}) {
  const [currentTab, updateTab] = useState(() => {
    if (activeJob.build.sale.marketOrders.length === 0) {
      return "1";
    } else {
      return "0";
    }
  });

  const { findMarketOrdersForItem } = useMarketOrderFunctions();

  const itemOrderMatch = findMarketOrdersForItem(activeJob, esiDataToLink.marketOrders.add);

  const handleChange = (event, newValue) => {
    updateTab(newValue);
  };
  return (
    <Paper
      sx={{
        padding: "10px",
        width: "100%",
        minHeight: "30vh",
      }}
      elevation={3}
      square
    >
      <TabContext value={currentTab}>
        <TabList
          value={currentTab}
          onChange={handleChange}
          variant="fullWidth"
          textColor="secondary.main"
        >
          <Tab label={`${itemOrderMatch.length} Available Orders`} value="1" />
          <Tab
            label={`${activeJob.build.sale.marketOrders.length} Linked Orders`}
            value="0"
          />
        </TabList>
        <TabPanel value="0">
          <LinkedMarketOrdersTab
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            activeOrder={activeOrder}
            updateActiveOrder={updateActiveOrder}
            updateShowAvailableOrders={updateShowAvailableOrders}
            esiDataToLink={esiDataToLink}
            updateEsiDataToLink={updateEsiDataToLink}
          />
        </TabPanel>
        <TabPanel value="1">
          <AvailableMarketOrdersTab
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            itemOrderMatch={itemOrderMatch}
            updateShowAvailableOrders={updateShowAvailableOrders}
            esiDataToLink={esiDataToLink}
            updateEsiDataToLink={updateEsiDataToLink}
          />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
