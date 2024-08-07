import { useContext } from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  jobTypeMapping,
  STANDARD_TEXT_FORMAT,
  structureOptions,
  TWO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { UsersContext } from "../../../../../../Context/AuthContext";
import rawSystemData from "../../../../../../RawData/systems.json";
import { SystemIndexContext } from "../../../../../../Context/EveDataContext";
import { ApplicationSettingsContext } from "../../../../../../Context/LayoutContext";
import Job from "../../../../../../Classes/jobConstructor";

export function JobSetupCard({ setupEntry, activeJob, updateActiveJob }) {
  const { users } = useContext(UsersContext);
  const assignedCharacterName =
    users.find((i) => i.CharacterHash === setupEntry.selectedCharacter)
      ?.CharacterName || "No Matching Character Found";

  return (
    <Grid container item xs={6} sm={4}>
      <Card elevation={3} square sx={{ minWidth: "100%" }}>
        <CardActionArea
          onClick={() => {
            activeJob.layout.setupToEdit = setupEntry.id;

            updateActiveJob((prev) => new Job(prev));
          }}
        >
          <CardContent>
            <Grid container item xs={12}>
              {jobTypes.manufacturing === setupEntry.jobType && (
                <>
                  <Grid item xs={3}>
                    <Typography
                      sx={{
                        typography: STANDARD_TEXT_FORMAT,
                      }}
                      align="center"
                    >
                      ME: {setupEntry.ME}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography
                      sx={{
                        typography: STANDARD_TEXT_FORMAT,
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
                <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                  Runs: {setupEntry.runCount}
                </Typography>
              </Grid>
              <Grid
                item
                xs={jobTypes.manufacturing === setupEntry.jobType ? 3 : 6}
                align="center"
              >
                <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                  Jobs: {setupEntry.jobCount}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  align="center"
                  sx={{ typography: STANDARD_TEXT_FORMAT }}
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
                  TWO_DECIMAL_PLACES
                )}`}
                arrow
                placement="bottom"
              >
                <Grid item xs={12}>
                  <Typography
                    align="center"
                    sx={{
                      typography: STANDARD_TEXT_FORMAT,
                    }}
                  >
                    Est Total Install Costs:{" "}
                    {(
                      setupEntry.estimatedInstallCost * setupEntry.jobCount
                    ).toLocaleString(undefined, TWO_DECIMAL_PLACES)}
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
                  setupEntry.id === activeJob.layout.setupToEdit
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
  const { systemIndexData } = useContext(SystemIndexContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);

  const assignedStructureData = applicationSettings.getCustomStructureWithID(
    setupEntry.customStructureID
  );

  const systemIndexValue =
    systemIndexData[setupEntry.systemID]?.[
      jobTypeMapping[setupEntry.jobType]
    ] || 0;

  return (
    <Grid item xs={12}>
      <Tooltip
        title={`System Index: ${systemIndexValue * 100}%`}
        arrow
        placement="bottom"
      >
        <Typography
          align="center"
          sx={{
            typography: STANDARD_TEXT_FORMAT,
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
        <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {systemTypeData.label}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {structureTypeData.label}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {rigTypeData.label}
        </Typography>
      </Grid>
      <Tooltip
        title={`System Index Value: ${systemIndexValue * 100}%`}
        arrow
        placement="bottom"
      >
        <Grid item xs={12}>
          <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
            {matchedSystemID}
          </Typography>
        </Grid>
      </Tooltip>
      <Grid item xs={12}>
        <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
          Tax: {setupEntry.taxValue}%
        </Typography>
      </Grid>
    </Grid>
  );
}
