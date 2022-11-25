import { useContext, useMemo } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  LinkedIDsContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import {
  Avatar,
  Badge,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOutlineLinkOff } from "react-icons/md";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EveIDsContext } from "../../../../../Context/EveDataContext";

export function LinkedJobs({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { linkedJobIDs, updateLinkedJobIDs } = useContext(LinkedIDsContext);
  const analytics = getAnalytics();
  const ParentUserIndex = useMemo(() => {
    return users.findIndex((i) => i.ParentUser);
  }, [users]);

  function timeRemainingcalc(job) {
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

  activeJob.build.costs.linkedJobs.forEach((job) => {
    if (job.status === "active") {
      const latestData = apiJobs.find((i) => i.job_id === job.job_id);
      if (latestData !== undefined) {
        job.status = latestData.status;
        job.completed_date = latestData.completed_date || null;
        job.end_date = latestData.end_date;
      }
    }
  });

  if (activeJob.apiJobs.size !== 0) {
    return (
      <>
        <Grid
          container
          direction="row"
          sx={{
            marginBottom: "10px",
            overflowY: "auto",
            maxHeight: {
              xs: "350px",
              sm: "260px",
              md: "240px",
              lg: "240px",
              xl: "480px",
            },
          }}
        >
          {activeJob.build.costs.linkedJobs.map((job, linkedJobsArrayIndex) => {
            let blueprintType = "bpc";
            const jobOwner = users.find(
              (i) => i.CharacterHash === job.CharacterHash
            );
            if (jobOwner !== undefined) {
              const jobBP = JSON.parse(
                sessionStorage.getItem(`esiBlueprints_${jobOwner.CharacterHash}`)
              ).find(
                (i) => i.item_id === job.blueprint_id
              );
              if (jobBP !== undefined) {
                blueprintType = "bp";
                if (jobBP.quantity === -2) {
                  blueprintType = "bpc";
                }
              }
            }
            const facilityData = eveIDs.find((i) => i.id === job.station_id);

            const timeRemaining = timeRemainingcalc(job);
            return (
              <Grid
                key={job.job_id}
                item
                container
                direction="row"
                xs={6}
                sm={4}
                md={3}
                lg={2}
                sx={{ marginBottom: "5px", marginTop: "5px" }}
              >
                <Grid
                  container
                  item
                  justifyContent="center"
                  alignItems="center"
                  xs={12}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    badgeContent={
                      <Avatar
                        src={
                          jobOwner !== undefined
                            ? `https://images.evetech.net/characters/${jobOwner.CharacterID}/portrait`
                            : ""
                        }
                        variant="circular"
                        sx={{
                          height: { xs: "18px", sm: "26px", md: "36px" },
                          width: { xs: "18px", sm: "26px", md: "36px" },
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
                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="center"
                  >{`${job.runs.toLocaleString()} Runs`}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="center"
                  >
                    {facilityData !== undefined
                      ? facilityData.name
                      : "Location Data Unavailable"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="center"
                  >
                    Install Costs:{" "}
                    {job.cost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="center"
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  {job.status !== "delivered" ? (
                    job.status === "active" &&
                    timeRemaining.days === 0 &&
                    timeRemaining.hours === 0 &&
                    timeRemaining.mins === 0 ? (
                      <Typography variant="body2" align="center">
                        Ready to Deliver
                      </Typography>
                    ) : (
                      <Typography variant="body2" align="center">
                        {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                        {timeRemaining.mins}M
                      </Typography>
                    )
                  ) : null}
                </Grid>
                <Grid item xs={12} align="center">
                  <Tooltip title="Click to unlink from job">
                    <IconButton
                      color="error"
                      size="standard"
                      onClick={() => {
                        let newLinkedJobIDs = new Set(linkedJobIDs);
                        let newActiveJobArray = new Set(activeJob.apiJobs);
                        let newLinkedJobsArray = [
                          ...activeJob.build.costs.linkedJobs,
                        ];
                        let newInstallCosts =
                          activeJob.build.costs.installCosts;
                        if (isNaN(newInstallCosts) || newInstallCosts < 0) {
                          newInstallCosts = 0;
                          newLinkedJobsArray.forEach((linkedJob) => {
                            newInstallCosts += linkedJob.cost;
                          });
                        }
                        newInstallCosts -= job.cost;
                        newActiveJobArray.delete(job.job_id);
                        newLinkedJobsArray.splice(linkedJobsArrayIndex, 1);
                        newLinkedJobIDs.delete(job.job_id);

                        setJobModified(true);
                        updateLinkedJobIDs([...newLinkedJobIDs]);
                        updateActiveJob((prevObj) => ({
                          ...prevObj,
                          apiJobs: newActiveJobArray,
                          build: {
                            ...prevObj.build,
                            costs: {
                              ...prevObj.build.costs,
                              linkedJobs: newLinkedJobsArray,
                              installCosts: newInstallCosts,
                            },
                          },
                        }));
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: "Unlinked",
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        logEvent(analytics, "unlinkESIJob", {
                          UID: users[ParentUserIndex].accountID,
                          isLoggedIn: isLoggedIn,
                        });
                      }}
                    >
                      <MdOutlineLinkOff />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
        {activeJob.apiJobs.size > 1 && (
          <Grid container sx={{ marginTop: { xs: "20px", sm: "20px" } }}>
            <Grid item sm={9} />
            <Grid item align="center" xs={12} sm={3}>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={() => {
                  let newLinkedJobIDs = new Set(linkedJobIDs);
                  let jobsToRemoveQuantity =
                    activeJob.build.costs.linkedJobs.length;

                  for (let job of activeJob.apiJobs) {
                    newLinkedJobIDs.delete(job);
                  }

                  setJobModified(true);
                  updateLinkedJobIDs([...newLinkedJobIDs]);
                  updateActiveJob((prevObj) => ({
                    ...prevObj,
                    apiJobs: new Set(),
                    build: {
                      ...prevObj.build,
                      costs: {
                        ...prevObj.build.costs,
                        linkedJobs: [],
                        installCosts: 0,
                      },
                    },
                  }));
                  setSnackbarData((prev) => ({
                    ...prev,
                    open: true,
                    message: `${jobsToRemoveQuantity} Jobs Unlinked`,
                    severity: "success",
                    autoHideDuration: 1000,
                  }));
                  logEvent(analytics, "unlinkESIJobBulk", {
                    UID: users[ParentUserIndex].accountID,
                    isLoggedIn: isLoggedIn,
                  });
                }}
              >
                Unlink All
              </Button>
            </Grid>
          </Grid>
        )}
      </>
    );
  } else {
    return (
      <Grid
        item
        xs={12}
        align="center"
        sx={{
          marginTop: { xs: "20px", sm: "30px" },
        }}
      >
        <Typography sx={{ typography: { xs: "caption", md: "body1" } }}>
          You currently have no industry jobs from the ESI linked to the this
          job.
        </Typography>
      </Grid>
    );
  }
}
