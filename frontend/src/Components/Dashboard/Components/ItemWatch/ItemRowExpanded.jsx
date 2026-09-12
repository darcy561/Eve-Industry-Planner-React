import { useMemo } from "react";
import {
  PRICING_SIDE,
  resolvePricingSide,
} from "../../../../Functions/MarketData/pricingSide.js";
import { Typography, Grid } from "@mui/material";

import useUsersStore from "../../../../Zustand/usersStore";
import MaterialPopoverIconButtons from "../../../../Styled Components/Popover/iconButtons";
import { formatNumberForLocale } from "../../../../Functions/Helper/numberParser";
import { calculateInstallCostfromSetup } from "../../../../Functions/Installation Costs/installCosts";

export function ExpandedWatchlistRow({ mat }) {
  // The material's own materials are bought; the material itself is compared
  // against what it would fetch, so the row reads both sides.
  const accountPricing = useUsersStore(
    (state) => state.applicationSettings.defaultPricing,
  );
  const buying = resolvePricingSide({
    accountPricing,
    side: PRICING_SIDE.BUYING,
  });
  // Only the market: the row states what the material would fetch listed, so the
  // sell price is the figure it wants whatever basis the account prices on.
  const { marketDisplay: sellingMarket } = resolvePricingSide({
    accountPricing,
    side: PRICING_SIDE.SELLING,
  });
  const { findMarketData } = useUsersStore.getState().worldData.actions;
  const marketData = useUsersStore((state) => state.worldData.marketData);

  const matWorth = findMarketData(mat.typeID)?.[sellingMarket]?.sell ?? 0;
  const matBuildPrice = useMemo(() => {
    let buildPrice = calculateInstallCostfromSetup(mat?.buildData);
    mat.materials.forEach((x) => {
      let matBuildCalc = 0;
      let xPrice = findMarketData(x.typeID);
      matBuildCalc +=
        ((xPrice?.[buying.marketDisplay]?.[buying.orderDisplay] ?? 0) *
          x.quantity) /
        mat.quantityProduced;
      buildPrice += matBuildCalc * mat.quantity;
    });
    return buildPrice / mat.quantity;
  }, [marketData, buying.marketDisplay, buying.orderDisplay]);

  return (
    <Grid
      container
      size={{
        xs: 6,
        lg: 2,
      }}
    >
      <Grid align="center" size={12}>
        <img
          src={`https://images.evetech.net/types/${mat.typeID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid align="center" size={12}>
        <MaterialPopoverIconButtons typeID={mat.typeID}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {mat.name}
          </Typography>
        </MaterialPopoverIconButtons>
      </Grid>
      <Grid
        size={{
          xs: 12,
          lg: 4,
        }}
      >
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
        sx={{
          color:
            mat.materials.length > 0
              ? matBuildPrice < matWorth
                ? "error.main"
                : "success.main"
              : "none",
        }}
        size={{
          xs: 12,
          lg: 8,
        }}
      >
        <Typography
          sx={{ typography: { xs: "caption", sm: "body2" } }}
          align="center"
        >
          {formatNumberForLocale(matWorth)}
        </Typography>
      </Grid>
      <Grid container size={12}>
        {mat.materials.length > 0 && (
          <>
            <Grid
              size={{
                xs: 12,
                lg: 4,
              }}
            >
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
              sx={{
                color: matBuildPrice > matWorth ? "error.main" : "success.main",
              }}
              size={{
                xs: 12,
                lg: 8,
              }}
            >
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                {formatNumberForLocale(matBuildPrice)}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  );
}
