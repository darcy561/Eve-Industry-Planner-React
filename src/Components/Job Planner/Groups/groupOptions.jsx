import { useContext, useState } from "react";
import {
  Button,
  ButtonGroup,
  CircularProgress,
  Grid,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  DialogDataContext,
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
} from "../../../Context/LayoutContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";

export function GroupOptionsBar({
  updateShoppingListTrigger,
  updateShoppingListData,
  updateShowProcessing,
}) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updatePriceEntryListData } = useContext(PriceEntryListContext);
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { buildItemPriceEntry, moveItemsOnPlanner } = useJobManagement();
  const { buildFullJobTree, buildNextJobs } = useGroupManagement();

  return (
    <Paper
      elevation={3}
      square
      sx={{
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
        padding: "20px",
      }}
    >
      <Grid container sx={{ marginRight: "10px" }}>
        <Grid item xs={2}>
          <Tooltip
            title="Displays a shopping list of the remaining materials needed to build all of the jobs within the group or just the selected jobs."
            arrow
            placement="bottom"
          >
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={async () => {
                updateShowProcessing((prev) => !prev);
                if (multiSelectJobPlanner.length > 0) {
                  updateShoppingListData(multiSelectJobPlanner);
                } else {
                  updateShoppingListData([...activeGroup.includedJobIDs]);
                }
                updateShowProcessing((prev) => !prev);
                updateShoppingListTrigger((prev) => !prev);
              }}
              sx={{
                marginRight: "2px",
                marginLeft: "2px",
              }}
            >
              Shopping List
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={2}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={async () => {
              let itemList = null;
              updateShowProcessing((prev) => !prev);
              if (multiSelectJobPlanner.length > 0) {
                itemList = await buildItemPriceEntry(multiSelectJobPlanner);
              } else {
                itemList = await buildItemPriceEntry([
                  ...activeGroup.includedJobIDs,
                ]);
              }
              updateShowProcessing((prev) => !prev);
              updatePriceEntryListData((prev) => ({
                ...prev,
                open: true,
                list: itemList,
              }));
            }}
            sx={{
              marginRight: "2px",
              marginLeft: "2px",
            }}
          >
            Add Item Prices
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Tooltip title="Moves the selected jobs 1 step backwards." arrow>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={async () => {
                updateShowProcessing((prev) => !prev);
                await moveItemsOnPlanner(multiSelectJobPlanner, "backward");
                updateShowProcessing((prev) => !prev);
              }}
              sx={{
                marginRight: "2px",
                marginLeft: "2px",
              }}
            >
              Move Backward
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={2}>
          <Tooltip title="Moves the selected jobs 1 step forwards." arrow>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={async () => {
                updateShowProcessing((prev) => !prev);
                moveItemsOnPlanner(multiSelectJobPlanner, "forward");
                updateShowProcessing((prev) => !prev);
              }}
              sx={{
                marginRight: "2px",
                marginLeft: "2px",
              }}
            >
              Move Forward
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={2}>

            <Tooltip
              title="Adds the next ingrediants of all of the jobs or just the selected jobs."
              arrow
              placement="bottom"
            >
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={async () => {
                  updateShowProcessing((prev) => !prev);
                  if (multiSelectJobPlanner.length > 0) {
                    await buildNextJobs(multiSelectJobPlanner);
                  } else {
                    await buildNextJobs([...activeGroup.includedJobIDs]);
                  }
                  updateShowProcessing((prev) => !prev);
                }}
                sx={{
                  marginRight: "2px",
                  marginLeft: "2px",
                }}
              >
                Build Child Jobs
              </Button>
            </Tooltip>

        </Grid>
        <Grid item xs={2}>
          <Tooltip title="Adds the full item tree." arrow placement="bottom">
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={async () => {
                updateShowProcessing((prev) => !prev);
                await buildFullJobTree([...activeGroup.includedJobIDs]);
                updateShowProcessing((prev) => !prev);
              }}
              sx={{
                marginRight: "2px",
                marginLeft: "2px",
              }}
            >
              Build Full Tree
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
}
