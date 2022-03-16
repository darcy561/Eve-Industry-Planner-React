import { Container, Grid, Icon, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { Masonry } from "@mui/lab";

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
        minWidth: "100%",
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

<<<<<<< HEAD
=======

>>>>>>> development
            return (
              <Grid
                key={jSkill.typeID}
                container
                item
                xs={6}
                md={3}
<<<<<<< HEAD
                sx={{ marginBottom: { xs: "10px", md: "0px" } }}
=======
                sx={{ marginBottom: { xs: "10px", md: "10px" } }}
>>>>>>> development
              >
                <Grid
                  item
                  xs={12}
                  sx={{ minHeight: { xs: "3rem", sm: "2rem" } }}
                >
<<<<<<< HEAD
                  <Typography variant="body2" align="center">
=======
                  <Typography variant="body1" align="center">
>>>>>>> development
                    {charSkill.name}
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  align="center"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Masonry columns={1}>
                    {charSkill.activeLevel >= jSkill.level ? (
<<<<<<< HEAD
                      <Icon fontSize="large" color="success">
                        <CheckCircleIcon />
                      </Icon>
                    ) : (
                      <Icon fontSize="large" color="error">
                        <CancelIcon />
                      </Icon>
                    )}
                    <Typography variant="body2">
                      Required Level: {jSkill.level}
                    </Typography>
                    <Typography variant="body2">
                      Current Level: {charSkill.activeLevel}
                    </Typography>
=======
                      <Icon fontSize="large" color="success" >
                        <CheckCircleIcon />
                      </Icon>
                    ) : (
                      <Grid item>
                        <Icon fontSize="large" color="error">
                          <CancelIcon />
                        </Icon>
                        <Typography variant="body2">
                          Required Level: {jSkill.level}
                        </Typography>
                        <Typography variant="body2">
                          Current Level: {charSkill.activeLevel}
                        </Typography>
                      </Grid>
                    )}
>>>>>>> development
                  </Masonry>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Paper>
  );
}
