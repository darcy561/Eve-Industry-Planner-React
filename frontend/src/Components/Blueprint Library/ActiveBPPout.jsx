import { Paper, Popover, Typography, Grid } from "@mui/material";
import { formatTimeRemaining } from "../../Functions/Helper/numberParser";
import { Figure } from "../../Styled Components/Typography/figures";

export function ActiveBPPopout({
  blueprint,
  esiJob,
  displayPopover,
  updateDisplayPopover,
}) {
  const timeRemaining = formatTimeRemaining(Date.parse(esiJob.end_date));

  return (
    <Popover
      id={blueprint.itemId}
      open={Boolean(displayPopover)}
      anchorEl={displayPopover}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={() => {
        updateDisplayPopover(null);
      }}
    >
      <Paper
        square
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        <Grid container sx={{ flexDirection: "row" }}>
          <Grid sx={{ marginBottom: "10px" }} size={12}>
            <Typography variant="h5" align="center" color="primary">
              {esiJob.activity_id === 1
                ? "Manufacturing Job"
                : esiJob.activity_id === 3
                  ? "Time Efficiency Research"
                  : esiJob.activity_id === 4
                    ? "Material Efficiency Research"
                    : esiJob.activity_id === 9
                      ? "Reaction Job"
                      : null}
            </Typography>
          </Grid>
          <Grid container align="center" size={12}>
            <Grid size={12}>
              <Typography>
                Runs: <Figure formatOptions={{ max: 0 }}>{esiJob.runs}</Figure>
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography>{esiJob.facility_name}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography>
                Install Cost: <Figure>{esiJob.cost}</Figure>
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography>
                Status:{" "}
                {timeRemaining === "complete" ? "Ready to Deliver" : "Active"}
              </Typography>
            </Grid>
            {timeRemaining !== "complete" && (
              <Grid size={12}>
                <Typography>Time Remaining: {timeRemaining}</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Popover>
  );
}
