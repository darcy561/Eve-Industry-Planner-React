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
import ArchiveJobsPanel from "./Archive Jobs Panel/archiveJobsPanel";

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
  return (
    <Grid container spacing={2} sx={{ marginTop: "10px" }}>
      <TutorialStep1 activeJob={activeJob} />
      <Grid item xs={3}>
        <Masonry columns={1} spacing={2}>
          <ProductionStats
            activeJob={activeJob}
            parentChildToEdit={parentChildToEdit}
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
        </Masonry>
      </Grid>
      <Grid item xs={9}>
        <Masonry columns={1} spacing={2}>
          <JobSetupPanel
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
        </Masonry>
      </Grid>
    </Grid>
  );
}
