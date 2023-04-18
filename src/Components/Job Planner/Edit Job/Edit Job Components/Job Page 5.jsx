import { useState } from "react";
import { Container, Grid } from "@mui/material";

import { SalesStats } from "./Page 5 Components/salesStats";
import { AvailableTransactionData } from "./Page 5 Components/availableTransactions";
import { LinkedTransactions } from "./Page 5 Components/linkedTransactions";
import { TutorialStep5 } from "./Page 5 Components/tutorialStep5";
import { MarketOrderTabs } from "./Page 5 Components/marketOrderTabs";
import { MarketCostsPanel } from "./Page 5 Components/marketCostsPanel";

export function EditPage5({ setJobModified }) {
  const [showAvailableOrders, updateShowAvailableOrders] = useState(false);
  const [activeOrder, updateActiveOrder] = useState([]);

  return (
    <Container disableGutters maxWidth="false">
      <Grid container spacing={2}>
        <TutorialStep5 />

        <Grid item xs={12}>
          <MarketCostsPanel />
        </Grid>
        <Grid item xs={12} md={8}>
          <MarketOrderTabs
            setJobModified={setJobModified}
            updateShowAvailableOrders={updateShowAvailableOrders}
            activeOrder={activeOrder}
            updateActiveOrder={updateActiveOrder}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SalesStats />
        </Grid>
        <Grid item xs={12}>
          <AvailableTransactionData
            setJobModified={setJobModified}
            activeOrder={activeOrder}
          />
        </Grid>
        <Grid item xs={12}>
          <LinkedTransactions
            setJobModified={setJobModified}
            activeOrder={activeOrder}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
