import { Grid, Icon, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useState } from "react";
import { ChildJobPopover } from "./childJobPopOver";

export function ItemCostRow({
  material,
  marketSelect,
  listingSelect,
  materialPrice,
  jobModified,
}) {
  const [displayPopover, updateDisplayPopover] = useState(null);
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
      <Grid container item xs={12} md={4} align="left">
        <Grid item xs={11}>
          <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
            {material.name}
          </Typography>
        </Grid>
        {material.childJob.length > 0 ? (
          <Grid item xs={1}>
            <Tooltip
              title="Click To View Child Job Material Costs"
              arrow
              placement="bottom"
            >
              <Icon
                aria-haspopup="true"
                color="primary"
                onClick={(event) => {
                  updateDisplayPopover(event.currentTarget);
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </Icon>
            </Tooltip>
            <ChildJobPopover
              displayPopover={displayPopover}
              updateDisplayPopover={updateDisplayPopover}
              material={material}
              marketSelect={marketSelect}
              listingSelect={listingSelect}
              jobModified={jobModified}
            />
          </Grid>
        ) : null}
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
