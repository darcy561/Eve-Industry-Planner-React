import React, { useContext } from "react";
import { CircularProgress, Grid, Icon, Typography } from "@mui/material";
import { LoadingTextContext } from "../Context/LayoutContext";
import { MdDone } from "react-icons/md";

export function LoadingPage() {
  const { loadingText } = useContext(LoadingTextContext);
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      direction="column"
      sx={{ minHeight: "100vh", minWidth: "100vw" }}
    >
      <Grid item xs={12} align="center">
        <CircularProgress color="primary" />
      </Grid>
      <Grid container item xs={12}>
        {loadingText.eveSSO && (
          <Grid container item direction="row">
            <Grid item xs={3} />
            <Grid item xs={5}>
              <Typography align="center" variant="body2">
                Logging into Eve SSO
              </Typography>
            </Grid>

            <Grid item align="center" xs={1}>
              {loadingText.eveSSOComp && (
                <Icon fontSize="small" sx={{ color: "success.main" }}>
                  <MdDone />
                </Icon>
              )}
            </Grid>
            <Grid item xs={3} />
          </Grid>
        )}

        {loadingText.charData && (
          <Grid container item align="center" direction="row">
            <Grid item xs={3} />
            <Grid item xs={5}>
              <Typography variant="body2">Building character data</Typography>
            </Grid>

            <Grid item align="center" xs={1}>
              {loadingText.charDataComp && (
                <Icon fontSize="small" sx={{ color: "success.main" }}>
                  <MdDone />
                </Icon>
              )}
            </Grid>

            <Grid item xs={3} />
          </Grid>
        )}

        {loadingText.apiData && (
          <Grid container align="center" direction="row">
            <Grid item xs={3} />
            <Grid item xs={5}>
              <Typography variant="body2">Downloading API data</Typography>
            </Grid>

            <Grid item xs={1} align="center">
              {loadingText.charDataComp && (
                <Icon fontSize="small" sx={{ color: "success.main" }}>
                  <MdDone />
                </Icon>
              )}
            </Grid>
            <Grid item xs={3} />
          </Grid>
        )}

        {loadingText.jobData && (
          <Grid container align="center" direction="row">
            <Grid item xs={3} />
            <Grid item xs={5}>
              <Typography variant="body2">Downloading Job Data</Typography>
            </Grid>

            <Grid item xs={1} align="center">
              {loadingText.jobDataComp && (
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              )}
            </Grid>
            <Grid item xs={3} />
          </Grid>
        )}
        {loadingText.priceData && (
          <Grid container align="center" direction="row">
            <Grid item xs={3} />
            <Grid item xs={5}>
              <Typography variant="body2">Downloading Price Data</Typography>
            </Grid>

            <Grid item xs={1}>
              {loadingText.priceDataComp && (
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              )}
            </Grid>
            <Grid item xs={3} />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
