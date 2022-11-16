import React, { useContext, useMemo } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
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
import { MdOutlineAddLink } from "react-icons/md";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EveIDsContext } from "../../../../../Context/EveDataContext";

export function AvailableJobs({ jobMatches, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { linkedJobIDs, updateLinkedJobIDs } = useContext(LinkedIDsContext);
  const analytics = getAnalytics();
  const ParentUserIndex = useMemo(() => {
    return users.findIndex((i) => i.ParentUser);
  }, [users]);

  class ESIJob {
    constructor(originalJob, owner) {
      this.status = originalJob.status;
      this.CharacterHash = owner.CharacterHash;
      this.runs = originalJob.runs;
      this.job_id = originalJob.job_id;
      this.completed_date = originalJob.completed_date || null;
      this.station_id = originalJob.station_id;
      this.start_date = originalJob.start_date;
      this.end_date = originalJob.end_date;
      this.cost = originalJob.cost;
      this.blueprint_type_id = originalJob.blueprint_type_id;
      this.product_type_id = originalJob.product_type_id;
      this.activity_id = originalJob.activity_id;
      this.duration = originalJob.duration;
      this.blueprint_id = originalJob.blueprint_id;
    }
  }

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

  if (jobMatches.length !== 0 && activeJob.apiJobs.size < activeJob.jobCount) {
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
          {jobMatches.map((job) => {
            const jobOwner = users.find(
              (i) => i.CharacterID === job.installer_id
            );
            const jobBP = jobOwner.apiBlueprints.find(
              (i) => i.item_id === job.blueprint_id
            );

            const facilityData = eveIDs.find((i) => i.id === job.facility_id);

            let blueprintType = "bpc";
            if (jobBP !== undefined) {
              blueprintType = "bp";
              if (jobBP.quantity === -2) {
                blueprintType = "bpc";
              }
            }

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
                        src={`https://images.evetech.net/characters/${jobOwner.CharacterID}/portrait`}
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
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  {job.status !== "delivered" ? (
                    job.status === "active" &&
                    timeRemaining.days === 0 &&
                    timeRemaining.hours === 0 &&
                    timeRemaining.mins === 0 ? (
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                        align="center"
                      >
                        Ready to Deliver
                      </Typography>
                    ) : (
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                        align="center"
                      >
                        {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                        {timeRemaining.mins}M
                      </Typography>
                    )
                  ) : null}
                </Grid>
                <Grid item xs={12} align="center">
                  <Tooltip title="Click to link to job">
                    <IconButton
                      color="primary"
                      size="standard"
                      onClick={() => {
                        let newInstallCosts =
                          activeJob.build.costs.installCosts;
                        let newLinkedJobIDs = new Set(linkedJobIDs);
                        let newActiveJobSet = new Set(activeJob.apiJobs);
                        let newLinkedJobsArray = [
                          ...activeJob.build.costs.linkedJobs,
                        ];

                        if (isNaN(newInstallCosts) || newInstallCosts < 0) {
                          newInstallCosts = 0;
                          newLinkedJobsArray.forEach((linkedJob) => {
                            newInstallCosts += linkedJob.cost;
                          });
                        }

                        newLinkedJobsArray.push(
                          Object.assign({}, new ESIJob(job, jobOwner))
                        );

                        newActiveJobSet.add(job.job_id);
                        newLinkedJobIDs.add(job.job_id);
                        newInstallCosts += job.cost;

                        updateLinkedJobIDs([...newLinkedJobIDs]);
                        updateActiveJob((prevObj) => ({
                          ...prevObj,
                          apiJobs: newActiveJobSet,
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
                          message: "Linked",
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        logEvent(analytics, "linkESIJob", {
                          UID: users[ParentUserIndex].accountID,
                          isLoggedIn: isLoggedIn,
                        });
                        setJobModified(true);
                      }}
                    >
                      <MdOutlineAddLink />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
        {jobMatches.length > 1 && (
          <Grid container sx={{ marginTop: { xs: "20px", sm: "20px" } }}>
            <Grid item sm={9} />
            <Grid item align="center" xs={12} sm={3}>
              <Button
                disabled={jobMatches.length > activeJob.jobCount ? true : false}
                variant="contained"
                size="small"
                onClick={() => {
                  let newLinkedJobIDs = new Set(linkedJobIDs);
                  let newApiJobsSet = new Set(activeJob.apiJobs);
                  let newLinkedJobsArray = [
                    ...activeJob.build.costs.linkedJobs,
                  ];
                  let newInstallCosts = activeJob.build.costs.installCosts;

                  if (isNaN(newInstallCosts) || newInstallCosts < 0) {
                    newInstallCosts = 0;
                    newLinkedJobsArray.forEach((linkedJob) => {
                      newInstallCosts += linkedJob.cost;
                    });
                  }

                  for (let job of jobMatches) {
                    const jobOwner = users.find(
                      (i) => i.CharacterID === job.installer_id
                    );
                    newApiJobsSet.add(job.job_id);
                    newLinkedJobsArray.push(
                      Object.assign({}, new ESIJob(job, jobOwner))
                    );
                    newInstallCosts += job.cost;
                    newLinkedJobIDs.add(job.job_id);
                  }
                  updateLinkedJobIDs([...newLinkedJobIDs]);
                  updateActiveJob((prevObj) => ({
                    ...prevObj,
                    apiJobs: newApiJobsSet,
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
                    message: `${jobMatches.length} Jobs Linked`,
                    severity: "success",
                    autoHideDuration: 1000,
                  }));
                  logEvent(analytics, "linkESIJobBulk", {
                    UID: users[ParentUserIndex].accountID,
                    isLoggedIn: isLoggedIn,
                  });
                  setJobModified(true);
                }}
              >
                Link All
              </Button>
            </Grid>
          </Grid>
        )}
      </>
    );
  } else if (activeJob.build.costs.linkedJobs.length >= activeJob.jobCount) {
    return (
      <Grid
        item
        xs={12}
        align="center"
        sx={{
          marginTop: { xs: "20px", sm: "30px" },
        }}
      >
        <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
          You have linked the maximum number of jobs from the API, if you need
          to link more increase the number of job slots used.
        </Typography>
      </Grid>
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
        <Typography
          sx={{ typography: { xs: "caption", sm: "body1" } }}
          align="center"
        >
          There are no matching industry jobs from the API that match this job.
        </Typography>
      </Grid>
    );
  }
}
