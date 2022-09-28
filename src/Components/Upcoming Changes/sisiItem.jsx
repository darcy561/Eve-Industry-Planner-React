import { CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { EvePricesContext } from "../../Context/EveDataContext";

export function SisiItem({ sisiItem, itemLoad, tranqItem }) {
  const { evePrices } = useContext(EvePricesContext);

  let totalItemCost = 0;

  function textColorCalc(sisiQuantity, tranqQuantity) {
    if (sisiQuantity === undefined || tranqQuantity === undefined) {
      return null;
    }
    if (sisiQuantity.quantity > tranqQuantity.quantity) {
      return "error.main";
    }
    if (sisiQuantity.quantity < tranqQuantity.quantity) {
      return "success.main";
    }
    return null;
  }

  function percentageDifferenceCalc(sisiQuantity, tranqQuantity) {
    if (
      sisiQuantity === undefined ||
      sisiQuantity === "missing" ||
      tranqQuantity === undefined ||
      tranqQuantity === "missing"
    ) {
      return null;
    }
    let returnValue = (
      ((sisiQuantity.quantity - tranqQuantity.quantity) /
        sisiQuantity.quantity) *
      100
    ).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (returnValue > 0) {
      return `+${returnValue}%`;
    }
    if (returnValue < 0) {
      return `${returnValue}%`;
    }
    return null;
  }

  return (
    <Paper square elevation={2} sx={{ padding: "20px" }}>
      <Grid container>
        {itemLoad && (
          <Grid item xs={12} align="center">
            <CircularProgress color="primary" />
          </Grid>
        )}
        {sisiItem === "missing" && !itemLoad ? (
          <Grid item xs={12}>
            <Typography>Item Not Present</Typography>
          </Grid>
        ) : null}
        {sisiItem !== null && sisiItem !== "missing" && !itemLoad ? (
          <Grid item xs={12}>
            <Grid item xs={12} sx={{ marginBottom: "20px" }}>
              <Typography align="center" variant="h6" color="primary">
                Singularity
              </Typography>
            </Grid>
            {sisiItem.build.materials.map((material) => {
              let itemCost = evePrices.find(
                (i) => i.typeID === material.typeID
              );

              let tranqData = undefined;
              if (tranqItem !== null && tranqItem !== "missing") {
                tranqData = tranqItem.build.materials.find(
                  (i) => i.typeID === material.typeID
                );
              }
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
                      xs={7}
                      sm={8}
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
                      xs={3}
                      alignItems="center"
                      justifyContent="right"
                      sx={{ display: "flex" }}
                    >
                      <Typography
                        sx={{
                          typography: { xs: "caption", sm: "body2" },
                          color: textColorCalc(material, tranqData),
                        }}
                      >
                        {material.quantity.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      sm={1}
                      alignItems="center"
                      justifyContent="right"
                      sx={{ display: "flex" }}
                    >
                      <Typography
                        sx={{
                          typography: { xs: "caption", sm: "body2" },
                          color: textColorCalc(material, tranqData),
                        }}
                      >
                        {percentageDifferenceCalc(material, tranqData)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              );
            })}
            <Grid container item xs={12} sx={{ marginTop: "30px" }}>
              <Grid item xs={8} alignItems="center" sx={{ display: "flex" }}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
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
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  {sisiItem.rawData.products[0].quantity}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: "10px" }}>
              <Grid item xs={8} alignItems="center" sx={{ display: "flex" }}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Material Cost (Jita Sell Orders):
                </Typography>
              </Grid>
              <Grid
                item
                xs={4}
                alignItems="center"
                justifyContent="right"
                sx={{ display: "flex" }}
              >
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  {totalItemCost.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        ) : null}
        {!itemLoad && sisiItem === null ? (
          <Grid item xs={12}>
            <Typography>Select Item To Begin</Typography>
          </Grid>
        ) : null}
      </Grid>
    </Paper>
  );
}
