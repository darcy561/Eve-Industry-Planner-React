import { Grid } from "@mui/material";
import { ArchiveJobButton } from "../../../Complete/Standard Layout/Button Panel/archiveJobButton";

export function Selling_ButtonPanel_EditJob({ activeJob }) {
  return (
    <Grid container justifyContent="flex-end">
      <ArchiveJobButton activeJob={activeJob} />
    </Grid>
  );
}
        