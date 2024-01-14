import { useState } from "react";
import { Grid } from "@mui/material";
import { RawResourceList } from "./Resources Panel/ResourcePanel";
import { ProductionStats } from "./Production Stats Panel/productionStats";
import { TutorialStep1 } from "../tutorialStep1";
import { Masonry } from "@mui/lab";
import { JobSetupPanel } from "./Setup Panel/jobSetups";
import { EditJobSetup } from "./Edit Setup Panel/editJobSetup";
import { AvailableBlueprintsPanel } from "./Blueprint Options/blueprintPanel";
import { MaterialCostPanel } from "./Material Prices/materialPricePanel";
import { SkillsPanel } from "./Skills Panel/SkillsPanel";
import { ArchiveJobsPanel } from "./Archive Jobs Panel/ArchiveJobsPanel";

export function Planning_StandardLayout_EditJob({
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
  const [setupToEdit, updateSetupToEdit] = useState(
    activeJob.layout?.setupToEdit ||
      Object.keys(activeJob.build.setup)[0] ||
      null
  );

  return (
    <Grid container spacing={2} sx={{ marginTop: "10px" }}>
      <TutorialStep1 activeJob={activeJob} />
      <Grid item xs={3}>
        <Masonry columns={1} spacing={2}>
          <ProductionStats
            activeJob={activeJob}
            setupToEdit={setupToEdit}
            parentChildToEdit={parentChildToEdit}
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
        </Masonry>
      </Grid>
      <Grid item xs={9}>
        <Masonry columns={1} spacing={2}>
          <JobSetupPanel
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            setupToEdit={setupToEdit}
            updateSetupToEdit={updateSetupToEdit}
          />
          <RawResourceList
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setupToEdit={setupToEdit}
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
            setupToEdit={setupToEdit}
            temporaryChildJobs={temporaryChildJobs}
            updateTemporaryChildJobs={updateTemporaryChildJobs}
            esiDataToLink={esiDataToLink}
            parentChildToEdit={parentChildToEdit}
            updateParentChildToEdit={updateParentChildToEdit}
          />
          <ArchiveJobsPanel activeJob={activeJob} />
          <SkillsPanel activeJob={activeJob} setupToEdit={setupToEdit} />
        </Masonry>
      </Grid>
    </Grid>
  );
}
