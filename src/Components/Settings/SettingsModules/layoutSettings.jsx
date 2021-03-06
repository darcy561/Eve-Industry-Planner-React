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

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Layout Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={6} sm={4} >
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
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
