import { useState } from "react";
import { Avatar, Badge, Icon, Tooltip, Typography, Grid } from "@mui/material";

import InfoIcon from "@mui/icons-material/Info";
import { jobTypes } from "../../../Context/defaultValues";
import { ActiveBPPopout } from "../ActiveBPPout";
import { BLUEPRINT_OWNER } from "../../../Functions/Blueprints/buildBlueprintRows";
import useUsersStore from "../../../Zustand/usersStore";

const inUse = {
  backgroundColor: "#ffc107",
  color: "black",
};
const expiring = {
  backgroundColor: "#d32f2f",
  color: "black",
};

function styleBlueprintEntry(job, bpType, bpRuns) {
  if (bpType === "bpc") {
    if (job && bpRuns <= job.runs) {
      return expiring;
    } else if (job) {
      return inUse;
    } else {
      return null;
    }
  } else {
    if (job) {
      return inUse;
    } else {
      return null;
    }
  }
}

export function BlueprintEntry({ blueprint, esiJobs, bpData }) {
  const [displayPopover, updateDisplayPopover] = useState(null);

  const blueprintType = blueprint.isCopy ? "bpc" : "bp";

  const esiJob = esiJobs.find(
    (i) => i.blueprint_id === blueprint.itemId && i.status === "active"
  );
  const bpOwner = useUsersStore
    .getState()
    .account.actions.findCharacterByHash(blueprint.ownerId);

  const isCorporationOwned =
    blueprint.ownerType === BLUEPRINT_OWNER.CORPORATION;
  const corpOwner = isCorporationOwned
    ? useUsersStore
        .getState()
        .account.actions.getCorporation(blueprint.ownerId)
    : null;

  return (
    <Grid
      container
      align="center"
      sx={{ marginBottom: "10px" }}
      size={{
        xs: 3,
        sm: 3,
        md: 2
      }}>
      <Tooltip
        title={
          isCorporationOwned
            ? corpOwner?.corporationName || "unknown"
            : bpOwner?.CharacterName || "unknown"
        }
        arrow
        placement="top"
      >
        <Grid size={12}>
          <Grid size={12}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              badgeContent={
                <Avatar
                  src={
                    isCorporationOwned && blueprint.ownerId
                      ? `https://images.evetech.net/corporations/${blueprint.ownerId}/logo`
                      : bpOwner?.CharacterID
                      ? `https://images.evetech.net/characters/${bpOwner.CharacterID}/portrait`
                      : undefined
                  }
                  alt={
                    isCorporationOwned
                      ? "Corp Logo"
                      : bpOwner?.CharacterName || "Unknown"
                  }
                  variant="circular"
                  sx={{
                    height: { xs: "24px", md: "24px", lg: "32px" },
                    width: { xs: "24px", md: "24px", lg: "32px" },
                  }}
                />
              }
            >
              <picture>
                <img
                  src={`https://images.evetech.net/types/${blueprint.typeId}/${blueprintType}?size=64`}
                  alt=""
                />
              </picture>
            </Badge>
          </Grid>
          <Grid
            sx={{
              height: "3px",
              marginLeft: "5px",
              marginRight: "5px",
              ...styleBlueprintEntry(esiJob, blueprintType, blueprint.runs),
            }}
            size={12} />
          {bpData?.jobType === jobTypes.manufacturing && (
            <>
              <Grid size={12}>
                <Typography variant="caption">
                  M.E: {blueprint.me}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="caption">
                  T.E: {blueprint.te}
                </Typography>
              </Grid>
              {blueprint.runs !== -1 && (
                <Grid size={12}>
                  <Typography variant="caption">
                    Runs: {blueprint.runs}
                  </Typography>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Tooltip>
      {esiJob && (
        <Grid size={12}>
          <Tooltip title="Click to View ESI Job Info" arrow placement="bottom">
            <Icon
              aria-haspopup="true"
              color="primary"
              onClick={(event) => {
                updateDisplayPopover(event.currentTarget);
              }}
            >
              <InfoIcon fontSize="small" />
            </Icon>
          </Tooltip>
          <ActiveBPPopout
            blueprint={blueprint}
            esiJob={esiJob}
            displayPopover={displayPopover}
            updateDisplayPopover={updateDisplayPopover}
          />
        </Grid>
      )}
    </Grid>
  );
}
