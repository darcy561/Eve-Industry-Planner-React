import { Grid } from "@mui/material";
import { useState } from "react";
import { TutorialStep1 } from "../tutorialStep1";
import { ProductionStats } from "../Standard Layout/Production Stats Panel/productionStats";
import { JobSetupPanel } from "../Standard Layout/Setup Panel/jobSetups";
import { EditJobSetup } from "../Standard Layout/Edit Setup Panel/editJobSetup";
import { AvailableBlueprintsPanel } from "../Standard Layout/Blueprint Options/blueprintPanel";
import { RawResourceList } from "../Standard Layout/Resources Panel/ResourcePanel";
import { MaterialCostPanel } from "../Standard Layout/Material Prices/materialPricePanel";
import { ArchiveJobsPanel } from "../Standard Layout/Archive Jobs Panel/ArchiveJobsPanel";
import { SkillsPanel } from "../Standard Layout/Skills Panel/SkillsPanel";

export function Planning_MobileLayout_EditJob({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs
}) {
  const [setupToEdit, updateSetupToEdit] = useState(
    activeJob.layout?.setupToEdit ||
      Object.keys(activeJob.build.setup)[0] ||
      null
  );
  return (
    <Grid container spacing={2} sx={{marginTop: "10px"}}>
      <TutorialStep1 activeJob={activeJob} />
      <Grid item xs={12}>
        <ProductionStats activeJob={activeJob} setupToEdit={setupToEdit} />
        <JobSetupPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          setupToEdit={setupToEdit}
          updateSetupToEdit={updateSetupToEdit}
        />
        <EditJobSetup
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          setupToEdit={setupToEdit}
          updateSetupToEdit={updateSetupToEdit}
        />
        <AvailableBlueprintsPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          setupToEdit={setupToEdit}
        />
        <RawResourceList
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setupToEdit={setupToEdit}
        />
        <MaterialCostPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          setupToEdit={setupToEdit}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
        />
        <ArchiveJobsPanel activeJob={activeJob} />
        <SkillsPanel activeJob={activeJob} setupToEdit={setupToEdit} />
      </Grid>
    </Grid>
  );
}
