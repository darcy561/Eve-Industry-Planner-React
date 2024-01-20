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
<<<<<<< HEAD
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
=======
import { useOpenGroup } from "../../../../Hooks/GroupHooks/useOpenGroup";
import { useGroupManagement } from "../../../../Hooks/useGroupManagement";
import GLOBAL_CONFIG from "../../../../global-config-app";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

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
<<<<<<< HEAD

  const classes = useStyles();
=======
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
<<<<<<< HEAD
            ? theme.palette.type !== "dark"
=======
            ? theme.palette.mode !== "dark"
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
<<<<<<< HEAD
            className={classes.Checkbox}
=======
            sx={{
              color: (theme) =>
                theme.palette.mode === PRIMARY_THEME
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
<<<<<<< HEAD
            className={classes.DeleteIcon}
=======
            sx={{
              color: (theme) =>
                theme.palette.mode === PRIMARY_THEME
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            onClick={() => {
              deleteGroupWithoutJobs(group.groupID);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
<<<<<<< HEAD
        <Grid item xs={12} className={classes.GroupJob} />
=======
        <Grid
          item
          xs={12}
          sx={{
            height: "1px",
            background: (theme) =>
              theme.palette.mode === PRIMARY_THEME
                ? `linear-gradient(to right, ${yellow[600]} 30%, ${grey[800]} 60%)`
                : `linear-gradient(to right, ${yellow[600]} 20%, white 60%)`,
          }}
        />
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
      </Grid>
    </Card>
  );
}
