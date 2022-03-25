import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { listingType, marketOptions } from "../../../Context/defaultValues";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
  Select: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
  },
}));

export function EditJobSettings({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);
  const [marketSelect, updateMarketSelect] = useState(
    users[parentUserIndex].settings.editJob.defaultMarket
  );
  const [listingSelect, updateListingSelect] = useState(
    users[parentUserIndex].settings.editJob.defaultOrders
  );
  const classes = useStyles();

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Edit Job Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={4}>
            <FormControl className={classes.Select} fullWidth={true}>
              <Select
                value={marketSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  let newUsersArray = [...users];
                  newUsersArray[
                    parentUserIndex
                  ].settings.editJob.defaultMarket = e.target.value;
                  updateMarketSelect(e.target.value);
                  updateUsers(newUsersArray);
                }}
                sx={{
                  width: "90px",
                }}
              >
                {marketOptions.map((option) => {
                  return (
                    <MenuItem key={option.name} value={option.id}>
                      {option.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Default Market Hub
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl className={classes.Select} fullWidth={true}>
              <Select
                value={listingSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  let newUsersArray = [...users];
                  newUsersArray[
                    parentUserIndex
                  ].settings.editJob.defaultOrders = e.target.value;
                  updateListingSelect(e.target.value);
                  updateUsers(newUsersArray);
                }}
                sx={{
                  width: "120px",
                }}
              >
                {listingType.map((option) => {
                  return (
                    <MenuItem key={option.name} value={option.id}>
                      {option.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Default Market Listings
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      users[parentUserIndex].settings.editJob
                        .hideCompleteMaterials
                    }
                    color="primary"
                    onChange={(e) => {
                      let newUsersArray = [...users];
                      newUsersArray[
                        parentUserIndex
                      ].settings.editJob.hideCompleteMaterials =
                        e.target.checked;
                      updateUsers(newUsersArray);
                    }}
                  />
                }
                label="Hide Complete Materials"
                labelPlacement="start"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
