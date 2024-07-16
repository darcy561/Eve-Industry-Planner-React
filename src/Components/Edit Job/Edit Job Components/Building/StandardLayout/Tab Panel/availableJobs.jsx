import { useContext } from "react";
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
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
} from "../../../../../../Context/defaultValues";

export function AvailableJobsTab({
  activeJob,
  updateActiveJob,
  setJobModified,
  jobMatches,
  parentUser,
  totalJobCount,
  esiDataToLink,
  updateEsiDataToLink,
}) {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { findBlueprintType, timeRemainingCalc } = useJobManagement();
  const {
    findUniverseItemObject,
    sendSnackbarNotificationError,
    sendSnackbarNotificationSuccess,
  } = useHelperFunction();

  const analytics = getAnalytics();

  class ESIJob {
    constructor(originalJob, owner) {
      this.status = originalJob.status;
      this.CharacterHash = owner.CharacterHash;
      this.runs = originalJob.runs;
      this.job_id = originalJob.job_id;
      this.completed_date = originalJob.completed_date || null;
      this.station_id = originalJob.facility_id;
      this.start_date = originalJob.start_date;
      this.end_date = originalJob.end_date;
      this.cost = originalJob.cost;
      this.blueprint_type_id = originalJob.blueprint_type_id;
      this.product_type_id = originalJob.product_type_id;
      this.activity_id = originalJob.activity_id;
      this.duration = originalJob.duration;
      this.blueprint_id = originalJob.blueprint_id;
      this.isCorp = originalJob.isCorp;
    }
  }

  if (jobMatches.length !== 0 && activeJob.apiJobs.size < totalJobCount) {
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
          {jobMatches.map((job) => {
            const jobOwner = users.find(
              (i) => i.CharacterID === job.installer_id
            );
            if (!jobOwner) return null;

            const blueprintType = findBlueprintType(job.blueprint_id);

            const facilityName =
              findUniverseItemObject(job.facility_id)?.name ||
              "Location Data Unavailable";

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
                    {facilityName}
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
                  <Tooltip title="Click to link to job">
                    <IconButton
                      color="primary"
                      size="standard"
                      onClick={() => {
                        let newInstallCosts =
                          activeJob.build.costs.installCosts;
                        let newDataToLink = new Set(
                          esiDataToLink.industryJobs.add
                        );
                        let newDataToUnLink = new Set(
                          esiDataToLink.industryJobs.remove
                        );
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

                        newLinkedJobsArray.push({
                          ...new ESIJob(job, jobOwner),
                        });

                        newActiveJobSet.add(job.job_id);
                        newDataToLink.add(job.job_id);
                        newDataToUnLink.delete(job.job_id);
                        newInstallCosts += job.cost;

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
                        sendSnackbarNotificationSuccess("Linked");
                        logEvent(analytics, "linkESIJob", {
                          UID: parentUser.accountID,
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
                  let newDataToLink = new Set(esiDataToLink.industryJobs.add);
                  let newDataToUnLink = new Set(
                    esiDataToLink.industryJobs.remove
                  );
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
                    newLinkedJobsArray.push({ ...new ESIJob(job, jobOwner) });
                    newInstallCosts += job.cost;
                    newDataToLink.add(job.job_id);
                    newDataToUnLink.delete(job.job_id);
                  }
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

                  sendSnackbarNotificationError(
                    `${jobMatches.length} Jobs Linked`
                  );
                  logEvent(analytics, "linkESIJobBulk", {
                    UID: parentUser.accountID,
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
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
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
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }} align="center">
          There are no matching industry jobs from the API that match this job.
        </Typography>
      </Grid>
    );
  }
}
