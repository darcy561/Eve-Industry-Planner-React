import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function TutorialStep2() {
  const { activeJob } = useContext(ActiveJobContext);

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} align="left">
          <Typography variant="body1" color="primary">
            <b>Help:</b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            Now that you know what you are building it is time to acquire the
            necceary parts.{<br />} {<br />}
            For each item item you can choose the "All Remaining" option from
            the quantity dropdown or you can manually add them number of items
            into the field, then add the amount you paid for an each item. Click
            the <b>+</b> to save this entry.
            {<br />}
            {<br />}
            As you add these the total cost will be calcuated for each item and
            will be added to the total cost of all of the items.
            {<br />}
            {<br />}
            You can use the "Hide Completed Purchases" toggle if you only want
            to see the items that you have left to purchase.
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={10} />
          <Grid item xs={2} align="right">
            <Typography variant="caption" sx={{ display: "inline-block" }}>
              Hide Help Options
            </Typography>
            <Checkbox size="small" />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
