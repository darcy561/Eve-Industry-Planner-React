import { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { Avatar, Badge, Grid, Paper, Typography } from "@mui/material";

export function ReactionBlueprints() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);

  let blueprintOptions = [];
  let esiJobSelection = apiJobs.filter(
    (i) => i.blueprint_type_id === activeJob.blueprintTypeID
  );
  users.forEach((user) => {
    let inUseCount = 0;
    let totalBP = 0;
    let temp = JSON.parse(
      sessionStorage.getItem(`esiBlueprints_${user.CharacterHash}`)
    ).filter((i) => i.type_id === activeJob.blueprintTypeID);
    temp.forEach((i) => {
      i.owner_id = user.CharacterID;
      if (
        esiJobSelection.some(
          (job) => job.blueprint_id === i.item_id && job.status === "active"
        )
      ) {
        inUseCount++;
      }
      if (i.quantity > 0) {
        totalBP += i.quantity;
      } else {
        totalBP++;
      }
    });
    blueprintOptions.push({
      owner: user.CharacterID,
      blueprints: temp,
      totalBP: totalBP,
      inUse: inUseCount,
    });
  });
  blueprintOptions.sort(
    (a, b) =>
      b.material_efficiency - a.material_efficiency ||
      b.time_efficiency - a.time_efficiency
  );

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" align="center" color="primary">
            Blueprint Library
          </Typography>
        </Grid>
        {blueprintOptions.length > 0 ? (
          <Grid container item alignItems="center" xs={12}>
            {blueprintOptions.map((charBP) => {
              if (charBP.blueprints.length > 0) {
                return (
                  <Grid key={charBP.owner} container item xs={6} sm={6} md={12}>
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
                            src={`https://images.evetech.net/characters/${charBP.owner}/portrait`}
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
              } else return null;
            })}
          </Grid>
        ) : (
          <Grid item xs={12} align="center">
            <Typography>No Blueprints Found</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
