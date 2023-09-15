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
import AddIcon from "@mui/icons-material/Add";
import { UsersContext } from "../../../../Context/AuthContext";
import rawSystemData from "../../../../RawData/systems.json";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { useSetupManagement } from "../../../../Hooks/GeneralHooks/useSetupManagement";

export function JobSetupPanel({
  activeJob,
  updateActiveJob,
  jobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { users } = useContext(UsersContext);
  const { addNewSetup } = useSetupManagement();

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
      <IconButton
        sx={{ position: "absolute", top: "10px", right: "10px" }}
        color="primary"
        onClick={async () => {
          const { jobSetups, newMaterialArray, newTotalProduced } =
            await addNewSetup(activeJob);
          updateActiveJob((prev) => ({
            ...prev,
            build: {
              ...prev.build,
              setup: jobSetups,
              materials: newMaterialArray,
              products: {
                ...prev.build.products,
                totalQuantity: newTotalProduced,
              },
            },
          }));
        }}
      >
        <AddIcon />
      </IconButton>
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
            return (
              <Grid container item xs={6} sm={4}>
                <Card elevation={3} square sx={{ minWidth: "100%" }}>
                  <CardActionArea
                    onClick={() => {
                      updateActiveJob((prev) => ({
                        ...prev,
                        layout: {
                          ...prev.layout,
                          setupToEdit: setupEntry.id,
                        },
                      }));
                      updateSetupToEdit(setupEntry.id);
                    }}
                  >
                    <CardContent>
                      <Grid container item xs={12}>
                        {jobTypes.manufacturing === setupEntry.jobType && (
                          <>
                            <Grid item xs={3}>
                              <Typography
                                sx={{
                                  typography: { xs: "caption", sm: "body2" },
                                }}
                              >
                                {" "}
                                ME: {setupEntry.ME}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography
                                sx={{
                                  typography: { xs: "caption", sm: "body2" },
                                }}
                              >
                                TE: {setupEntry.TE * 2}
                              </Typography>
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
                          <Typography
                            sx={{ typography: { xs: "caption", sm: "body2" } }}
                          >
                            Runs: {setupEntry.runCount}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={
                            jobTypes.manufacturing === setupEntry.jobType
                              ? 3
                              : 6
                          }
                        >
                          <Typography
                            sx={{ typography: { xs: "caption", sm: "body2" } }}
                          >
                            Jobs: {setupEntry.jobCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography
                            align="center"
                            sx={{ typography: { xs: "caption", sm: "body2" } }}
                          >
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
                            <Typography
                              align="center"
                              sx={{
                                typography: { xs: "caption", sm: "body2" },
                              }}
                            >
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
                          backgroundColor: (theme) =>
                            setupEntry.id === setupToEdit
                              ? theme.palette.primary.main
                              : null,
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
      <Typography
        align="center"
        sx={{
          typography: { xs: "caption", sm: "body2" },
        }}
      >
        {assignedStructureData
          ? assignedStructureData.name
          : "Missing Structure"}
      </Typography>
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
        <Typography
          align="center"
          sx={{ typography: { xs: "caption", sm: "body2" } }}
        >
          {systemTypeData.label}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography
          align="center"
          sx={{ typography: { xs: "caption", sm: "body2" } }}
        >
          {structureTypeData.label}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography
          align="center"
          sx={{ typography: { xs: "caption", sm: "body2" } }}
        >
          {rigTypeData.label}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          align="center"
          sx={{ typography: { xs: "caption", sm: "body2" } }}
        >
          {matchedSystemID}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          align="center"
          sx={{ typography: { xs: "caption", sm: "body2" } }}
        >
          Tax: {setupEntry.taxValue}%
        </Typography>
      </Grid>
    </Grid>
  );
}
