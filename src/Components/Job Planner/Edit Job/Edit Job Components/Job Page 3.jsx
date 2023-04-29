import React, { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
  LinkedIDsContext,
} from "../../../../Context/JobContext";
import { Container, Grid } from "@mui/material";
import { TutorialStep3 } from "./Page 3 Components/tutorialStep3";
import { UsersContext } from "../../../../Context/AuthContext";
import { Step3TabMenu } from "./Page 3 Components/TabPanel";
import { InformationPanel } from "./Page 3 Components/infoPanel";

export function EditPage3({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  const { linkedJobIDs } = useContext(LinkedIDsContext);

  const parentUser = users.find((i) => i.ParentUser === true);

  const jobMatches = apiJobs.filter(
    (job) =>
      activeJob.itemID === job.product_type_id &&
      !activeJob.apiJobs.has(job.job_id) &&
      !linkedJobIDs.includes(job.job_id) &&
      !parentUser.linkedJobs.has(job.job_id)
  );

  return (
    <Container disableGutters maxWidth="false" sx={{ width: "100%" }}>
      <Grid container direction="row" spacing={2}>
        <TutorialStep3 />

        <Grid item xs={12}>
          <InformationPanel />
        </Grid>
        <Grid item xs={12}>
          <Step3TabMenu
            jobMatches={jobMatches}
            setJobModified={setJobModified}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
