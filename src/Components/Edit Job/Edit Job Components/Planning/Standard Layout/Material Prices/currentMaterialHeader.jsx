import { Grid, Tooltip, Typography } from "@mui/material";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function CurrentMaterialHeader({
  activeJob,
  marketSelect,
  listingSelect,
}) {
  const { findItemPriceObject } = useHelperFunction()

  const formatedMarketTitle =
    listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1);

  const priceObject = findItemPriceObject(activeJob.itemID);

  const marketPriceObject = priceObject[marketSelect];

  const itemPrice = marketPriceObject[listingSelect];

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
        <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
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
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Item ${formatedMarketTitle} Price:`}
        </Typography>
        <Tooltip
          title={
            <span>
              <p>
                <b>30 Day Region Market History</b>
              </p>
              <p>
                Highest Market Price:{" "}
                {marketPriceObject.highestMarketPrice.toLocaleString()}
              </p>
              <p>
                Lowest Market Price:{" "}
                {marketPriceObject.lowestMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Market Price:{" "}
                {marketPriceObject.dailyAverageMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Order Quantity:{" "}
                {marketPriceObject.dailyAverageOrderQuantity.toLocaleString()}
              </p>
              <p>
                Daily Average Unit Count:{" "}
                {marketPriceObject.dailyAverageUnitCount.toLocaleString()}
              </p>
            </span>
          }
          arrow
          placement="top"
        >
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {itemPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Total ${formatedMarketTitle} Price:`}
        </Typography>

        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {(itemPrice * activeJob.build.products.totalQuantity).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
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
          <Typography sx={{ typography: { xs: "body2", sm: "body2" } }}>
            {`Material ${formatedMarketTitle}`} Price
            <br />
            <i>Build Price</i>
          </Typography>
        </Grid>
        <Grid item xs={6} md={4} align="center">
          <Typography sx={{ typography: { xs: "body2", sm: "body2" } }}>
            Total Material Price <br />
            <i>Total Build Price</i>
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
