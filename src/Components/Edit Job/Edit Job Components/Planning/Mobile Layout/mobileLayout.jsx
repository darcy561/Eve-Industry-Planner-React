import { Grid } from "@mui/material";
import { TutorialStep1 } from "../tutorialStep1";
import { ProductionStats } from "../Standard Layout/Production Stats Panel/productionStats";
import { JobSetupPanel } from "../Standard Layout/Setup Panel/jobSetups";
import { EditJobSetup } from "../Standard Layout/Edit Setup Panel/editJobSetup";
import { AvailableBlueprintsPanel } from "../Standard Layout/Blueprint Options/blueprintPanel";
import { RawResourceList } from "../Standard Layout/Resources Panel/ResourcePanel";
import { MaterialCostPanel } from "../Standard Layout/Material Prices/materialPricePanel";
import { SkillsPanel } from "../Standard Layout/Skills Panel/SkillsPanel";
import ArchiveJobsPanel from "../Standard Layout/Archive Jobs Panel/archiveJobsPanel";

export function Planning_MobileLayout_EditJob({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  esiDataToLink,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  return (
    <Grid container spacing={2} sx={{ marginTop: "10px" }}>
      <TutorialStep1 activeJob={activeJob} />
      <Grid item xs={12}>
        <ProductionStats
          activeJob={activeJob}
          parentChildToEdit={parentChildToEdit}
        />
        <JobSetupPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
        <EditJobSetup
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
        <AvailableBlueprintsPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
        <RawResourceList
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
        <MaterialCostPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          temporaryChildJobs={temporaryChildJobs}
          updateTemporaryChildJobs={updateTemporaryChildJobs}
          esiDataToLink={esiDataToLink}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
        <ArchiveJobsPanel activeJob={activeJob} />
        <SkillsPanel activeJob={activeJob} />
      </Grid>
    </Grid>
  );
}
