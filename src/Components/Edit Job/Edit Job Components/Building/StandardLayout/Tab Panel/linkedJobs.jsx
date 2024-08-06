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
import { ApiJobsContext } from "../../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";
import Job from "../../../../../../Classes/jobConstructor";

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
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { findBlueprintType, timeRemainingCalc } = useJobManagement();
  const { sendSnackbarNotificationSuccess, findUniverseItemObject } =
    useHelperFunction();

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
  }, [apiJobs, activeJob.build.costs.linkedJobs]);

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
                  <Tooltip
                    title={jobOwner.CharacterName}
                    arrow
                    placement="right"
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
                            jobOwner
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
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: STANDARD_TEXT_FORMAT }}
                    align="center"
                  >{`${job.runs.toLocaleString()} Runs`}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: STANDARD_TEXT_FORMAT }}
                    align="center"
                  >
                    {facilityData
                      ? facilityData.name
                      : "Location Data Unavailable"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: STANDARD_TEXT_FORMAT }}
                    align="center"
                  >
                    Install Costs:{" "}
                    {job.cost.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
                  </Typography>
                </Grid>
                {job.isCorp ? (
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: STANDARD_TEXT_FORMAT }}
                      align="center"
                    >
                      Corporation Job
                    </Typography>
                  </Grid>
                ) : null}

                <Grid item xs={12}>
                  <Typography
                    sx={{ typography: STANDARD_TEXT_FORMAT }}
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

                        newDataToLink.delete(job.job_id);
                        newDataToUnLink.add(job.job_id);

                        activeJob.unlinkESIJob(job);

                        setJobModified(true);
                        updateEsiDataToLink((prev) => ({
                          ...prev,
                          industryJobs: {
                            ...prev.industryJobs,
                            add: [...newDataToLink],
                            remove: [...newDataToUnLink],
                          },
                        }));
                        updateActiveJob((prev) => new Job(prev));
                        sendSnackbarNotificationSuccess("Unlinked");
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
                    activeJob.unlinkESIJob(job);
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

                  updateActiveJob((prev) => new Job(prev));
                  sendSnackbarNotificationSuccess(
                    `${jobsToRemoveQuantity} Jobs Unlinked`
                  );
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
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
          You currently have no industry jobs from the ESI linked to the this
          job.
        </Typography>
      </Grid>
    );
  }
}
