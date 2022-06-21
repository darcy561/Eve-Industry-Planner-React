import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from "@mui/material";

export function AddWatchItemDialog({ openDialog, setOpenDialog }) {
  return (
    <Dialog
      open={openDialog}
      onClose={() => {
        setOpenDialog(false);
      }}
      sx={{ padding: "20px", width: "100%" }}
    >
      <DialogTitle align="center" color="primary">
        Add Watchlist Item
      </DialogTitle>
          <DialogContent>
              <Grid container>
                  <Grid item xs={12}>
                      f
                  </Grid>
              </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small"
          onClick={() => {
            setOpenDialog(false);
          }}
        >
          Close
        </Button>
        <Button variant="contained" size="small">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
