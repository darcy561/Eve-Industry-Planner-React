import {
  Avatar,
  AvatarGroup,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
  MultiSelectJobPlannerContext,
  JobPlannerPageTriggerContext,
} from "../../../Context/LayoutContext";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";
import DeleteIcon from "@mui/icons-material/Delete";
import { grey } from "@mui/material/colors";
import { makeStyles } from "@mui/styles";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../Context/DnDTypes";
import { useOpenGroup } from "../../../Hooks/GroupHooks/useOpenGroup";

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
}));

export function GroupJobCard({ group }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { deleteGroupWithoutJobs } = useGroupManagement();
  const { openGroup } = useOpenGroup();
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
  let groupCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i == group.groupID);
  }, [multiSelectJobPlanner]);

  return (
    <Grid ref={drag} item xs={12} sm={6} md={4} lg={3}>
      <Paper
        elevation={3}
        square
        sx={{
          padding: "10px",
          height: "100%",
          backgroundColor: (theme) =>
            groupCardChecked || isDragging
              ? theme.palette.type !== "dark"
                ? grey[300]
                : grey[900]
              : "none",
        }}
      >
        <Grid container item xs={12}>
          <Grid container item xs={12}>
            <Grid item xs={1}>
              <Checkbox
                className={classes.Checkbox}
                checked={groupCardChecked}
                onChange={(event) => {
                  if (event.target.checked) {
                    if (!multiSelectJobPlanner.includes(group.groupID)) {
                      updateMultiSelectJobPlanner((prev) =>
                        prev.concat(group.groupID)
                      );
                    }
                  } else {
                    updateMultiSelectJobPlanner((prev) =>
                      prev.filter((i) => i !== group.groupID)
                    );
                  }
                }}
              />
            </Grid>
            <Grid item xs={9} />
            <Grid item align="center" xs={2}>
              <IconButton
                className={classes.DeleteIcon}
                onClick={() => {
                  deleteGroupWithoutJobs(group.groupID);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: { xs: "5px", sm: "10px" } }}>
            <Typography
              color="secondary"
              align="center"
              sx={{
                minHeight: { xs: "2rem", sm: "3rem", md: "3rem", lg: "4rem" },
                typography: { xs: "body1", lg: "h6" },
              }}
            >
              {group.groupName}
            </Typography>
          </Grid>
          <Grid container item xs={12} style={{ height: "100%" }}>
            <Grid item xs={4} sm={3} />
            <Grid item xs={4} sm={6}>
              <AvatarGroup max={4} style={{ height: "100%" }}>
                {group.includedTypeIDs.map((typeID) => {
                  return (
                    <Avatar
                      key={typeID}
                      src={`https://images.evetech.net/types/${typeID}/icon?size=64`}
                    />
                  );
                })}
              </AvatarGroup>
            </Grid>
            <Grid item xs={4} sm={3} />
            <Grid item xs={12}></Grid>
          </Grid>

          <Grid
            item
            xs={12}
            align="center"
            sx={{ marginTop: { xs: "5px", sm: "5px" } }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                openGroup(group.groupID);
                updateEditGroupTrigger((prev) => !prev);
              }}
              sx={{ height: "25px", width: "100px" }}
            >
              View
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{
              backgroundColor: "groupJob.main",
              marginTop: "10px",
            }}
          >
            <Typography align="center" variant="body2" color="black">
              <b>Job Group</b>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
