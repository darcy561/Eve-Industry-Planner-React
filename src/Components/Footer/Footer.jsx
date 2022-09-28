import { Container, Grid, Link, Paper, Typography } from "@mui/material";

export function Footer() {
  return (
    <Container disableGutters maxWidth="false">
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
        square={true}
      >
        <Grid container>
          <Grid item xs={12}>
            <Typography
              display="block"
              variant="caption"
              align="center"
              sx={{ marginBottom: "5px" }}
            >
              All EVE related materials are property of CCP Games.
            </Typography>
            <Typography
              display="block"
              variant="caption"
              align="center"
              sx={{ marginBottom: "10px" }}
            >
              Produced and maintained by Oswold Saraki
            </Typography>

            <Typography display="block" variant="caption" align="center">
              <Link href="https://discord.gg/KGSa8gh37z" underline="hover">
                Discord
              </Link>{" "}
              <Link
                href="https://github.com/darcy561/Eve-Industry-Planner-React"
                underline="hover"
              >
                Github
              </Link>
            </Typography>
            <Typography
              display="block"
              variant="caption"
              align="center"
              sx={{ marginBottom: "10px" }}
            >
              v{__APP_VERSION__}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
