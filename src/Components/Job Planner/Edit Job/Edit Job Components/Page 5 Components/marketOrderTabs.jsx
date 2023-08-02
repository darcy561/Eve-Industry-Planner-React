import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab } from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { AvailableMarketOrders } from "../Page 5 Components/availableMarketOrders";
import { LinkedMarketOrders } from "../Page 5 Components/linkedMarketOrders";
import { useMarketOrderFunctions } from "../../../../../Hooks/GeneralHooks/useMarketOrderFunctions";

export function MarketOrderTabs({
  setJobModified,
  updateShowAvailableOrders,
  activeOrder,
  updateActiveOrder,
}) {
  const { activeJob } = useContext(ActiveJobContext);
  const [currentTab, updateTab] = useState(() => {
    if (activeJob.build.sale.marketOrders.length === 0) {
      return "1";
    } else {
      return "0";
    }
  });

  const { findMarketOrdersForItem } = useMarketOrderFunctions();

  const itemOrderMatch = findMarketOrdersForItem();

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
          <LinkedMarketOrders
            setJobModified={setJobModified}
            activeOrder={activeOrder}
            updateActiveOrder={updateActiveOrder}
            updateShowAvailableOrders={updateShowAvailableOrders}
          />
        </TabPanel>
        <TabPanel value="1">
          <AvailableMarketOrders
            itemOrderMatch={itemOrderMatch}
            setJobModified={setJobModified}
            updateShowAvailableOrders={updateShowAvailableOrders}
          />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
