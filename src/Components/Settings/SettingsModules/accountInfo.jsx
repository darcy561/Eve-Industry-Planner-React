import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";

export function AccountInfo() {
  const { users, updateUsers } = useContext(UsersContext);
  const parentUser = users.find((i) => i.ParentUser === true);

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Account Information
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={3} sx={{ marginBottom: "10px" }}>
            <Typography variant="body2">Character Name:</Typography>
          </Grid>
          <Grid item xs={9} align="right">
            <Typography variant="body2">{parentUser.CharacterName}</Typography>
          </Grid>
          <Grid item xs={3} sx={{ marginBottom: "10px" }}>
            <Typography variant="body2">Account ID:</Typography>
          </Grid>
          <Grid item xs={9} align="right">
            <Typography variant="body2">{parentUser.accountID}</Typography>
          </Grid>
          <Grid item xs={3} sx={{ marginBottom: "10px" }}>
            <Typography variant="body2">Account Created:</Typography>
          </Grid>
          <Grid item xs={9} align="right">
            <Typography variant="body2">
              {new Date(
                Number(parentUser.fbToken.user.reloadUserInfo.createdAt)
              ).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
