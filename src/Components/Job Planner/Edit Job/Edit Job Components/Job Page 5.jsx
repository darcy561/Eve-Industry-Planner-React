import React, { useContext, useState } from "react";
import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { SalesStats } from "./Page 5 Components/salesStats";
import { AvailableMarketOrders } from "./Page 5 Components/availableMarketOrders";

export function EditPage5({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [showAvailable, updateShowAvailable] = useState(false);

  return (
      <Grid container spacing={2} >
      <Grid container item xs={12} md={6}>
        {activeJob.build.sale.marketOrders > 0 && !showAvailable ? (
          <Typography>abc</Typography>
        ):( <AvailableMarketOrders setJobModified={setJobModified} />)}
          </Grid>

        <Grid container item xs={12} md={6}>
          <SalesStats />
        </Grid>
      </Grid>
  );
}
