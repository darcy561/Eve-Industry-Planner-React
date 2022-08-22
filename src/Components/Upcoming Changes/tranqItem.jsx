import { CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { EvePricesContext } from "../../Context/EveDataContext";

export function TranqItem({ tranqItem, itemLoad }) {
  const { evePrices } = useContext(EvePricesContext);

  let totalItemCost = 0;

  return (
    <Paper square elevation={2} sx={{ padding: "20px" }}>
      <Grid container>
        {!itemLoad ? (
          tranqItem !== null ? (
            <Grid container item xs={12}>
              <Grid item xs={12} sx={{ marginBottom: "20px" }}>
                <Typography align="center" variant="h6" color="primary">
                  Tranquility
                </Typography>
              </Grid>
              {tranqItem.build.materials.map((material) => {
                let itemCost = evePrices.find(
                  (i) => i.typeID === material.typeID
                );
                if (itemCost !== undefined) {
                  totalItemCost += itemCost.jita.sell * material.quantity;
                }
                return (
                  <Grid key={material.typeID} container item xs={12}>
                    <Grid item xs={2} sm={1}>
                      <img
                        src={`https://images.evetech.net/types/${material.typeID}/icon?size=32`}
                        alt=""
                      />
                    </Grid>
                    <Grid container item xs={10} sm={11}>
                      <Grid
                        item
                        xs={8}
                        alignItems="center"
                        sx={{ display: "flex" }}
                      >
                        <Typography
                          sx={{ typography: { xs: "caption", sm: "body2" } }}
                        >
                          {material.name}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={4}
                        alignItems="center"
                        justifyContent="right"
                        sx={{ display: "flex" }}
                      >
                        <Typography
                          sx={{ typography: { xs: "caption", sm: "body2" } }}
                        >
                          {material.quantity.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                );
              })}
              <Grid container item xs={12} sx={{ marginTop: "30px" }}>
                <Grid item xs={8} alignItems="center" sx={{ display: "flex" }}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Items Produced Per Run:
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={4}
                  alignItems="center"
                  justifyContent="right"
                  sx={{ display: "flex" }}
                >
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    {tranqItem.rawData.products[0].quantity}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                <Grid item xs={8} alignItems="center" sx={{ display: "flex" }}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Total Material Cost (Jita):
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={4}
                  alignItems="center"
                  justifyContent="right"
                  sx={{ display: "flex" }}
                >
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    {totalItemCost.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
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
