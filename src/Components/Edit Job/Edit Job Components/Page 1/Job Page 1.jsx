import { useContext, useMemo, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { Container, Grid } from "@mui/material";
import { RawResourceList } from "./rawResources";
import { ProductionStats } from "./productionStats";
import { TutorialStep1 } from "./tutorialStep1";
// import { SkillCheck } from "./Page 1 Components/skillCheck";
import { Masonry } from "@mui/lab";
// import { ItemCostPanel } from "./Page 1 Components/itemCosts";
// import { ManufacturingBlueprints } from "./Page 1 Components/manufacturingBlueprints";
// import { ReactionBlueprints } from "./Page 1 Components/reactionBlueprints";
// import { ArchiveJobs } from "./Page 1 Components/archiveJobs";
import { JobSetupPanel } from "./jobSetups";
import { EditJobSetup } from "./editJobSetup";

export function EditPage1({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
}) {
  const { users } = useContext(UsersContext);
  const [setupToEdit, updateSetupToEdit] = useState(
    Object.keys(activeJob.build.setup)[0] || null
  );

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  // function OptionSwitch() {
  //   switch (activeJob.jobType) {
  //     case 1:
  //       return (
  //         <>
  //           <ManufacturingOptions setJobModified={setJobModified} />
  //           <ManufacturingBlueprints setJobModified={setJobModified} />
  //         </>
  //       );
  //     case 2:
  //       return (
  //         <>
  //           <ReactionOptions setJobModified={setJobModified} />
  //           <ReactionBlueprints />
  //         </>
  //       );
  //     case 3:
  //       return null;
  //     default:
  //       return null;
  //   }
  // }

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
          </Masonry>
        </Grid>
        <Grid item xs={12} md={9}>
          <Masonry columns={1} spacing={2}>
            <JobSetupPanel
              activeJob={activeJob}
              updateActiveJob={updateActiveJob}
              jobModified={jobModified}
              setupToEdit={setupToEdit}
              updateSetupToEdit={updateSetupToEdit}
            />
            <RawResourceList
              activeJob={activeJob}
              updateActveJob={updateActiveJob}
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
