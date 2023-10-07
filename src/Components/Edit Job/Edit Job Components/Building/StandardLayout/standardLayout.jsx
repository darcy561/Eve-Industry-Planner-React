import { Grid } from "@mui/material";
import { TutorialStep3 } from "../tutorialStep3";
import { InformationPanel } from "./Information Panel/informationPanel";
import { TabPanel_Building } from "./Tab Panel/tabPanel";

export function Building_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  setJobModified,
  jobMatches,
  parentUser,
  esiDataToLink,
  updateEsiDataToLink
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
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      </Grid>
    </Grid>
  );
}
