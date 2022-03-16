<<<<<<< HEAD
import { Grid, Paper, Switch, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";

export function LayoutSettings({parentUserIndex}) {
  const { users, updateUsers } = useContext(UsersContext);


=======
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

export function LayoutSettings({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);

>>>>>>> development
  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Layout Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
<<<<<<< HEAD
          <Grid item xs={3}>
            <Typography variant="body2">Enable Help Tips:</Typography>
          </Grid>
          <Grid item xs={3}>
            <Switch
              checked={!users[parentUserIndex].settings.layout.hideTutorials}
              color="primary"
              onChange={(e) => {
                let newUsersArray = [...users];
                newUsersArray[parentUserIndex].settings.layout.hideTutorials =
                  !e.target.checked;
                updateUsers(newUsersArray);
              }}
            />
=======
          <Grid item xs={4} >
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
                    }}
                  />
                }
                label="Enable Help Tips"
                labelPlacement="start"
              />
            </FormGroup>
>>>>>>> development
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
