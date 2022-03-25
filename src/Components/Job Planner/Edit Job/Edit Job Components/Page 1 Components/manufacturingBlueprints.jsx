import { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { Avatar, Badge, Grid, Paper, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  inUse: {
    backgroundColor: theme.palette.type === "dark" ? "#ffd180" : "#ffe0b2",
    color: "black",
  },
  expiring: {
    backgroundColor: theme.palette.type === "dark" ? "#ef5350" : "#ff8a80",
    color: "black",
  },
}));

export function ManufacturingBlueprints() {
  const { activeJob } = useContext(ActiveJobContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  const classes = useStyles();

  let blueprintOptions = [];
  let esiJobSelection = apiJobs.filter(
    (i) => i.blueprint_type_id === activeJob.blueprintTypeID
  );
  users.forEach((user) => {
    let temp = user.apiBlueprints.filter(
      (i) => i.type_id === activeJob.blueprintTypeID
    );
    temp.forEach((i) => {
      i.owner_id = user.CharacterID;
      blueprintOptions.push(i);
    });
  });
  blueprintOptions.sort(
    (a, b) =>
      b.material_efficiency - a.material_efficiency ||
      b.time_efficiency - a.time_efficiency
  );

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" align="center" color="primary">
            Blueprint Library
          </Typography>
        </Grid>
        {blueprintOptions.length > 0 ? (
          <Grid
            container
            item
            xs={12}

            alignItems="center"
            sx={{
              maxHeight: { xs: "370px", sm: "220px", md: "370px" },
              overflowY: "auto",
            }}
          >
            {blueprintOptions.map((print) => {
              let esiJob = esiJobSelection.find(
                (i) => i.blueprint_id === print.item_id && i.status === "active"
              );
              if (print.quantity === -2) {
                return (
                  <Grid
                    key={print.item_id}
                    container
                    item
                    xs={12}
                    sm={4}
                    md={12}
                    xl={6}
                    sx={{
                      marginBottom: "5px",
                    }}
                  >
                    <Grid item  xs={3} sm={4} xl={5} align="center" sx={{ paddingTop: "5px" }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        badgeContent={
                          <Avatar
                            src={`https://images.evetech.net/characters/${print.owner_id}/portrait`}
                            variant="circular"
                            sx={{
                              height: "18px",
                              width: "18px",
                            }}
                          />
                        }
                      >
                        <picture>
                          <source
                            media="(max-width:700px)"
                            srcSet={`https://images.evetech.net/types/${print.type_id}/bpc?size=32`}
                          />
                          <img
                            src={`https://images.evetech.net/types/${print.type_id}/bpc?size=64`}
                            alt=""
                          />
                        </picture>
                      </Badge>
                    </Grid>
                    <Grid
                      container
                      item
                      xs={9}
                      sm={8}
                      xl={7}
                      sx={{
                        paddingLeft: {
                          xs: "0px",
                          sm: "5px",
                          md: "5px",
                          lg: "0px",
                          xl: "5px",
                        },
                      }}
                    >
                      <Grid item xs={6}>
                        <Typography variant="caption">
                          ME: {print.material_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">
                          TE: {print.time_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption">
                          Runs:{" "}
                          {print.runs.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      className={
                        esiJob
                          ? classes.inUse
                          : esiJob &&
                            print.quantity === -2 &&
                            print.runs >= esiJob.runs
                          ? classes.expiring
                          : "none"
                      }
                      sx={{ height: "3px" }}
                    />
                  </Grid>
                );
              } else {
                return (
                  <Grid
                    key={print.item_id}
                    container
                    item
                    xs={12}
                    sm={4}
                    md={12}
                    xl={6}
                    sx={{
                      marginBottom: "5px",
                    }}
                  >
                    <Grid item xs={3} sm={4} xl={5} align="center" sx={{ paddingTop: "5px" }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        badgeContent={
                          <Avatar
                            src={`https://images.evetech.net/characters/${print.owner_id}/portrait`}
                            variant="circular"
                            sx={{
                              height: "18px",
                              width: "18px",
                            }}
                          />
                        }
                      >
                        <picture>
                          <source
                            media="(max-width:700px)"
                            srcSet={`https://images.evetech.net/types/${print.type_id}/bp?size=32`}
                          />
                          <img
                            src={`https://images.evetech.net/types/${print.type_id}/bp?size=64`}
                            alt=""
                          />
                        </picture>
                      </Badge>
                    </Grid>
                    <Grid
                      container
                      item
                      xs={9}
                      sm={8}
                      xl={7}
                      sx={{
                        paddingLeft: {
                          xs: "0px",
                          sm: "5px",
                          md: "5px",
                          lg: "0px",
                          xl: "5px",
                        },
                      }}
                    >
                      <Grid item xs={6}>
                        <Typography variant="caption">
                          ME: {print.material_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">
                          TE: {print.time_efficiency}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      className={esiJob ? classes.inUse : "none"}
                      sx={{ height: "3px" }}
                    />
                  </Grid>
                );
              }
            })}
          </Grid>
        ) : (
          <Grid item xs={12} align="center">
            <Typography>No Blueprints Found</Typography>
          </Grid>
        )}
        <Grid container item xs={12} sx={{ marginTop: "20px" }}>
          <Grid item xs={6} className={classes.inUse}>
            <Typography variant="body2" align="center">
              Blueprint In Use
            </Typography>
          </Grid>
          <Grid item xs={6} className={classes.expiring}>
            <Typography variant="body2" align="center">
              Blueprint Finishing
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
