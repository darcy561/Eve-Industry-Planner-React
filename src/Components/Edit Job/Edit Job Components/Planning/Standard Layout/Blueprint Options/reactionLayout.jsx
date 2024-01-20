import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { ApiJobsContext } from "../../../../../../Context/JobContext";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../../../../../Context/EveDataContext";
import { Avatar, Badge, Grid, Typography } from "@mui/material";

export function ReactionLayout_BlueprintOptions({ activeJob }) {
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { esiBlueprints } = useContext(PersonalESIDataContext);
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const [blueprintOptions, updateBlueprintOptions] = useState([]);
  const [esiJobSelection, updateESIJobSelection] = useState([]);

  useEffect(() => {
    const userBlueprints = [];
    const corpBlueprints = [];

    // Process user blueprints
    users.forEach((user) => {
      const userData = esiBlueprints.find(
        (i) => i.user === user.CharacterHash
      )?.data;
      if (userData) {
        const temp = userData.filter(
          (i) => i.type_id === activeJob.blueprintTypeID
        );
        temp.forEach((i) => {
          i.owner_id = user.CharacterID;
        });
        userBlueprints.push({
          ownerID: user.CharacterID,
          blueprints: temp,
          totalBP: temp.reduce(
            (total, i) => (i.quantity > 0 ? total + i.quantity : total + 1),
            0
          ),
          inUse: esiJobSelection.filter(
            (job) =>
              temp.some((i) => i.item_id === job.blueprint_id) &&
              job.status === "active"
          ).length,
          isCorp: false,
        });
      }
    });

    // Process corporation blueprints
    corpEsiBlueprints.forEach((corpBlueprint) => {
      const existingCorp = corpBlueprints.find(
        (corp) => corp.corporation_id === corp.corporation_id
      );
      if (existingCorp) {
        existingCorp.blueprints = [
          ...existingCorp.blueprints,
          ...corpBlueprint.data.filter(
            (i) => i.type_id === activeJob.blueprintTypeID
          ),
        ];
        existingCorp.totalBP +
          existingCorp.blueprints.reduce(
            (total, i) => (i.quantity > 0 ? total + i.quantity : total + 1),
            0
          );
        existingCorp.inUse += esiJobSelection.filter(
          (job) =>
            corpBlueprint.data.some((i) => i.item_id === job.blueprint_id) &&
            job.status === "active"
        ).length;
      } else {
        const temp = corpBlueprint.data.filter(
          (i) => i.type_id === activeJob.blueprintTypeID
        );

        corpBlueprints.push({
          corporation_id: temp[0]?.corporation_id,
          blueprints: temp,
          totalBP: temp.reduce(
            (total, i) => (i.quantity >= 0 ? total + i.quantity : total + 1),
            0
          ),
          inUse: esiJobSelection.filter(
            (job) =>
              temp.some((i) => i.item_id === job.blueprint_id) &&
              job.status === "active"
          ).length,
          isCorp: true,
        });
      }
    });

    // Combine and sort blueprints
    const combinedBlueprints = [...userBlueprints, ...corpBlueprints];
    const filteredBlueprints = combinedBlueprints.filter(
      (i) => i.blueprints.length > 0
    );

    filteredBlueprints.sort(
      (a, b) =>
        b.blueprints[0].material_efficiency -
          a.blueprints[0].material_efficiency ||
        b.blueprints[0].time_efficiency - a.blueprints[0].time_efficiency
    );

    updateBlueprintOptions(filteredBlueprints);
  }, [esiBlueprints, corpEsiBlueprints, esiJobSelection]);

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
    <Grid container item alignItems="center" xs={12}>
      {blueprintOptions.map((charBP) => {
        if (charBP.blueprints.length === 0) return null;

        return (
          <Grid
            key={charBP.isCorp ? charBP.corporation_id : charBP.ownerID}
            container
            item
            xs={6}
            sm={6}
            md={12}
          >
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              item
              xs={4}
              sm={4}
              md={5}
              lg={3}
              xl={3}
              align="center"
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                badgeContent={
                  <Avatar
                    src={
                      charBP.isCorp
                        ? `https://images.evetech.net/corporations/${charBP.corporation_id}/logo`
                        : `https://images.evetech.net/characters/${charBP.ownerID}/portrait`
                    }
                    variant="circular"
                    sx={{
                      height: "24px",
                      width: "24px",
                    }}
                  />
                }
              >
                <picture>
                  <source
                    media="(max-width:700px)"
                    srcSet={`https://images.evetech.net/types/${activeJob.blueprintTypeID}/bpc?size=32`}
                  />
                  <img
                    src={`https://images.evetech.net/types/${activeJob.blueprintTypeID}/bpc?size=64`}
                    alt=""
                  />
                </picture>
              </Badge>
            </Grid>
            <Grid container item xs={8} sm={8} md={7} lg={9} xl={9}>
              <Grid item xs={12}>
                <Typography variant="caption">
                  Total: {charBP.totalBP}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption">
                  In Use: {charBP.inUse}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}
