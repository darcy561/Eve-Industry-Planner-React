import { useState } from "react";
import { Grid } from "@mui/material";
import { TutorialStep5 } from "../tutorialStep5";
import { MarketCostsPanel } from "./Market Costs Panel/marketCostsPanel";
import { MarketOrderPanel } from "./Market Order Panel/marketOrderPanel";
import { SalesStats } from "./Sales Stats Panel/salesStatsPanel";
import { AvailableTransactionsPanel } from "./Available Transactions Panel/availableTransactionsPanel";
import { LinkedTransactionPanel } from "./Linked Transaction Panel/linkedTransactionPanel";
import { Selling_ButtonPanel_EditJob } from "./Button Panel/buttonLayout";

export function Selling_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  setJobModified,
  esiDataToLink,
  updateEsiDataToLink
}) {
  const [showAvailableOrders, updateShowAvailableOrders] = useState(false);
  const [activeOrder, updateActiveOrder] = useState([]);
  
  return (
    <Grid container spacing={2}>
      <TutorialStep5 />
      <Grid item xs={12}>
        <MarketCostsPanel activeJob={activeJob} />
      </Grid>
      <Grid item xs={12} md={8}>
        <MarketOrderPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          updateShowAvailableOrders={updateShowAvailableOrders}
          activeOrder={activeOrder}
          updateActiveOrder={updateActiveOrder}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <SalesStats activeJob={activeJob} />
      </Grid>
      <Grid item xs={12}>
        <AvailableTransactionsPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          activeOrder={activeOrder}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      </Grid>
      <Grid item xs={12}>
        <LinkedTransactionPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          activeOrder={activeOrder}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      </Grid>
      <Grid item xs={12}>
        <Selling_ButtonPanel_EditJob activeJob={activeJob} />
      </Grid>
    </Grid>
  );
}
