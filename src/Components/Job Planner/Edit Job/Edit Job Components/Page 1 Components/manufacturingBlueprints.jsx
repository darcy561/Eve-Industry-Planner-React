import { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { Avatar, Badge, Grid, Paper, Tooltip, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useBlueprintCalc } from "../../../../../Hooks/useBlueprintCalc";

const useStyles = makeStyles((theme) => ({
  inUse: {
    backgroundColor: "#ffc107",
    color: "black",
  },
  expiring: {
    backgroundColor: "#d32f2f",
    color: "black",
  },
}));

export function ManufacturingBlueprints({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
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
          <>
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
                  (i) =>
                    i.blueprint_id === print.item_id && i.status === "active"
                );
                if (print.quantity === -2) {
                  return (
                    <Tooltip
                      key={print.item_id}
                      title="Click To Use Blueprint"
                      arrow
                      placement="top"
                    >
                      <Grid
                        onClick={() => {
                          updateActiveJob((prev) => ({
                            ...prev,
                            bpME: print.material_efficiency,
                            bpTE: print.time_efficiency / 2,
                            build: {
                              ...prev.build,
                              materials: CalculateResources({
                                jobType: prev.jobType,
                                rawMaterials: prev.rawData.materials,
                                outputMaterials: prev.build.materials,
                                runCount: prev.runCount,
                                jobCount: prev.jobCount,
                                bpME: print.material_efficiency,
                                structureType: prev.structureType,
                                rigType: prev.rigType,
                                systemType: prev.systemType,
                              }),
                              time: CalculateTime({
                                jobType: prev.jobType,
                                CharacterHash: prev.build.buildChar,
                                structureTypeDisplay: prev.structureTypeDisplay,
                                runCount: prev.runCount,
                                bpTE: print.time_efficiency / 2,
                                rawTime: prev.rawData.time,
                                skills: prev.skills,
                              }),
                            },
                          }));
                          setJobModified(true);
                        }}
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
                        <Grid
                          item
                          xs={3}
                          sm={4}
                          xl={5}
                          align="center"
                          sx={{ paddingTop: "5px" }}
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "right",
                            }}
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
                            {esiJob ? (
                              <Tooltip
                                title="Runs available after current job completes. (Runs before starting current job)"
                                arrow
                                placement="top"
                              >
                                <Typography variant="caption">
                                  Runs: {print.runs - esiJob.runs} (
                                  {print.runs.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                  )
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption">
                                Runs: {print.runs}
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          className={
                            esiJob && print.runs <= esiJob.runs
                              ? classes.expiring
                              : esiJob
                              ? classes.inUse
                              : "none"
                          }
                          sx={{ height: "3px" }}
                        />
                      </Grid>
                    </Tooltip>
                  );
                } else {
                  return (
                    <Tooltip
                      key={print.item_id}
                      title="Click To Use Blueprint"
                      arrow
                      placement="top"
                    >
                      <Grid
                        onClick={() => {
                          const oldJob = JSON.parse(JSON.stringify(activeJob));
                          updateActiveJob((prev) => ({
                            ...prev,
                            bpME: print.material_efficiency,
                            bpTE: print.time_efficiency / 2,
                            build: {
                              ...prev.build,
                              materials: CalculateResources({
                                jobType: prev.jobType,
                                rawMaterials: prev.rawData.materials,
                                outputMaterials: prev.build.materials,
                                runCount: prev.runCount,
                                jobCount: prev.jobCount,
                                bpME: print.material_efficiency,
                                structureType: prev.structureType,
                                rigType: prev.rigType,
                                systemType: prev.systemType,
                              }),
                              time: CalculateTime({
                                jobType: prev.jobType,
                                CharacterHash: prev.build.buildChar,
                                structureTypeDisplay: prev.structureTypeDisplay,
                                runCount: prev.runCount,
                                bpTE: print.time_efficiency / 2,
                                rawTime: prev.rawData.time,
                                skills: prev.skills,
                              }),
                            },
                          }));
                          setJobModified(true);
                        }}
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
                        <Grid
                          item
                          xs={3}
                          sm={4}
                          xl={5}
                          align="center"
                          sx={{ paddingTop: "5px" }}
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "right",
                            }}
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
                    </Tooltip>
                  );
                }
              })}
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: "20px" }}>
              <Grid item xs={6} className={classes.inUse}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Blueprint In Use
                </Typography>
              </Grid>
              <Grid item xs={6} className={classes.expiring}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Blueprint Finishing
                </Typography>
              </Grid>
            </Grid>
          </>
        ) : (
          <Grid item xs={12} align="center">
            <Typography>No Blueprints Found</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
