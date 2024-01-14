import { Grid, Typography } from "@mui/material";

export function ChildJobItem({ job, itemToModify, updateItemToModify }) {
  return (
    <Grid
      container
      item
      xs={6}
      sm={3}
      align="center"
      sx={{
        marginBottom: "10px",
        paddingLeft: "5px",
        paddingRight: "5px",
      }}
      onClick={() => {
        updateItemToModify(job.itemID);
      }}
    >
      <Grid
        item
        xs={12}
        align="center"
        sx={{ minHeight: "35px", minWidth: "35px" }}
      >
        <img
          src={`https://images.evetech.net/types/${job.itemID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid item xs={12} align="center">
        <Typography
          align="center"
          variant="caption"
          color={itemToModify === job.itemID ? "primary" : null}
          sx={{
            textDecoration: itemToModify === job.itemID ? "underline" : null,
          }}
        >
          {job.name}
        </Typography>
      </Grid>
    </Grid>
  );
}
