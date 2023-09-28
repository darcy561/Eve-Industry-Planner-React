import { Grid } from "@mui/material";
import { TutorialStep3 } from "../tutorialStep3";
import { InformationPanel } from "./Information Panel/informationPanel";
import { TabPanel_Building } from "./Tab Panel/tabPanel";

export function Building_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  jobMatches,
  parentUser,
}) {
  return (
    <Grid container spacing={2} sx={{ width: "100%" }}>
      <TutorialStep3 activeJob={activeJob} parentUser={parentUser} />
      <Grid item xs={12}>
        <InformationPanel activeJob={activeJob} />
      </Grid>
      <Grid item xs={12}>
        <TabPanel_Building
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
        />
      </Grid>
    </Grid>
  );
}
