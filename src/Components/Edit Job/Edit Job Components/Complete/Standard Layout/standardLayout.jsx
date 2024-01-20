import { Grid } from "@mui/material";
import { TutorialStep4 } from "../tutorialStep4";
import { ExtrasPanel } from "./Extras Panel/extras";
import { BuildStatsPanel } from "./Build Stats Panel/buildStats";
import { Complete_ButtonPanel_EditJob } from "./Button Panel/buttonLayout";

export function Complete_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  setJobModified,
}) {
  return (
    <Grid container spacing={2}>
      <TutorialStep4 activeJob={activeJob} />
      <Grid item xs={12} md={6}>
        <ExtrasPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <BuildStatsPanel activeJob={activeJob} />
      </Grid>
      <Grid item xs={12}>
        <Complete_ButtonPanel_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      </Grid>
    </Grid>
  );
}
