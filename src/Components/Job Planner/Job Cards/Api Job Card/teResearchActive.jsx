import {
  Avatar,
  Badge,
  Box,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import itemRef from "../../../../RawData/searchIndex.json";

export function TeResearchESICardActive({ job }) {

  function timeRemainingcalc() {
    let now = new Date().getTime();
    let timeLeft = Date.parse(job.end_date) - now;

    let day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hour = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (day < 0) {
      day = 0;
    }
    if (hour < 0) {
      hour = 0;
    }
    if (min < 0) {
      min = 0;
    }

    return { days: day, hours: hour, mins: min };
  }

  const timeRemaining = timeRemainingcalc();

  const itemName = itemRef.find((i) => i.blueprintID === job.blueprint_type_id)

  return (
    <Tooltip title="Job imported from the Eve ESI">
      <Grid key={job.job_id} item xs={16} sm={6} md={4} lg={3}>
        <Paper elevation={3} square={true} sx={{ padding: "10px" }}>
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                align="center"
                sx={{ minHeight: "4rem", marginBottom: "5px" }}
              >
                {itemName.name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={3} align="center">
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  badgeContent={
                    <Avatar
                      src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                      variant="circular"
                      sx={{
                        height: "32px",
                        width: "32px",
                      }}
                    />
                  }
                >
                  <img
                    src={`https://image.eveonline.com/Type/${job.blueprint_type_id}_64.png`}
                    alt=""
                    style={{ margin: "auto", display: "block" }}
                  />
                </Badge>
              </Grid>
              <Grid container item xs={9}>
                <Grid container item xs={12}>
                  <Grid item xs={8}>
                    <Typography variant="body1">Time Efficiency:</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ paddingRight: "20px" }}>
                    <Typography variant="body2" align="right">
                      {job.runs*2}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Remaining:</Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ paddingRight: "20px" }}>
                    {timeRemaining.days === 0 &&
                    timeRemaining.hours === 0 &&
                    timeRemaining.mins === 0 ? (
                      <Typography variant="body2" align="right">
                        Ready to Deliver
                      </Typography>
                    ) : (
                      <Typography variant="body2" align="right">
                        {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                        {timeRemaining.mins}M
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                height: "100%",
                backgroundColor: "rgba(204,204,204,0.5)",
                marginTop: "20px",
              }}
            >
              <Box sx={{ height: "100%" }}>
                <Typography align="center" variant="body2">
                  <b>ESI Research Job</b>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Tooltip>
  );
}
