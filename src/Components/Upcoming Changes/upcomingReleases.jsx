import { Grid } from "@mui/material";
import { useState } from "react";
import { ManufacturingOptionsUpcomingChanges } from "./manufacturingOptions";
import { UpcomingChangesSearch } from "./searchBar";
import { SisiItem } from "./sisiItem";
import { TranqItem } from "./tranqItem";

export default function UpcomingChanges() {
  const [pageLoad, updatePageLoad] = useState(false);
  const [tranqItem, updateTranqItem] = useState(null);
  const [sisiItem, updateSisiItem] = useState(null);
  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <Grid item xs={12}>
        <UpcomingChangesSearch
          updateTranqItem={updateTranqItem}
          updateSisiItem={updateSisiItem}
          updatePageLoad={updatePageLoad}
        />
      </Grid>
      <Grid item xs={12}>
        <ManufacturingOptionsUpcomingChanges
          tranqItem={tranqItem}
          updateTranqItem={updateTranqItem}
          sisiItem={sisiItem}
          updateSisiItem={updateSisiItem}
          pageLoad={pageLoad}
        />
      </Grid>
      <Grid container item xs={12} spacing={2}>
        <Grid item xs={12} md={6}>
          <TranqItem tranqItem={tranqItem} pageLoad={pageLoad} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SisiItem sisiItem={sisiItem} pageLoad={pageLoad} />
        </Grid>
      </Grid>
    </Grid>
  );
}
