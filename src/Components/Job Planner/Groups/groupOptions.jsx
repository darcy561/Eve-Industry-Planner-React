import { useContext } from "react";
import { Button, ButtonGroup, Grid, Paper, Tooltip } from "@mui/material";
import {
  DialogDataContext,
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
} from "../../../Context/LayoutContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";

export function GroupOptionsBar({
  updateShoppingListTrigger,
  updateShoppingListData,
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

  return (
    // <Paper
    //   elevation={3}
    //   square
    //   sx={{
    //     marginRight: { md: "10px" },
    //     marginLeft: { md: "10px" },
    //     padding: "20px",
    //   }}
    // >
    <Grid container sx={{ marginRight: "10px" }}>
      <ButtonGroup fullWidth variant="outlined" size="small">
        <Tooltip
          title="Displays a shopping list of the remaining materials needed to build all of the jobs within the group or just the selected jobs."
          arrow
          placement="bottom"
        >
          <Button
            onClick={async () => {
              if (multiSelectJobPlanner.length > 0) {
                updateShoppingListData(multiSelectJobPlanner);
              } else {
                updateShoppingListData([...activeGroup.includedJobIDs]);
              }
              updateShoppingListTrigger((prev) => !prev);
            }}
          >
            Shopping List
          </Button>
        </Tooltip>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={async () => {
            let itemList = null;
            if (multiSelectJobPlanner.length > 0) {
              itemList = await buildItemPriceEntry(multiSelectJobPlanner);
            } else {
              itemList = await buildItemPriceEntry([
                ...activeGroup.includedJobIDs,
              ]);
            }
            updatePriceEntryListData((prev) => ({
              ...prev,
              open: true,
              list: itemList,
            }));
          }}
        >
          Add Item Prices
        </Button>
        <Tooltip title="Moves the selected jobs 1 step backwards." arrow>
          <Button
            disabled={multiSelectJobPlanner.length === 0}
            onClick={() => {
              moveItemsOnPlanner(multiSelectJobPlanner, "backward");
            }}
          >
            Move Backward
          </Button>
        </Tooltip>
        <Tooltip title="Moves the selected jobs 1 step forwards." arrow>
          <Button
            disabled={multiSelectJobPlanner.length === 0}
            onClick={() => {
              moveItemsOnPlanner(multiSelectJobPlanner, "forward");
            }}
          >
            Move Forward
          </Button>
        </Tooltip>
        <Button onClick={() => {}}>s</Button>
        <Button onClick={() => {}}>f</Button>
      </ButtonGroup>
    </Grid>
    // </Paper>
  );
}
