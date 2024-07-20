import { Grid, Tooltip, Typography } from "@mui/material";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function CurrentMaterialHeader({
  activeJob,
  marketSelect,
  listingSelect,
}) {
  const { findItemPriceObject } = useHelperFunction();

  const formatedMarketTitle =
    listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1);

  const priceObject = findItemPriceObject(activeJob.itemID);

  const marketPriceObject = priceObject[marketSelect];

  const itemPrice = marketPriceObject[listingSelect] || 0;

  return (
    <Grid container item xs={12}>
      <Grid
        item
        md={1}
        sx={{
          display: { xs: "none", md: "block" },
          paddingRight: "5px",
        }}
        align="center"
      >
        <img
          src={`https://images.evetech.net/types/${activeJob.itemID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
          {activeJob.name}
        </Typography>
      </Grid>
      <Grid
        item
        xs={6}
        md={3}
        align="center"
        sx={{ marginTop: { xs: "10px", md: "0px" } }}
      >
        <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {`Item ${formatedMarketTitle} Price:`}
        </Typography>
        <Tooltip
          title={
            <span>
              <p>
                <strong>30 Day Region Market History</strong>
              </p>
              <p>
                Highest Market Price:{" "}
                {(marketPriceObject.highestMarketPrice || 0).toLocaleString()}
              </p>
              <p>
                Lowest Market Price:{" "}
                {(marketPriceObject.lowestMarketPrice || 0).toLocaleString()}
              </p>
              <p>
                Daily Average Market Price:{" "}
                {(
                  marketPriceObject.dailyAverageMarketPrice || 0
                ).toLocaleString()}
              </p>
              <p>
                Daily Average Order Quantity:{" "}
                {(
                  marketPriceObject.dailyAverageOrderQuantity || 0
                ).toLocaleString()}
              </p>
              <p>
                Daily Average Unit Count:{" "}
                {(
                  marketPriceObject.dailyAverageUnitCount || 0
                ).toLocaleString()}
              </p>
            </span>
          }
          arrow
          placement="top"
        >
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            {itemPrice.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid
        item
        xs={6}
        md={4}
        align="center"
        sx={{ marginTop: { xs: "10px", md: "0px" } }}
      >
        <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {`Total ${formatedMarketTitle} Price:`}
        </Typography>

        <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
          {(itemPrice * activeJob.build.products.totalQuantity).toLocaleString(
            undefined,
            TWO_DECIMAL_PLACES
          )}
        </Typography>
      </Grid>
      <Grid
        container
        item
        xs={12}
        sx={{
          marginTop: { xs: "30px", sm: "30px" },
          marginBottom: { xs: "10px" },
        }}
      >
        <Grid item md={5} sx={{ marginTop: { xs: "10px", sm: "20px" } }} />
        <Grid item xs={6} md={3} align="center">
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            {`Material ${formatedMarketTitle}`} Price
            <br />
            <i>Build Price</i>
          </Typography>
        </Grid>
        <Grid item xs={6} md={4} align="center">
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Total Material Price <br />
            <i>Total Build Price</i>
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
