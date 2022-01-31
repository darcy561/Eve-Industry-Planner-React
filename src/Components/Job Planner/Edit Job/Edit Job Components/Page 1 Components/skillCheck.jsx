import { Container, Grid, Icon, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export function SkillCheck() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const buildChar = users.find(
    (i) => i.CharacterHash === activeJob.build.buildChar
  );

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
      }}
      square={true}
    >
      <Container disableGutters maxWidth="false">
        <Grid container direction="row">
          <Grid container item direction="row" sx={{ marginBottom: "10px" }}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" align="center">
                Required Skills
              </Typography>
            </Grid>
          </Grid>
          {activeJob.skills.map((jSkill) => {
            const charSkill = buildChar.apiSkills.find(
              (i) => i.id === jSkill.typeID
            );

            return (
              <Grid
                key={jSkill.typeID}
                container
                item
                xs={6}
                md={3}
                sx={{ marginBottom: { xs: "10px", md: "0px" } }}
              >
                <Grid
                  item
                  xs={12}
                  sx={{ minHeight: { xs: "4rem", sm: "2rem" } }}
                >
                  <Typography variant="body2" align="center">
                    {charSkill.name}
                  </Typography>
                </Grid>
                {charSkill.activeLevel >= jSkill.level ? (
                  <Grid item xs={12} align="center">
                    <Grid item xs={12} sx={{ minHeight: "2rem" }}>
                      <Icon fontSize="large" color="success">
                        <CheckCircleIcon />
                      </Icon>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid item xs={12} align="center">
                    <Grid item xs={12} sx={{ minHeight: "2rem" }}>
                      <Icon fontSize="large" color="error">
                        <CancelIcon />
                      </Icon>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        Required Level: {jSkill.level}
                      </Typography>
                      <Typography variant="body2">
                        Current Level: {charSkill.activeLevel}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Paper>
  );
}
