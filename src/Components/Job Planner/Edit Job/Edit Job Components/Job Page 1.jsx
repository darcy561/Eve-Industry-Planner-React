import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { UsersContext } from "../../../../Context/AuthContext";
import { Container, Grid } from "@mui/material";
import { ManufacturingOptions } from "./Page 1 Components/maunfacturingOptions";
import { ReactionOptions } from "./Page 1 Components/reactionOptions";
import { RawResourceList } from "./Page 1 Components/rawResources";
import { ProductionStats } from "./Page 1 Components/productionStats";
import { TutorialStep1 } from "./Page 1 Components/tutorialStep1";
import { SkillCheck } from "./Page 1 Components/skillCheck";
import { Masonry } from "@mui/lab";
import { ItemCostPanel } from "./Page 1 Components/itemCosts";
import { MatchingBlueprints } from "./Page 1 Components/blueprintPanel";

export function EditPage1({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);

  const parentUser = users.find((i) => i.ParentUser === true);

  function OptionSwitch() {
    switch (activeJob.jobType) {
      case 1:
        return <ManufacturingOptions setJobModified={setJobModified} />;
      case 2:
        return <ReactionOptions setJobModified={setJobModified} />;
      case 3:
        return null;
      default:
        return null;
    }
  }

  return (
    <Container
      disableGutters
      maxWidth="false"
      sx={{ width: "100%", marginTop: "20px" }}
    >
      <Grid container direction="row" spacing={2}>
        {!parentUser.settings.layout.hideTutorials && (
          <Grid item xs={12}>
            <TutorialStep1 />
          </Grid>
        )}
        <Grid item xs={12} md={3}>
          <Masonry columns={1} spacing={2}>
            <ProductionStats />
            <OptionSwitch />
            <MatchingBlueprints/>
          </Masonry>
        </Grid>
        <Grid item xs={12} md={9}>
          <Masonry columns={1} spacing={2}>
            <SkillCheck />
            <RawResourceList />
            <ItemCostPanel/>
          </Masonry>
        </Grid>
      </Grid>
    </Container>
  );
}
