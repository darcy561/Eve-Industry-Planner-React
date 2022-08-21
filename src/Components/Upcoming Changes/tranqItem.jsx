import { CircularProgress, Grid, Paper, Typography } from "@mui/material";

export function TranqItem({ tranqItem, pageLoad }) {
  return (
    <Paper square elevation={2} sx={{ padding: "20px" }}>
      <Grid container>
        {!pageLoad ? (
          tranqItem !== null ? (
            <Grid container item xs={12}>
              {tranqItem.build.materials.map((material) => {
                return (
                  <Grid key={material.typeID} container item xs={12}>
                    <Grid item xs={2} sm={1}>
                      <img
                        src={`https://images.evetech.net/types/${material.typeID}/icon?size=32`}
                        alt=""
                      />
                    </Grid>
                    <Grid container item xs={10} sm={11}>
                      <Grid item xs={8}>
                        <Typography>{material.name}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography align="right">
                          {material.quantity.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Typography>Select Item To Begin</Typography>
            </Grid>
          )
        ) : (
          <Grid item xs={12} align="center">
            <CircularProgress color="primary" />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
