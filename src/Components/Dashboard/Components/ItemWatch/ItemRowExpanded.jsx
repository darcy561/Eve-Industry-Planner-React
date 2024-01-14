import { useContext, useMemo } from "react";
import { Grid, Typography } from "@mui/material";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import { useInstallCostsCalc } from "../../../../Hooks/GeneralHooks/useInstallCostCalc";

export function ExpandedWatchlistRow({ mat, parentUser }) {
  const { evePrices } = useContext(EvePricesContext);
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  const matPrice = useMemo(
    () => evePrices.find((i) => i.typeID === mat.typeID),
    [evePrices]
  );
  const matBuildPrice = useMemo(() => {
    let buildPrice = calculateInstallCostFromJob(mat?.buildData);
    mat.materials.forEach((x) => {
      let matBuildCalc = 0;
      let xPrice = evePrices.find((i) => i.typeID === x.typeID);
      matBuildCalc +=
        (xPrice[parentUser.settings.editJob.defaultMarket][
          parentUser.settings.editJob.defaultOrders
        ] *
          x.quantity) /
        mat.quantityProduced;
      buildPrice += matBuildCalc * mat.quantity;
    });
    return buildPrice / mat.quantity;
  }, [evePrices]);

  return (
    <Grid container item xs={6} lg={2}>
      <Grid item xs={12} align="center">
        <img
          src={`https://images.evetech.net/types/${mat.typeID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid item xs={12}>
        <Typography
          align="center"
          sx={{
            typography: { xs: "caption", sm: "body2" },
          }}
        >
          {mat.name}
        </Typography>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Typography
          align="center"
          sx={{
            typography: { xs: "caption", sm: "body2" },
          }}
        >
          Sell Price
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        lg={8}
        sx={{
          color:
            mat.materials.length > 0
              ? matBuildPrice <
                matPrice[parentUser.settings.editJob.defaultMarket].sell
                ? "error.main"
                : "success.main"
              : "none",
        }}
      >
        <Typography
          align="center"
          sx={{
            typography: { xs: "caption", sm: "body2" },
          }}
        >
          {matPrice[
            parentUser.settings.editJob.defaultMarket
          ].sell.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
      <Grid container item xs={12}>
        {mat.materials.length > 0 && (
          <>
            <Grid item xs={12} lg={4}>
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                Build Price
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              lg={8}
              sx={{
                color:
                  matBuildPrice >
                  matPrice[parentUser.settings.editJob.defaultMarket].sell
                    ? "error.main"
                    : "success.main",
              }}
            >
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                {matBuildPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  );
}
