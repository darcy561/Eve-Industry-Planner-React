import { Grid, IconButton, Paper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AddWatchItemDialog } from "./addItemDialog";
import { useState } from "react";

export function ItemWatchPanel() {
  const [openDialog, setOpenDialog] = useState(false);
  return (
    <>
      <Paper
        sx={{
          padding: "20px",
          position: "relative",
          marginLeft: {
            xs: "5px",
            md: "10px",
          },
          marginRight: {
            xs: "5px",
            md: "10px",
          },
        }}
        square
      >
        <AddWatchItemDialog
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
        <Grid container>
          <Grid item xs={12} sx={{ marginBottom: "20px" }}>
            <Typography variant="h5" color="primary" align="center">
              Item Watchlist
            </Typography>
          </Grid>
          <IconButton
            color="primary"
            sx={{ position: "absolute", top: "10px", right: "10px" }}
            onClick={() => {
              setOpenDialog(true);
            }}
          >
            <AddIcon />
          </IconButton>
          <Grid container item xs={12}></Grid>
        </Grid>
      </Paper>
    </>
  );
}
