import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { Grid, Paper, Typography } from "@mui/material";

export function ManufacturingBlueprints() {
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
          <Grid
            container
            item
            xs={12}
            sx={{
              maxHeight: { xs: "370px", sm: "220px", md: "370px" },
              overflowY: "auto",
            }}
          >
            {blueprintOptions.map((print) => {
              if (print.quantity === -2) {
                return (
                  <Grid
                    key={print.item_id}
                    container
                    item
                    xs={12}
                    sm={4}
                    md={12}
                    xl={6}
                    sx={{ marginBottom: "5px" }}
                  >
                    <Grid item xs={4}>
                      <img
                        src={`https://images.evetech.net/types/${print.type_id}/bpc?size=64`}
                        alt=""
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={8}
                      sx={{
                        paddingLeft: {
                          xs: "0px",
                          sm: "5px",
                          md: "5px",
                          lg: "0px",
                          xl: "5px",
                        },
                      }}
                    >
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          ME: {print.material_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          TE: {print.time_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          Runs:{" "}
                          {print.runs.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                );
              } else {
                return (
                  <Grid
                    key={print.item_id}
                    container
                    item
                    xs={12}
                    sm={4}
                    md={12}
                    xl={6}
                    sx={{ marginBottom: "5px" }}
                  >
                    <Grid item xs={4}>
                      <img
                        src={`https://images.evetech.net/types/${print.type_id}/bp?size=64`}
                        alt=""
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={8}
                      sx={{
                        paddingLeft: {
                          xs: "0px",
                          sm: "5px",
                          md: "5px",
                          lg: "0px",
                          xl: "5px",
                        },
                      }}
                    >
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          ME: {print.material_efficiency}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          TE: {print.time_efficiency}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                );
              }
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
