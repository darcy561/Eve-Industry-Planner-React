import { useContext, useState } from "react";
import {
  Grid,
  Paper,
  Checkbox,
  Box,
  FormGroup,
  FormControlLabel,
  Fade,
  Collapse,
  Slide,
} from "@mui/material";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { UserLoginUIContext } from "../../Context/LayoutContext";
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
    <Box
      sx={{
        display: "flex",
        width: { xs: "100%", md: "25%" },
        order: { xs: 1, md: 2 },
        minWidth: "40ch",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          width: "100%",
        }}
        square
      >
        <Grid container direction="column">
          <Grid item xs>
            {TutorialContent && <TutorialContent />}
          </Grid>
          {isLoggedIn && (
            <Grid item display={"flex"} justifyContent="flex-end">
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
    </Box>
  );
}

export default TutorialTemplate;
