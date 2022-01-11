import { Box, Button, Container, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router";

export function HeaderBanner() {
  const navigate = useNavigate();
  return (
    <Grid
      container
      item
      xs={12}
      justifyContent="center"
      alignItems="center"
      sx={{
        position: "relative",
        paddingTop: "10%",
        paddingBottom: "10%",
      }}
    >
      <Typography
        variant="h3"
        color="primary"
        align="center"
        sx={{
          zIndex: "1",
          position: "relative",
          marginTop: { xs: "10px", sm: "0px" },
        }}
      >
        <b>
          <i>Making the spreadsheet, so you dont have to!</i>
        </b>
      </Typography>
      <Grid
        item
        xs={12}
        align="center"
        sx={{
          marginTop: { sm: "10px", md: "20px", lg: "40px" },
          marginBottom: { xs: "10px", sm: "0px" },
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          size="large"
          sx={{ position: "relative", zIndex: "1" }}
          onClick={() => navigate("/jobplanner")}
        >
          Give it a try!
        </Button>
      </Grid>
      <Box
        sx={{
          position: "absolute",
          top: "0",
          left: "0",
          backgroundImage: `url("/images/loggedOutHome/purchasingStepImage.png")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
          width: "100%",
          opacity: "0.15",
        }}
      />
    </Grid>
  );
}
