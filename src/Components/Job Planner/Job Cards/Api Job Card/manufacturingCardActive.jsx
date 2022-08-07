import {
  Avatar,
  Badge,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import searchData from "../../../../RawData/searchIndex.json";

export function IndustryESICardActive({ job }) {
  const { users } = useContext(UsersContext);

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

  const product = searchData.find((i) => i.blueprintID === job.blueprint_type_id);
  const buildChar = users.find((i) => i.CharacterID === job.installer_id);
  const blueprintData = buildChar.apiBlueprints.find(
    (i) => i.item_id === job.blueprint_id
  );
  let blueprintType = "bp";
  if (blueprintData !== undefined) {
    if (blueprintData.quantity === -2) {
      blueprintType = "bpc";
    }
  }

  return (
    <Tooltip title="Job imported from the Eve ESI">
      <Grid key={job.job_id} item xs={16} sm={6} md={4} lg={3}>
        <Paper elevation={3} square={true} sx={{ padding: "10px" }}>
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{
                  minHeight: { xs: "2rem", sm: "3rem", md: "3rem", lg: "4rem" },
                  typography: { xs: "body1", lg: "h6" },
                }}
              >
                {product.name}
              </Typography>
            </Grid>
            <Grid
              container
              item
              xs={12}
              sx={{
                marginLeft: { xs: "10px", md: "0px" },
                marginRight: { xs: "20px", md: "30px" },
              }}
            >
              <Grid
                container
                item
                xs={2}
                sm={3}
                justifyContent="center"
                alignItems="center"
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  badgeContent={
                    <Avatar
                      src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                      variant="circular"
                      sx={{
                        height: { xs: "16px", sm: "24px", md: "32px" },
                        width: { xs: "16px", sm:"24px", md: "32px" },
                      }}
                    />
                  }
                >
                  <picture>
                    <source
                      media="(max-width:700px)"
                      srcSet={`https://images.evetech.net/types/${job.blueprint_type_id}/${blueprintType}?size=32`}
                    />
                    <img
                      src={`https://images.evetech.net/types/${job.blueprint_type_id}/${blueprintType}?size=64`}
                      alt=""
                    />
                  </picture>
                </Badge>
              </Grid>
              <Grid
                container
                item
                xs={10}
                sm={9}
                sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
              >
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography sx={{typography:{xs:"body2", md:"body1"}}}>
                      Runs:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
                      {job.runs}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography sx={{typography:{xs:"body2", md:"body1"}}}>
                      Remaining:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {timeRemaining.days === 0 &&
                    timeRemaining.hours === 0 &&
                    timeRemaining.mins === 0 ? (
                      <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
                        Ready to Deliver
                      </Typography>
                    ) : (
                      <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
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
                backgroundColor: "rgba(204,204,204,0.5)",
                marginTop: "10px",
              }}
            >
              <Typography align="center" variant="body2" color="black">
                <b>ESI Manufacturing Job</b>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Tooltip>
  );
}
