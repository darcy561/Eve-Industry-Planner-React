import { Grid, Typography } from "@mui/material";

export function ItemCostRow({
  material,
  marketSelect,
  listingSelect,
  materialPrice,
}) {
  return (
    <Grid
      container
      item
      xs={12}
      sx={{ padding: { xs: "7px 0px", sm: "10px 0px" } }}
    >
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
          src={`https://images.evetech.net/types/${material.typeID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid item xs={12} md={4} align="left">
        <Typography variant="body1"> {material.name}</Typography>
      </Grid>
      <Grid
        item
        xs={6}
        md={3}
        align="center"
        sx={{ marginTop: { xs: "10px", md: "0px" } }}
      >
        <Typography variant="body2">
          {materialPrice[marketSelect][listingSelect].toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}{" "}
        </Typography>
      </Grid>
      <Grid
        item
        xs={6}
        md={4}
        align="center"
        sx={{ marginTop: { xs: "10px", md: "0px" } }}
      >
        <Typography variant="body2">
          {(
            materialPrice[marketSelect][listingSelect] * material.quantity
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
    </Grid>
  );
}
