import { useContext, useState } from "react";
import { Avatar, Badge, Grid, Icon, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { jobTypes } from "../../../Context/defaultValues";
import { makeStyles } from "@mui/styles";
import { ActiveBPPopout } from "../ActiveBPPout";
import { UsersContext } from "../../../Context/AuthContext";
import { CorpEsiDataContext } from "../../../Context/EveDataContext";

const useStyles = makeStyles((theme) => ({
  inUse: {
    backgroundColor: "#ffc107",
    color: "black",
  },
  expiring: {
    backgroundColor: "#d32f2f",
    color: "black",
  },
}));

export function BlueprintEntry({ blueprint, esiJobs, bpData }) {
  const classes = useStyles();
  const { users } = useContext(UsersContext);
  const { esiCorpData } = useContext(CorpEsiDataContext);
  const [displayPopover, updateDisplayPopover] = useState(null);

  const blueprintType = blueprint.quantity === -2 ? "bpc" : "bp";

  const esiJob = esiJobs.find(
    (i) => i.blueprint_id === blueprint.item_id && i.status === "active"
  );
  const bpOwner = users.find(
    (u) => u.CharacterHash === blueprint.CharacterHash
  );
  const corpOwner = esiCorpData.find(
    (i) => i.corporation_id === blueprint?.corporation_id
  );

  return (
    <Grid
      key={blueprint.item_id}
      container
      item
      xs={3}
      sm={3}
      md={2}
      align="center"
      sx={{ marginBottom: "10px" }}
    >
      <Tooltip
        title={blueprint.isCorp ? corpOwner.name : bpOwner.CharacterName}
        arrow
        placement="top"
      >
        <Grid item xs={12}>
          <Grid item xs={12}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              badgeContent={
                <Avatar
                  src={
                    blueprint.isCorp
                      ? `https://images.evetech.net/corporations/${blueprint.corporation_id}/logo`
                      : `https://images.evetech.net/characters/${bpOwner.CharacterID}/portrait`
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
                  src={`https://images.evetech.net/types/${blueprint.type_id}/${blueprintType}?size=64`}
                  alt=""
                />
              </picture>
            </Badge>
          </Grid>
          <Grid
            className={
              blueprintType === "bpc"
                ? esiJob && blueprint.runs <= esiJob.runs
                  ? classes.expiring
                  : esiJob
                  ? classes.inUse
                  : "none"
                : esiJob
                ? classes.inUse
                : "none"
            }
            item
            xs={12}
            sx={{
              height: "3px",
              marginLeft: "5px",
              marginRight: "5px",
            }}
          />
          {bpData.jobType === jobTypes.manufacturing && (
            <>
              <Grid item xs={12}>
                <Typography variant="caption">
                  M.E: {blueprint.material_efficiency}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption">
                  T.E: {blueprint.time_efficiency}
                </Typography>
              </Grid>
              {blueprint.runs !== -1 && (
                <Grid item xs={12}>
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
        <Grid item xs={12}>
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
