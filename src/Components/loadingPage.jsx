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
      style={{ minHeight: "100vh", maxWidth:"100vw" }}
      spacing={8}
    >
      <Grid item>
        <CircularProgress color="primary" />
      </Grid>
      <Grid>

        {loadingText.eveSSO && (
          <Grid container direction="row">
            <Grid item>
              <Typography variant="body2">Logging into Eve SSO</Typography>
            </Grid>
            {loadingText.eveSSOComp && (
              <Grid item>
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              </Grid>
            )}
          </Grid>
        )}

        {loadingText.charData && (
          <Grid container direction="row">
            <Grid item>
              <Typography variant="body2">Building character data</Typography>
            </Grid>
            {loadingText.charDataComp && (
              <Grid item>
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              </Grid>
            )}
          </Grid>
        )}

        {loadingText.apiData && (
          <Grid container direction="row">
            <Grid item>
              <Typography variant="body2">Downloading API data</Typography>
            </Grid>
            {loadingText.charDataComp && (
              <Grid item>
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              </Grid>
            )}
          </Grid>
        )}

        {loadingText.jobData && (
          <Grid container direction="row">
            <Grid item>
              <Typography variant="body2">Downloading Job Data</Typography>
            </Grid>
            {loadingText.charDataComp && (
              <Grid item>
                <Icon fontSize="small" style={{ color: "green" }}>
                  <MdDone />
                </Icon>
              </Grid>
            )}
          </Grid>
        )}

      </Grid>
    </Grid>
  );
}
