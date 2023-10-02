import { Grid } from "@mui/material";
import { SellGroupJobButton } from "./sellGroupJob";
import { MarkAsCompleteButton } from "./markAsComplete";
import { PassBuildCostsButton } from "./passBuildCosts";
import { ArchiveJobButton } from "./archiveJobButton";

export function Complete_ButtonPanel_EditJob({
  activeJob,
  updateActiveJob,
  setJobModified,
}) {
  return (
    <Grid container justifyContent="flex-end">
      <SellGroupJobButton
        activeJob={activeJob}
        updateActiveJob={updateActiveJob}
        setJobModified={setJobModified}
      />
      <MarkAsCompleteButton
        activeJob={activeJob}
        setJobModified={setJobModified}
      />
      <PassBuildCostsButton activeJob={activeJob} />
      <ArchiveJobButton activeJob={activeJob} />
    </Grid>
  );
}
