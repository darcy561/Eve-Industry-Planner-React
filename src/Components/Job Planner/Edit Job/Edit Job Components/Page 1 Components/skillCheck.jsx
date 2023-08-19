import {
  Container,
  Grid,
  Icon,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { Masonry } from "@mui/lab";
import bpSkills from "../../../../../RawData/bpSkills.json";
import { PersonalESIDataContext } from "../../../../../Context/EveDataContext";

export function SkillCheck() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { esiSkills } = useContext(PersonalESIDataContext);
  const parentUser = users.find((i) => i.ParentUser);
  let buildChar = users.find(
    (i) => i.CharacterHash === activeJob.build.buildChar
  );

  if (buildChar === undefined) {
    buildChar = parentUser;
  }

  let characterSkills = esiSkills.find(
    (i) => i.user === buildChar.CharacterHash
  ).data;

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
          {activeJob.skills.length === 0 && (
            <Grid item xs={12} sx={{ marginTop: "10px" }}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                No Skills Required
              </Typography>
            </Grid>
          )}
          {activeJob.skills.map((jSkill) => {
            const charSkill = characterSkills[jSkill.typeID];
            const skillData = bpSkills[jSkill.typeID];

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
                  <Typography
                    align="center"
                    sx={{ typography: { xs: "caption", sm: "body1" } }}
                  >
                    {skillData !== undefined ? skillData.name : "Unknown Skill"}
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
                    {charSkill !== undefined &&
                    charSkill.activeLevel >= jSkill.level ? (
                      <Tooltip
                        arrow
                        title={`Level ${jSkill.level} Required`}
                        placement="bottom"
                      >
                        <Icon fontSize="large" color="success">
                          <DoneIcon />
                        </Icon>
                      </Tooltip>
                    ) : (
                      <Grid item>
                        <Icon fontSize="large" color="error">
                          <CloseIcon />
                        </Icon>
                        <Typography
                          sx={{ typography: { xs: "caption", sm: "body2" } }}
                        >
                          Required Level: {jSkill.level}
                        </Typography>
                        {charSkill !== undefined ? (
                          <Typography
                            sx={{ typography: { xs: "caption", sm: "body2" } }}
                          >
                            Current Level: {charSkill.activeLevel}
                          </Typography>
                        ) : null}
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
