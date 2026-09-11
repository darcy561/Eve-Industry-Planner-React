import { Grid } from "@mui/material";

import { ArchiveJobButton } from "./archiveJobButton";

export function Step5Buttons({ updateEditJobTrigger }) {
  return (
    <Grid
      container
      sx={{
        justifyContent: "flex-end",
      }}
    >
      <ArchiveJobButton updateEditJobTrigger={updateEditJobTrigger} />
    </Grid>
  );
}
