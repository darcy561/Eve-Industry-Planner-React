import React, { useContext } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
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

export function LinkedJobs({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const analytics = getAnalytics();

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

  if (activeJob.apiJobs.length !== 0) {
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
              const jobBP = jobOwner.apiBlueprints.find(
                (i) => i.item_id === job.blueprint_id
              );
              if (jobBP !== undefined) {
                blueprintType = "bp";
                if (jobBP.quantity === -2) {
                  blueprintType = "bpc";
                }
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
                    variant="body2"
                    align="center"
                  >{`${job.runs} Runs`}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" align="center">
                    {job.station_name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" align="center">
                    Install Costs:{" "}
                    {job.cost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" align="center">
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
                        const ParentUserIndex = users.findIndex(
                          (u) => u.ParentUser === true
                        );

                        let newUsersArray = [...users];

                        setJobModified(true);

                        const newActiveJobArray = activeJob.apiJobs;
                        const aJ = newActiveJobArray.findIndex(
                          (x) => x === job.job_id
                        );
                        if (aJ !== -1) {
                          newActiveJobArray.splice(aJ, 1);
                        }

                        let newLinkedJobsArray =
                          activeJob.build.costs.linkedJobs;

                        newLinkedJobsArray.splice(linkedJobsArrayIndex, 1);

                        updateActiveJob((prevObj) => ({
                          ...prevObj,
                          apiJobs: newActiveJobArray,
                          build: {
                            ...prevObj.build,
                            costs: {
                              ...prevObj.build.costs,
                              linkedJobs: newLinkedJobsArray,
                              installCosts:
                                (activeJob.build.costs.installCosts -=
                                  job.cost),
                            },
                          },
                        }));

                        const uA = newUsersArray[
                          ParentUserIndex
                        ].linkedJobs.findIndex((y) => y === job.job_id);
                        newUsersArray[ParentUserIndex].linkedJobs.splice(uA, 1);

                        updateUsers(newUsersArray);

                        const newApiArray = apiJobs;
                        const aA = newApiArray.findIndex(
                          (z) => z.job_id === job.job_id
                        );
                        newApiArray[aA].linked = false;
                        updateApiJobs(newApiArray);

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
        {activeJob.apiJobs.length > 1 && (
          <Grid container sx={{ marginTop: { xs: "20px", sm: "20px" } }}>
            <Grid item sm={9} />
            <Grid item align="center" xs={12} sm={3}>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={() => {
                  setJobModified(true);
                  const ParentUserIndex = users.findIndex(
                    (u) => u.ParentUser === true
                  );
                  let newUsersArray = [...users];
                  const newActiveJobArray = [...activeJob.apiJobs];
                  let newLinkedJobsArray = [
                    ...activeJob.build.costs.linkedJobs,
                  ];
                  const newApiArray = [...apiJobs];
                  let newInstallCosts = 0;

                  for (let job of activeJob.apiJobs) {
                    const aJ = newActiveJobArray.findIndex((x) => x === job);

                    if (aJ !== -1) {
                      newActiveJobArray.splice(aJ, 1);
                    }
                    const linkedJobsArrayIndex = newLinkedJobsArray.findIndex(
                      (i) => i.job_id === job
                    );

                    if (linkedJobsArrayIndex !== -1) {
                      newInstallCosts +=
                        newLinkedJobsArray[linkedJobsArrayIndex].cost;
                      newLinkedJobsArray.splice(linkedJobsArrayIndex, 1);
                    }

                    const uA = newUsersArray[
                      ParentUserIndex
                    ].linkedJobs.findIndex((y) => y === job);
                    if (uA !== -1) {
                      newUsersArray[ParentUserIndex].linkedJobs.splice(uA, 1);
                    }
                    const aA = newApiArray.findIndex((z) => z.job_id === job);
                    if (aA !== -1) {
                      newApiArray[aA].linked = false;
                    }
                  }

                  updateUsers(newUsersArray);
                  updateApiJobs(newApiArray);
                  updateActiveJob((prevObj) => ({
                    ...prevObj,
                    apiJobs: newActiveJobArray,
                    build: {
                      ...prevObj.build,
                      costs: {
                        ...prevObj.build.costs,
                        linkedJobs: newLinkedJobsArray,
                        installCosts: (prevObj.build.costs.installCosts -=
                          newInstallCosts),
                      },
                    },
                  }));
                  setSnackbarData((prev) => ({
                    ...prev,
                    open: true,
                    message: `${activeJob.apiJobs.length} Jobs Unlinked`,
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
        <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
          You currently have no industry jobs from the ESI linked to the this
          job.
        </Typography>
      </Grid>
    );
  }
}
