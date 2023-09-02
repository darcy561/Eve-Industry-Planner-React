import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { structureOptions } from "../../../../Context/defaultValues";
import { jobTypes } from "../../../../Context/defaultValues";
import DeleteIcon from "@mui/icons-material/Delete";
import { UsersContext } from "../../../../Context/AuthContext";
import rawSystemData from "../../../../RawData/systems.json";

export function JobSetupPanel({
  activeJob,
  updateActiveJob,
  jobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { users } = useContext(UsersContext);

  return (
    <Paper
      sx={{
        minWidth: "100%",
        padding: "20px",
        position: "relative",
      }}
      elevation={3}
      square
    >
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h6" align="center" color="primary">
            Build Setup
          </Typography>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "20px" }}>
          {Object.values(activeJob.build.setup).map((setupEntry) => {
            const assignedCharacterName =
              users.find(
                (i) => i.CharacterHash === setupEntry.selectedCharacter
              )?.CharacterName || "No Matching Character Found";
            console.log(setupEntry);
            return (
              <Grid container item xs={6} sm={4} lg={3}>
                <Card elevation={3} square sx={{ minWidth: "100%" }}>
                  <CardActionArea
                    onClick={() => updateSetupToEdit(setupEntry.id)}
                  >
                    <CardContent>
                      <Grid container item xs={12}>
                        {jobTypes.manufacturing === setupEntry.jobType && (
                          <>
                            <Grid item xs={3}>
                              <Typography> ME: {setupEntry.ME}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography>TE: {setupEntry.TE * 2}</Typography>
                            </Grid>
                          </>
                        )}
                        <Grid
                          item
                          xs={
                            jobTypes.manufacturing === setupEntry.jobType
                              ? 3
                              : 6
                          }
                        >
                          <Typography>Runs: {setupEntry.runCount}</Typography>
                        </Grid>
                        <Grid
                          item
                          xs={
                            jobTypes.manufacturing === setupEntry.jobType
                              ? 3
                              : 6
                          }
                        >
                          <Typography>Jobs: {setupEntry.jobCount}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography align="center">
                            {assignedCharacterName}
                          </Typography>
                        </Grid>
                        {setupEntry.customStructureID ? (
                          <UseCustomStructure setupEntry={setupEntry} />
                        ) : (
                          <UseDefaultStructures setupEntry={setupEntry} />
                        )}

                        <Tooltip
                          title={`Install Cost Per Job: ${setupEntry.estimatedInstallCost.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}`}
                          arrow
                          placement="bottom"
                        >
                          <Grid item xs={12}>
                            <Typography align="center">
                              Est Total Install Costs:{" "}
                              {(
                                setupEntry.estimatedInstallCost *
                                setupEntry.jobCount
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Grid>
                        </Tooltip>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sx={{
                          height: "1px",
                          backgroundColor:
                            setupEntry.id === setupToEdit ? "blue" : null,
                        }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}

function UseCustomStructure({ setupEntry }) {
  const { users } = useContext(UsersContext);

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const customStructureMap = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };

  const assignedStructureData =
    parentUser.settings.structures[customStructureMap[setupEntry.jobType]].find(
      (i) => i.id === setupEntry.customStructureID
    ) || null;
  return (
    <Grid item xs={12}>
      <Typography align="center">{assignedStructureData.name}</Typography>
    </Grid>
  );
}

function UseDefaultStructures({ setupEntry }) {
  const structureTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manStructure,
    [jobTypes.reaction]: structureOptions.reactionStructure,
  };
  const rigTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manRigs,
    [jobTypes.reaction]: structureOptions.reactionRigs,
  };
  const systemTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manSystem,
    [jobTypes.reaction]: structureOptions.reactionSystem,
  };

  const structureTypeData =
    structureTypeMap[setupEntry.jobType][setupEntry.structureID];
  const rigTypeData = rigTypeMap[setupEntry.jobType][setupEntry.rigID];
  const systemTypeData =
    systemTypeMap[setupEntry.jobType][setupEntry.systemTypeID];
  const matchedSystemID =
    rawSystemData.find((i) => i.id === setupEntry.systemID)?.name ||
    "No Matching System";

  return (
    <Grid container item xs={12}>
      <Grid item xs={4}>
        <Typography align="center">{systemTypeData.label}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography align="center">{structureTypeData.label}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography align="center">{rigTypeData.label}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align="center">{matchedSystemID}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align="center">Tax: {setupEntry.taxValue}%</Typography>
      </Grid>
    </Grid>
  );
}
