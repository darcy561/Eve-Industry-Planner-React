import { Container, Grid, Icon, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from '@mui/icons-material/Close';
import { Masonry } from "@mui/lab";

export function SkillCheck() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const parentUser = users.find((i) => i.ParentUser);
  let buildChar = users.find(
    (i) => i.CharacterHash === activeJob.build.buildChar
  );

  if (buildChar === undefined) {
  buildChar = parentUser
}

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

            return (
              <Grid
                key={jSkill.typeID}
                container
                item
                xs={6}
                md={3}
                sx={{ marginBottom: { xs: "10px", md: "10px" } }}
              >
                <Grid
                  item
                  xs={12}
                  sx={{ minHeight: { xs: "3rem", sm: "2rem" } }}
                >
                  <Typography align="center" sx={{typography:{xs: "body2", sm:"body1"}}}>
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
                      <Icon fontSize="large" color="success" >
                        <DoneIcon />
                      </Icon>
                    ) : (
                      <Grid item>
                        <Icon fontSize="large" color="error">
                          <CloseIcon />
                        </Icon>
                        <Typography variant="body2">
                          Required Level: {jSkill.level}
                        </Typography>
                        <Typography variant="body2">
                          Current Level: {charSkill.activeLevel}
                        </Typography>
                      </Grid>
                    )}
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
