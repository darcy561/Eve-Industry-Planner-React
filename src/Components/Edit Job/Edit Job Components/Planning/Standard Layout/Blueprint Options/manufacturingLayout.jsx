import { useContext, useEffect, useState } from "react";
import { Avatar, Badge, Grid, Paper, Tooltip, Typography } from "@mui/material";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../../../../../Context/EveDataContext";
import { useBlueprintCalc } from "../../../../../../Hooks/useBlueprintCalc";
import { ApiJobsContext } from "../../../../../../Context/JobContext";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { red, yellow } from "@mui/material/colors";

const inUse = yellow[800];
const expiring = red[600];

export function ManufacturingLayout_BlueprintPanel({
  activeJob,
  updateActiveJob,
  setJobModified,
}) {
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { esiBlueprints } = useContext(PersonalESIDataContext);
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const [blueprintOptions, updateBlueprintOptions] = useState([]);
  const [esiJobSelection, updateESIJobSelection] = useState([]);
  const { CalculateResources_New, CalculateTime_New } = useBlueprintCalc();

  let totalBPOCount = 0;
  let totalBPCCount = 0;

  useEffect(() => {
    const combinedBlueprints = [
      ...esiBlueprints.flatMap((entry) => entry?.data ?? []),
      ...corpEsiBlueprints.flatMap((entry) => entry?.data ?? []),
    ];

    let filteredBlueprints = combinedBlueprints.filter(
      (i) => i.type_id === activeJob.blueprintTypeID
    );

    const uniqueBlueprintIds = new Set();
    filteredBlueprints = filteredBlueprints.filter((item) => {
      if (uniqueBlueprintIds.has(item.item_id)) {
        return false;
      }
      uniqueBlueprintIds.add(item.item_id);
      return true;
    });

    filteredBlueprints.sort(
      (a, b) =>
        a.quantity.toString().localeCompare(b.quantity.toString()) ||
        b.material_efficiency - a.material_efficiency ||
        b.time_efficiency - a.time_efficiency
    );
    updateBlueprintOptions(filteredBlueprints);
  }, [esiBlueprints, corpEsiBlueprints]);

  useEffect(() => {
    const selection = apiJobs.filter(
      (i) => i.blueprint_type_id === activeJob.blueprintTypeID
    );
    updateESIJobSelection(selection);
  }, [apiJobs]);

  if (blueprintOptions.length === 0) {
    return (
      <Grid item xs={12} align="center">
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          No Blueprints Found
        </Typography>
      </Grid>
    );
  }
  return (
    <Grid
      container
      item
      xs={12}
      spacing={2}
      sx={{
        maxHeight: { xs: "370px", sm: "220px", md: "370px" },
        overflowY: "auto",
      }}
    >
      {blueprintOptions.map((print) => {
        const esiJob = esiJobSelection.find(
          (i) => i.blueprint_id === print.item_id && i.status === "active"
        );
        const blueprintOwner = users.find(
          (i) => i.CharacterHash === print.CharacterHash
        );

        const blueprintType = print.quantity === -2 ? "copy" : "original";

        const blueprintTypeUrl = print.quantity === -2 ? "bpc" : "bp";
        return (
          <Tooltip
            key={print.item_id}
            title="Click To Use Blueprint"
            arrow
            placement="top"
          >
            <Grid container item xs={6} md={4}>
              <Grid item align="center" xs={12}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  badgeContent={
                    <Avatar
                      src={
                        print.isCorp
                          ? `https://images.evetech.net/corporations/${print.corporation_id}/logo`
                          : `https://images.evetech.net/characters/${blueprintOwner.CharacterID}/portrait`
                      }
                      variant="circular"
                      sx={{
                        height: "18px",
                        width: "18px",
                      }}
                    />
                  }
                >
                  <picture>
                    <source
                      media="(max-width:700px)"
                      srcSet={`https://images.evetech.net/types/${print.type_id}/${blueprintTypeUrl}?size=32`}
                    />
                    <img
                      src={`https://images.evetech.net/types/${print.type_id}/${blueprintTypeUrl}?size=64`}
                      alt=""
                    />
                  </picture>
                </Badge>
              </Grid>
              <Grid container item xs={12} align="center">
                <Grid item xs={6}>
                  <Typography variant="caption" align="center">
                    ME:{print.material_efficiency}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" align="center">
                    TE:{print.time_efficiency}
                  </Typography>
                </Grid>
                {blueprintType === "copy" ? (
                  <Grid item xs={12}>
                    {esiJob ? (
                      <Tooltip
                        title="Runs available after current job completes. (Runs before starting current job)"
                        arrow
                        placement="top"
                      >
                        <Typography variant="caption">
                          Runs: {print.runs - esiJob.runs} (
                          {print.runs.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                          )
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption">
                        Runs: {print.runs}
                      </Typography>
                    )}
                  </Grid>
                ) : null}
                <Grid
                  item
                  xs={12}
                  sx={{
                    height: "3px",
                    backgroundColor: activityStyleSelector(
                      blueprintType,
                      esiJob,
                      print.runs
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Tooltip>
        );
      })}
      <Grid container item xs={12} sx={{ marginTop: "20px" }}>
        <Grid item xs={6}>
          <Typography
            align="center"
            sx={{
              typography: { xs: "caption", sm: "body2" },
              backgroundColor: inUse,
              color: "black",
            }}
          >
            Blueprint In Use
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography
            align="center"
            sx={{
              typography: { xs: "caption", sm: "body2" },
              backgroundColor: expiring,
              color: "black",
            }}
          >
            Blueprint Finishing
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}

function activityStyleSelector(blueprintType, esiJob, blueprintRuns) {
  const noAction = null;

  if (blueprintType === "original") {
    if (esiJob) {
      return inUse;
    } else {
      return noAction;
    }
  }
  if (blueprintType === "copy") {
    if (esiJob && blueprintRuns <= esiJob.runs) {
      return expiring;
    } else if (esiJob) {
      return inUse;
    } else {
      return noAction;
    }
  }
  return noAction;
}
