import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Checkbox,
  Grid,
  Grow,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
  MultiSelectJobPlannerContext,
  JobPlannerPageTriggerContext,
} from "../../../../Context/LayoutContext";
import { useGroupManagement } from "../../../../Hooks/useGroupManagement";
import DeleteIcon from "@mui/icons-material/Delete";
import { grey } from "@mui/material/colors";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
import { useOpenGroup } from "../../../../Hooks/GroupHooks/useOpenGroup";
import GLOBAL_CONFIG from "../../../../global-config-app";
import { useNavigate } from "react-router-dom";

export function ClassicGroupJobCard({ group }) {
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
  const { PRIMARY_THEME } = GLOBAL_CONFIG;
  let groupCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i == group.groupID);
  }, [multiSelectJobPlanner]);
  const navigate = useNavigate();

  return (
    <Grid ref={drag} item xs={12} sm={6} md={4} lg={3}>
      <Paper
        elevation={3}
        square
        sx={(theme) => {
          const isDarkMode = theme.palette.mode === PRIMARY_THEME;
          const backgroundColor =
            groupCardChecked || isDragging
              ? isDarkMode
                ? grey[900]
                : grey[300]
              : undefined;
          const borderColor = isDarkMode ? grey[700] : grey[400];
          return {
            marginTop: "5px",
            marginBottom: "5px",
            cursor: "grab",
            backgroundColor,
            transition: "border 0.3s ease",
            border: `2px solid transparent`,
            "&:hover": {
              border: `2px solid ${borderColor}`,
            },
          };
        }}
      >
        <Box sx={{ display: "flex", height: "100%" }}>
          <Grid
            container
            direction="column"
            item
            xs={12}
            sx={{ height: "100%" }}
          >
            <Grid container item xs={12}>
              <Grid container item xs={12}>
                <Grid item align="left" xs={6}>
                  <Checkbox
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
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

                <Grid item align="right" xs={6}>
                  <IconButton
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                      "&:Hover": {
                        color: "error.main",
                      },
                    }}
                    onClick={() => {
                      deleteGroupWithoutJobs(group.groupID);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
              <Grid
                item
                xs={12}
                sx={{ marginBottom: { xs: "5px", sm: "10px" } }}
              >
                <Typography color="secondary" align="center" variant="body1">
                  {group.groupName}
                </Typography>
              </Grid>
              <Grid container item xs={12} sx={{}}>
                <Grid item xs={12} />
                <Grid
                  item
                  xs={12}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <AvatarGroup max={4} style={{ height: "100%" }}>
                    {[...group.includedTypeIDs].map((typeID) => {
                      return (
                        <Avatar
                          key={typeID}
                          src={`https://images.evetech.net/types/${typeID}/icon?size=64`}
                          style={{
                            border: "none",
                          }}
                        />
                      );
                    })}
                  </AvatarGroup>
                </Grid>
              </Grid>
              <Grid container item xs={12} sx={{ alignItems: "flex-end" }}>
                <Grid item xs={12} align="center" sx={{ marginTop: "5px" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate(`/group/${group.groupID}`)}
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
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Grid>
  );
}
