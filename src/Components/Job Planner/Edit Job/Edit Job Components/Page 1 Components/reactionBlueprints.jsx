import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { Grid, Paper, Typography } from "@mui/material";

export function ReactionBlueprints() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);

  let blueprintOptions = [];
  users.forEach((user) => {
    let temp = user.apiBlueprints.filter(
      (i) => i.type_id === activeJob.blueprintTypeID
    );
    temp.forEach((i) => {
      blueprintOptions.push(i);
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
          <Grid container item xs={12}>
            <Grid item xs={4}>
              <img
                src={`https://images.evetech.net/types/${activeJob.blueprintTypeID}/bp?size=64`}
                alt=""
              />
            </Grid>
            <Grid item xs={8}>
              <Typography>x {blueprintOptions.length}</Typography>
            </Grid>
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
