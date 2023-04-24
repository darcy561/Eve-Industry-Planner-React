import { Grid, Paper, Typography } from "@mui/material";
import { useActiveSlotTotals } from "../../../Hooks/GeneralHooks/useActiveSlotTotals";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";

export function ActiveCharacterSlots() {
  const { users } = useContext(UsersContext);
  const { calculateActiveSlotsMultiple } = useActiveSlotTotals();

  const activeCharSlots = calculateActiveSlotsMultiple();

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
        marginLeft: {
          xs: "5px",
          md: "10px",
        },
        marginRight: {
          xs: "5px",
          md: "0px",
        },
      }}
      square
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography
            align="center"
            color="primary"
            sx={{ typography: { xs: "h6", sm: "h5" } }}
          >
            Active Slots
          </Typography>
        </Grid>
        <Grid
          container
          item
          xs={12}
          sx={{
            overflowY: "auto",
            height: { xs: "320px", sm:"220px", md:"320px" },
          }}
        >
          {activeCharSlots.map((char) => {
            const charName = users.find(
              (i) => i.CharacterHash === char.characterHash
            )?.CharacterName;

            if (!charName) return null;
            return (
              <Grid
                key={char.characterHash}
                container
                item
                xs={12}
                sx={{ marginBottom: { xs: "5px" } }}
              >
                <Grid item xs={12}>
                  <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
                    {charName}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    align="center"
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Manufacturing {char.activeManufacturingJobs}/
                    {char.manufacturingSlots}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    align="center"
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Reaction {char.activeReactionSlots}/{char.reactionSlots}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    align="center"
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Science {char.activeScienceSlots}/{char.scienceSlots}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}
