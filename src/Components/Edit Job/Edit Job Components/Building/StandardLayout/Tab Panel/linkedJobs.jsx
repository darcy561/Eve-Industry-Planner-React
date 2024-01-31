import { useContext, useEffect } from "react";
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
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { ApiJobsContext } from "../../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";

export function LinkedJobsTab({
  activeJob,
  updateActiveJob,
  setJobModified,
  parentUser,
  esiDataToLink,
  updateEsiDataToLink,
}) {
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { findBlueprintType, timeRemainingCalc } = useJobManagement();

  const analytics = getAnalytics();

  useEffect(() => {
    function updateStoredAPIdata() {
      const newLinkedJobsArray = [...activeJob.build.costs.linkedJobs];

      newLinkedJobsArray.forEach((job) => {
        if (job.status === "active") {
          const latestData = apiJobs.find((i) => i.job_id === job.job_id);
          if (!latestData) return;
          job.status = latestData.status;
          job.completed_date = latestData.completed_date || null;
          job.end_date = latestData.end_date;
        }
      });
    }
    updateStoredAPIdata();
  }, [apiJobs]);

  if (activeJob.apiJobs.size !== 0) {
    return (
      <>
        <Grid
          container
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
            const jobOwner = users.find(
              (i) => i.CharacterHash === job.CharacterHash
            );
            const blueprintType = findBlueprintType(job.blueprint_id);

            const facilityData = findUniverseItemObject(job.station_id);

            const timeRemaining = timeRemainingCalc(Date.parse(job.end_date));
            return (
              <Grid
                key={job.job_id}
                item
                container
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
                {job.isCorp ? (
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                      align="center"
                    >
                      Corporation Job
                    </Typography>
                  </Grid>
                ) : null}

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
                    <Typography variant="body2" align="center">
                      {job.status === "active" && timeRemaining === "complete"
                        ? "Ready to Deliver"
                        : timeRemaining}
                    </Typography>
                  ) : null}
                </Grid>
                <Grid item xs={12} align="center">
                  <Tooltip title="Click to unlink from job">
                    <IconButton
                      color="error"
                      size="standard"
                      onClick={() => {
                        let newDataToLink = new Set(
                          esiDataToLink.industryJobs.add
                        );
                        let newDataToUnLink = new Set(
                          esiDataToLink.industryJobs.remove
                        );
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
                        newDataToLink.delete(job.job_id);
                        newDataToUnLink.add(job.job_id);

                        setJobModified(true);
                        updateEsiDataToLink((prev) => ({
                          ...prev,
                          industryJobs: {
                            ...prev.industryJobs,
                            add: [...newDataToLink],
                            remove: [...newDataToUnLink],
                          },
                        }));
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
                          UID: parentUser.accountID,
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
                  let newDataToLink = new Set(esiDataToLink.industryJobs.add);
                  let newDataToUnLink = new Set(
                    esiDataToLink.industryJobs.remove
                  );
                  let jobsToRemoveQuantity =
                    activeJob.build.costs.linkedJobs.length;

                  for (let job of activeJob.apiJobs) {
                    newDataToLink.delete(job.job_id);
                    newDataToUnLink.add(job.job_id);
                  }

                  setJobModified(true);
                  updateEsiDataToLink((prev) => ({
                    ...prev,
                    industryJobs: {
                      ...prev.industryJobs,
                      add: [...newDataToLink],
                      remove: [...newDataToUnLink],
                    },
                  }));
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
                    UID: parentUser.accountID,
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
