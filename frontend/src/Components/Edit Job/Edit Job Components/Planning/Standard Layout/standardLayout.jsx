import { Grid } from "@mui/material";
import { ProductionStats } from "./Production Stats Panel/productionStats";
import { TutorialStep1 } from "../tutorialStep1";
import { Masonry } from "@mui/lab";
import { JobSetupPanel } from "./Setup Panel/jobSetups";
import { EditJobSetup } from "./Edit Setup Panel/editJobSetup";
import { AvailableBlueprintsPanel } from "./Blueprint Options/blueprintPanel";
import MaterialsAndSourcingPanel from "./Materials And Sourcing/materialsAndSourcingPanel";
import PlanningEconomics from "./Cost Breakdown/planningEconomics";
import { SkillsPanel } from "./Skills Panel/SkillsPanel";
import ArchiveJobsPanel from "./Archive Jobs Panel/archiveJobsPanel";
import TutorialTemplate from "../../../../Tutorials/tutorialTemplate";

export function Planning_StandardLayout_EditJob(props) {
  const { state } = props;
  return (
    <Grid container sx={{ marginTop: { xs: 0, sm: 2 } }}>
      <Grid size={12} sx={{ marginBottom: 2 }}>
        <TutorialTemplate TutorialContent={<TutorialStep1 state={state} />} />
      </Grid>
      <Grid size={3}>
        <Masonry columns={1} spacing={2}>
          <ProductionStats {...props} />
          <EditJobSetup {...props} />
          <AvailableBlueprintsPanel {...props} />
          <SkillsPanel {...props} />
        </Masonry>
      </Grid>
      <Grid size={9}>
        <Masonry columns={1} spacing={2}>
          <JobSetupPanel {...props} />
          <MaterialsAndSourcingPanel {...props} />
          <PlanningEconomics {...props} />
          <ArchiveJobsPanel {...props} />
        </Masonry>
      </Grid>
    </Grid>
  );
}
