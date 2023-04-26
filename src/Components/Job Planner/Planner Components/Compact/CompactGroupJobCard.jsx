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
import { makeStyles } from "@mui/styles";
import { useOpenGroup } from "../../../../Hooks/GroupHooks/useOpenGroup";
import { useGroupManagement } from "../../../../Hooks/useGroupManagement";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
  DeleteIcon: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
  GroupJob: {
    height: "1px",
    background:
      theme.palette.type === "dark"
        ? `linear-gradient(to right, ${yellow[600]} 30%, ${grey[800]} 60%)`
        : `linear-gradient(to right, ${yellow[600]} 20%, white 60%)`,
  },
}));

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

  const classes = useStyles();
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
            ? theme.palette.type !== "dark"
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
            className={classes.Checkbox}
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
        <Grid container item xs={6} sm={8} alignItems="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {group.groupName}
          </Typography>
        </Grid>
        <Grid item xs={3} sm={2} align="center">
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
        <Grid item xs={1} align="center">
          <IconButton
            className={classes.DeleteIcon}
            onClick={() => {
              deleteGroupWithoutJobs(group.groupID);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
        <Grid item xs={12} className={classes.GroupJob} />
      </Grid>
    </Card>
  );
}
