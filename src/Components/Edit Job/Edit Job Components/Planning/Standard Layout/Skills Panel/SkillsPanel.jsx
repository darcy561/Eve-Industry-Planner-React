import { useContext } from "react";
import { Grid, Icon, Paper, Tooltip, Typography } from "@mui/material";
import { Masonry } from "@mui/lab";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { PersonalESIDataContext } from "../../../../../../Context/EveDataContext";
import bpSkills from "../../../../../../RawData/bpSkills.json";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function SkillsPanel({ activeJob, setupToEdit }) {
  const { users } = useContext(UsersContext);
  const { esiSkills } = useContext(PersonalESIDataContext);
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();

  if (!activeJob.build.setup[setupToEdit]) return null;

  const buildChar =
    users.find(
      (i) =>
        i.CharacterHash === activeJob.build.setup[setupToEdit].selectedCharacter
    ) || parentUser;

  const characterSkills = esiSkills.find(
    (i) => i.user === buildChar.CharacterHash
  ).data;

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square
    >
      <Grid container>
        <Grid container item sx={{ marginBottom: "10px" }}>
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
              <Grid item xs={12} sx={{ minHeight: { xs: "3rem", sm: "2rem" } }}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body1" } }}
                >
                  {skillData ? skillData.name : "Unknown Skill"}
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
                  {charSkill && charSkill.activeLevel >= jSkill.level ? (
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
                      {charSkill ? (
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
    </Paper>
  );
}
