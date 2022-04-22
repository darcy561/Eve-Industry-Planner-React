import { CircularProgress, Box, Grid, Typography, Slide } from "@mui/material";
import { useContext } from "react";
import { MassBuildDisplayContext } from "../../../Context/LayoutContext";
import { grey } from "@mui/material/colors";

import { makeStyles } from "@mui/styles";
const useStyles = makeStyles((theme) => ({
  Box: {
    backgroundColor: theme.palette.type === "dark" ? grey[800] : "white",
    borderStyle: "solid",
    borderRightStyle: { xs: "solid", sm: "none" },
    borderWidth: "1px",
    borderColor:
      theme.palette.type === "dark" ? grey[900] : theme.palette.secondary.main,
  },
}));

export function MassBuildFeedback({}) {
  const { massBuildDisplay } = useContext(MassBuildDisplayContext);
  const classes = useStyles();
  if (massBuildDisplay.open) {
    return (
      <Slide direction="left" in={massBuildDisplay.open} unmountOnExit>
        <Box
          className={classes.Box}
          sx={{
            position: "fixed",
            top: { xs: "5%", sm: "10%" },
            right: "0",
            width: { xs: "100%", sm: "60%", md: "45%", lg: "35%", xl: "25%" },
            borderTopLeftRadius: { xs: "0px", sm: "10px" },
            borderBottomLeftRadius: { xs: "0px", sm: "10px" },
            padding: "20px",
            zIndex: "2",
            boxShadow: 5,
          }}
        >
          <Grid container>
            <Grid container item xs={12} align="center" justifyContent="center">
              <CircularProgress size={25} sx={{ marginRight: "30px" }} />
              {massBuildDisplay.currentJob !== massBuildDisplay.totalJob && (
                <Typography variant="h6" color="primary">
                  {massBuildDisplay.currentJob}/{massBuildDisplay.totalJob} Jobs
                  Built
                </Typography>
              )}

              {massBuildDisplay.currentJob === massBuildDisplay.totalJob && (
                <Typography variant="h6" color="primary">
                  Importing Price Data For {massBuildDisplay.totalPrice} Items
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Slide>
    );
  } else return null;
}
