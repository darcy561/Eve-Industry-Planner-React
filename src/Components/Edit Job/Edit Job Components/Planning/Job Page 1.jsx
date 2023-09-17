import { useState } from "react";
import { Container, Grid } from "@mui/material";
import { RawResourceList } from "./Standard Layout/Resources Panel/ResourcePanel";
import { ProductionStats } from "./Standard Layout/productionStats";
import { TutorialStep1 } from "./tutorialStep1";
// import { SkillCheck } from "./Page 1 Components/skillCheck";
import { Masonry } from "@mui/lab";
// import { ItemCostPanel } from "./Page 1 Components/itemCosts";
// import { ManufacturingBlueprints } from "./Page 1 Components/manufacturingBlueprints";
// import { ReactionBlueprints } from "./Page 1 Components/reactionBlueprints";
// import { ArchiveJobs } from "./Page 1 Components/archiveJobs";
import { JobSetupPanel } from "./Standard Layout/Setup Panel/jobSetups";
import { EditJobSetup } from "./Standard Layout/editJobSetup";
import { AvailableBlueprintsPanel } from "./Standard Layout/Blueprint Options/blueprintPanel";
import { MaterialCostPanel } from "./Standard Layout/Material Prices/materialPricePanel";

export function EditPage1({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
}) {
  const [setupToEdit, updateSetupToEdit] = useState(
    activeJob.layout?.setupToEdit ||
    Object.keys(activeJob.build.setup)[0] || null
  );

  return (
    <Container
      disableGutters
      maxWidth="false"
      sx={{ width: "100%", marginTop: "20px" }}
    >
      <Grid container direction="row" spacing={2}>
        <TutorialStep1 />
        <Grid item xs={12} md={3}>
          <Masonry columns={1} spacing={2}>
            <ProductionStats activeJob={activeJob} setupToEdit={setupToEdit} />
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
        <Grid item xs={12} md={9}>
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
            />
            <MaterialCostPanel
              activeJob={activeJob}
              updateActiveJob={updateActiveJob}
              jobModified={jobModified}
              setJobModified={setJobModified}
              setupToEdit={setupToEdit}
            />
            {/* 
            <ItemCostPanel
              jobModified={jobModified}
              setJobModified={setJobModified}
            />
            <ArchiveJobs />
            <SkillCheck /> */}
          </Masonry>
        </Grid>
      </Grid>
    </Container>
  );
}
