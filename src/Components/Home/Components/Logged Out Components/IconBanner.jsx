import { Container, Grid, Icon, Paper, Typography } from "@mui/material/";
import { FaIndustry } from "react-icons/fa";
import { BsCalculatorFill } from "react-icons/bs";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

export function IconBanner() {
  return (
    <Container
      disableGutters
      maxWidth="false"
      sx={{
        backgroundColor: "primary.main",
        padding: { xs: "40px 120px", sm: "60px 50px", md:"60px 120px" },
      }}
    >
      <Grid container item spacing={5}>
        <Grid item xs={12} sm={4} align="center">
          <Paper elevation={10} sx={{ padding: { xs: "20px", sm: "50px" } }}>
            <Icon
              fontSize="large"
              sx={{ marginBottom: { xs: "0px", sm: "10px" } }}
            >
              <BsCalculatorFill />
            </Icon>
            <Typography variant="h6" align="center">
              Plan It
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4} align="center">
          <Paper elevation={10} sx={{ padding: { xs: "20px", sm: "50px" } }}>
            <Icon
              fontSize="large"
              sx={{ marginBottom: { xs: "0px", sm: "10px" } }}
            >
              <FaIndustry />
            </Icon>
            <Typography variant="h6" align="center">
              Build It
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4} align="center">
          <Paper elevation={10} sx={{ padding: { xs: "20px", sm: "50px" } }}>
            <Icon
              fontSize="large"
              sx={{ marginBottom: { xs: "0px", sm: "10px" } }}
            >
              <RiMoneyDollarCircleLine />
            </Icon>
            <Typography variant="h6" align="center">
              Sell It
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
