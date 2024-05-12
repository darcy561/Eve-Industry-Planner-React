import { useContext } from "react";
import {
  Grid,
  Paper,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";
import { useFirebase } from "../../Hooks/useFirebase";
import GLOBAL_CONFIG from "../../global-config-app";

function TutorialTemplate({ TutorialContent, updateExpandedMenu }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();
  const { findParentUserIndex, checkDisplayTutorials } = useHelperFunction();
  const { PRIMARY_THEME } = GLOBAL_CONFIG;
  function handleCheckBox() {
    let newUsers = [...users];
    const parentUserIndex = findParentUserIndex();
    newUsers[parentUserIndex].settings.layout.hideTutorials = true;
    updateExpandedMenu((prev) => !prev);
    updateUsers(newUsers);
    updateMainUserDoc();
  }

  if (!checkDisplayTutorials()) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        height: "100%",
        width: "100%",
      }}
      square
    >
      <Grid container direction="column" sx={{ height: "100%" }}>
        <Grid item xs sx={{ overflow: "auto" }}>
          {TutorialContent && <TutorialContent />}
        </Grid>
        {isLoggedIn && (
          <Grid item display={"flex"} justifyContent="flex-start">
            <FormGroup>
              <FormControlLabel
                label={"Hide Tutorials"}
                control={
                  <Checkbox
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                    }}
                    onClick={handleCheckBox}
                  />
                }
              />
            </FormGroup>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

export default TutorialTemplate;
