import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
import {
  Button,
  Card,
  Checkbox,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useContext, useMemo } from "react";
import {
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
} from "../../../../Context/LayoutContext";
import { grey, yellow } from "@mui/material/colors";
import { useOpenGroup } from "../../../../Hooks/GroupHooks/useOpenGroup";
import { useGroupManagement } from "../../../../Hooks/useGroupManagement";

export function CompactGroupJobCard({ group }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { openGroup } = useOpenGroup();
  const { deleteGroupWithoutJobs } = useGroupManagement();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.groupCard,
    item: {
      id: group.groupID,
      cardType: ItemTypes.groupCard,
      currentStatus: group.groupStatus,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const groupCardChecked = useMemo(
    () => multiSelectJobPlanner.includes(group.groupID),
    [multiSelectJobPlanner]
  );

  return (
    <Card
      ref={drag}
      square
      sx={{
        marginTop: "5px",
        marginBottom: "5px",
        cursor: "grab",
        backgroundColor: (theme) =>
          groupCardChecked || isDragging
            ? theme.palette.mode !== "dark"
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
            checked={groupCardChecked}
            onChange={(event) => {
              if (event.target.checked) {
                updateMultiSelectJobPlanner((prev) => {
                  return [...new Set([...prev, group.groupID])];
                });
              } else {
                updateMultiSelectJobPlanner((prev) =>
                  prev.filter((i) => i !== group.groupID)
                );
              }
            }}
          />
        </Grid>
        <Grid container item xs={6} sm={9} alignItems="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {group.groupName}
          </Typography>
        </Grid>
        <Grid container item xs={3} sm={1} align="center" alignItems="center">
          <Button
            color="primary"
            onClick={() => {
              openGroup(group.groupID);
              updateEditGroupTrigger((prev) => !prev);
            }}
          >
            View
          </Button>
        </Grid>
        <Grid container item xs={1} align="center" alignItems="center">
          <IconButton
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
            onClick={() => {
              deleteGroupWithoutJobs(group.groupID);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            height: "1px",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? `linear-gradient(to right, ${yellow[600]} 30%, ${grey[800]} 60%)`
                : `linear-gradient(to right, ${yellow[600]} 20%, white 60%)`,
          }}
        />
      </Grid>
    </Card>
  );
}
