import { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Grow,
  ImageList,
  ImageListItem,
  Paper,
  Typography,
} from "@mui/material";
import { ActiveJobContext } from "../../../Context/JobContext";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";
import GLOBAL_CONFIG from "../../../global-config-app";
import { useNavigate } from "react-router-dom";

export function OutputJobsPanel({ groupJobs, groupPageRefresh }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const [outputJobs, updateOutputJobs] = useState([]);
  const { calculateCurrentJobBuildCostFromChildren } = useGroupManagement();
  const navigate = useNavigate();
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  useEffect(() => {
    let returnArray = [];
    for (let job of groupJobs) {
      if (job.parentJob.length === 0) {
        returnArray.push(job);
      }
    }
    updateOutputJobs(returnArray);
  }, [groupJobs]);

  if (!groupPageRefresh && activeGroup) {
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
        <Grid container>
          <Grid item xs={12}>
            <Typography
              variant="h4"
              sx={{
                color: (theme) =>
                  theme.palette.mode === PRIMARY_THEME
                    ? "secondary"
                    : theme.palette.primary.main,
              }}
            >
              Output
            </Typography>
          </Grid>
          <Grid container item xs={12}>
            <ImageList
              sx={{
                gridAutoFlow: "column",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(330px,1fr)) !important",
                gridAutoColumns: "minmax(330px, 1fr)",
              }}
            >
              {outputJobs.map((job) => {
                const buildCost = calculateCurrentJobBuildCostFromChildren(job);
                return (
                  <ImageListItem key={job.jobID}>
                    <Grow in={true}>
                      <Card
                        variant="outlined"
                        square
                        sx={{ padding: "10px", marginBottom: "10px" }}
                      >
                        <CardContent>
                          <Grid container item xs={12}>
                            <Grid item xs={2} align="center">
                              <Avatar
                                src={`https://images.evetech.net/types/${job.itemID}/icon?size=64`}
                                alt={job.name}
                                variant="square"
                                sx={{ height: 32, width: 32 }}
                              />
                            </Grid>
                            <Grid item xs={10}>
                              <Typography
                                color="secondary"
                                align="left"
                                sx={{
                                  minHeight: {
                                    xs: "2rem",
                                    sm: "3rem",
                                    md: "3rem",
                                    lg: "4rem",
                                  },
                                  typography: { xs: "body2", lg: "body1" },
                                }}
                              >
                                {job.name}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Grid container item xs={12}>
                            <Grid item xs={9}>
                              <Typography
                                sx={{
                                  typography: { xs: "caption", md: "body2" },
                                }}
                              >
                                Total Produced
                              </Typography>
                            </Grid>
                            <Grid item xs={3} align="right">
                              <Typography
                                sx={{
                                  typography: { xs: "caption", md: "body2" },
                                }}
                              >
                                {job.build.products.totalQuantity}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Grid container item xs={12}>
                            <Grid item xs={9}>
                              <Typography
                                sx={{
                                  typography: { xs: "caption", md: "caption" },
                                }}
                              >
                                Estimated Current Build Cost / Item
                              </Typography>
                            </Grid>
                            <Grid item xs={3} align="right">
                              <Typography
                                sx={{
                                  typography: { xs: "caption", md: "body2" },
                                }}
                              >
                                {buildCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions>
                          <Button
                            onClick={() => {
                              navigate(`/editJob/${job.jobID}`);
                            }}
                          >
                            View
                          </Button>
                        </CardActions>
                      </Card>
                    </Grow>
                  </ImageListItem>
                );
              })}
            </ImageList>
          </Grid>
        </Grid>
      </Paper>
    );
  } else {
    return <Paper>refresh</Paper>;
  }
}
