import { Grid, Tooltip, Typography } from "@mui/material";

export function CurrentMaterialHeader({
  activeJob,
  activeJobPrices,
  marketSelect,
  listingSelect,
}) {
  const formatedMarketTitle =
    listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1);
  const itemPrice = activeJobPrices[marketSelect][listingSelect];

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
                {activeJobPrices[
                  marketSelect
                ].highestMarketPrice.toLocaleString()}
              </p>
              <p>
                Lowest Market Price:{" "}
                {activeJobPrices[
                  marketSelect
                ].lowestMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Market Price:{" "}
                {activeJobPrices[
                  marketSelect
                ].dailyAverageMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Order Quantity:{" "}
                {activeJobPrices[
                  marketSelect
                ].dailyAverageOrderQuantity.toLocaleString()}
              </p>
              <p>
                Daily Average Unit Count:{" "}
                {activeJobPrices[
                  marketSelect
                ].dailyAverageUnitCount.toLocaleString()}
              </p>
            </span>
          }
          arrow
          placement="top"
        >
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {activeJobPrices
              ? itemPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : 0}
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
          {activeJobPrices
            ? (
                itemPrice * activeJob.build.products.totalQuantity
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : 0}
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
          <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
            Item Price
          </Typography>
        </Grid>
        <Grid item xs={6} md={4} align="center">
          <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
            Total Price
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
