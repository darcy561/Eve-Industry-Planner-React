import React, { useContext } from "react";
import { CircularProgress, Grid, Icon, Typography } from "@mui/material";
import { LoadingTextContext } from "../Context/LayoutContext";
import { MdDone } from "react-icons/md";
import { Header } from "./Header";
import { Footer } from "./Footer/Footer";
import { STANDARD_TEXT_FORMAT } from "../Context/defaultValues";

export function LoadingPage({ colorMode }) {
  const { loadingText } = useContext(LoadingTextContext);
  return (
    <>
      <Header colorMode={colorMode} />
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="column"
        sx={{ minHeight: "100vh", minWidth: "100vw" }}
      >
        <Grid container item xs={12} align="center">
          <Grid item xs={0} xl={5} />
          <Grid item xs={12} xl={1}>
            <CircularProgress color="primary" />
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          {loadingText.jobData && (
            <Grid container align="center" direction="row">
              <Grid item xs={3} sm={4} md={4} xl={5} />
              <Grid item xs={5} sm={3} md={3} xl={1}>
                <Typography sx={{ Typography: STANDARD_TEXT_FORMAT }}>
                  Downloading Job Data
                </Typography>
              </Grid>

              <Grid item align="left" xs={1} sm={1}>
                {loadingText.jobDataComp && (
                  <Icon fontSize="small" style={{ color: "green" }}>
                    <MdDone />
                  </Icon>
                )}
              </Grid>
              <Grid item xs={3} md={4} />
            </Grid>
          )}
          {loadingText.priceData && (
            <Grid container align="center" direction="row">
              <Grid item xs={3} sm={4} md={4} xl={5} />
              <Grid item xs={5} sm={3} md={3} xl={1}>
                <Typography sx={{ Typography: STANDARD_TEXT_FORMAT }}>
                  Downloading Price Data
                </Typography>
              </Grid>

              <Grid item align="left" xs={1} sm={1}>
                {loadingText.priceDataComp && (
                  <Icon fontSize="small" style={{ color: "green" }}>
                    <MdDone />
                  </Icon>
                )}
              </Grid>
              <Grid item xs={3} md={4} />
            </Grid>
          )}
        </Grid>
      </Grid>
      <Footer />
    </>
  );
}
