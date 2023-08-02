import { Grid } from "@mui/material";
import { SellGroupJob } from "./sellGroupJob";
import { MarkAsCompleteButton } from "./markAsComplete";
import { ArchiveJobButton } from "../Page 5 Components/archiveJobButton";
import { PassBuildCostButton } from "./passBuildCost";

export function Step4Buttons({ setJobModified, updateEditJobTrigger }) {
  return (
    <Grid container justifyContent="flex-end">
      <SellGroupJob setJobModified={setJobModified} />
      <MarkAsCompleteButton setJobModified={setJobModified} />
      <PassBuildCostButton />
      <ArchiveJobButton updateEditJobTrigger={updateEditJobTrigger} />
    </Grid>
  );
}
