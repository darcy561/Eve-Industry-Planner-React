import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab } from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { AvailableMarketOrders } from "../Page 5 Components/availableMarketOrders";
import { LinkedMarketOrders } from "../Page 5 Components/linkedMarketOrders";

export function MarketOrderTabs({
  setJobModified,
  itemOrderMatch,
  updateShowAvailableOrders,
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
      square={true}
    >
      <TabContext value={currentTab}>
        <TabList
          value={currentTab}
          onChange={handleChange}
          variant="fullWidth"
          textColor={"secondary.main"}
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
            updateActiveOrder={updateActiveOrder}
            updateShowAvailableOrders={updateShowAvailableOrders}
          />
        </TabPanel>
        <TabPanel value="1">
          <AvailableMarketOrders
            setJobModified={setJobModified}
            itemOrderMatch={itemOrderMatch}
            updateShowAvailableOrders={updateShowAvailableOrders}
          />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
