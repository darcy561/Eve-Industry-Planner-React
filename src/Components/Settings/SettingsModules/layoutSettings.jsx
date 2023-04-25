import {
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { useFirebase } from "../../../Hooks/useFirebase";

export function LayoutSettings({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Layout Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={6} sm={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      !users[parentUserIndex].settings.layout.hideTutorials
                    }
                    color="primary"
                    onChange={(e) => {
                      let newUsersArray = [...users];
                      newUsersArray[
                        parentUserIndex
                      ].settings.layout.hideTutorials = !e.target.checked;
                      updateUsers(newUsersArray);
                      updateMainUserDoc();
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Enable Help Cards
                  </Typography>
                }
                labelPlacement="bottom"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      users[parentUserIndex].settings.layout?.enableCompactView
                    }
                    color="primary"
                    onChange={(e) => {
                      let newUsersArray = [...users];
                      newUsersArray[
                        parentUserIndex
                      ].settings.layout.enableCompactView = e.target.checked;

                      updateUsers(newUsersArray);
                      updateMainUserDoc();
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Enable Compact View
                  </Typography>
                }
                labelPlacement="bottom"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
