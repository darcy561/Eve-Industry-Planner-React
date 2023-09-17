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
import { useContext, useState, useMemo } from "react";
import { structureOptions } from "../../../../../../Context/defaultValues";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { UsersContext } from "../../../../../../Context/AuthContext";
import rawSystemData from "../../../../../../RawData/systems.json";
import { useJobBuild } from "../../../../../../Hooks/useJobBuild";
import { useSetupManagement } from "../../../../../../Hooks/GeneralHooks/useSetupManagement";
import { SystemIndexContext } from "../../../../../../Context/EveDataContext";

const customStructureMap = {
  [jobTypes.manufacturing]: "manufacturing",
  [jobTypes.reaction]: "reaction",
};
const jobTypeMapping = {
  [jobTypes.manufacturing]: "manufacturing",
  [jobTypes.reaction]: "reaction",
};

export function JobSetupCard({
  setupEntry,
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { users } = useContext(UsersContext);
  const assignedCharacterName =
    users.find((i) => i.CharacterHash === setupEntry.selectedCharacter)
      ?.CharacterName || "No Matching Character Found";

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
                      align="center"
                    >
                      ME: {setupEntry.ME}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                      align="center"
                    >
                      TE: {setupEntry.TE * 2}
                    </Typography>
                  </Grid>
                </>
              )}
              <Grid
                item
                xs={jobTypes.manufacturing === setupEntry.jobType ? 3 : 6}
                align="center"
              >
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Runs: {setupEntry.runCount}
                </Typography>
              </Grid>
              <Grid
                item
                xs={jobTypes.manufacturing === setupEntry.jobType ? 3 : 6}
                align="center"
              >
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
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
                      setupEntry.estimatedInstallCost * setupEntry.jobCount
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
                    ? theme.palette[jobTypeMapping[setupEntry.jobType]].main
                    : null,
              }}
            />
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

function UseCustomStructure({ setupEntry }) {
  const { users } = useContext(UsersContext);
  const { systemIndexData } = useContext(SystemIndexContext);

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const assignedStructureData =
    parentUser.settings.structures[customStructureMap[setupEntry.jobType]].find(
      (i) => i.id === setupEntry.customStructureID
    ) || null;

  const systemIndexValue =
    systemIndexData[setupEntry.systemID]?.[
      jobTypeMapping[setupEntry.jobType]
    ] || 0;

  return (
    <Grid item xs={12}>
      <Tooltip title={`System Index: ${systemIndexValue *100}%`} arrow placement="bottom">
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
      </Tooltip>
    </Grid>
  );
}

function UseDefaultStructures({ setupEntry }) {
  const { systemIndexData } = useContext(SystemIndexContext);

  const jobTypeMapping = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };
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

  const systemIndexValue =
    systemIndexData[setupEntry.systemID]?.[
      jobTypeMapping[setupEntry.jobType]
    ] || 0;


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
      <Tooltip
        title={`System Index Value: ${systemIndexValue * 100}%`}
        arrow
        placement="bottom"
      >
        <Grid item xs={12}>
          <Typography
            align="center"
            sx={{ typography: { xs: "caption", sm: "body2" } }}
          >
            {matchedSystemID}
          </Typography>
        </Grid>
      </Tooltip>
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
