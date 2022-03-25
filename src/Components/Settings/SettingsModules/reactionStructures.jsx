import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { blueprintVariables } from "../../Job Planner/JobPlanner";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "@mui/styles";
import { useState } from "react";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { Masonry } from "@mui/lab";
import { useFirebase } from "../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";

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
  Autocomplete: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
  },
}));

export function ReactionStrutures({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();
  const [tempDetails, updateTempDetails] = useState({
    name: "No Name Provided",
    systemType: 1,
    structureName: "Medium",
    structureValue: 1,
    rigType: 0,
    tax: 0,
  });
  const classes = useStyles();
  const analytics = getAnalytics();

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "10px" }}>
          <Typography variant="h6" color="primary">
            Reaction Structures
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid
            container
            item
            xs={12}
            lg={6}
            sx={{ paddingRight: { xs: "0px", lg: "5px" } }}
          >
            <Masonry columns={1} spacing={1}>
              <Box
                sx={{
                  padding: "20px",
                  marginBottom: { xs: "20px", lg: "0px" },
                }}
              >
                <Grid container item xs={12}>
                  <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                    <TextField
                      size="small"
                      variant="standard"
                      className={classes.TextField}
                      helperText="Name"
                      type="text"
                      onBlur={(e) => {
                        let input = e.target.value.replace(
                          /[^a-zA-Z0-9 ]/g,
                          ""
                        );
                        updateTempDetails((prev) => ({
                          ...prev,
                          name: input,
                        }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sx={{ paddingLeft: "5px" }}>
                    <FormControl className={classes.TextField} fullWidth={true}>
                      <Autocomplete
                        disableClearable={true}
                        size="small"
                        options={blueprintVariables.reactionSystem}
                        onChange={(e, v) => {
                          updateTempDetails((prev) => ({
                            ...prev,
                            systemType: v.value,
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField {...params} variant="standard" />
                        )}
                      />
                      <FormHelperText variant="standard">
                        System Type
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                    <FormControl className={classes.TextField} fullWidth={true}>
                      <Autocomplete
                        size="small"
                        disableClearable={true}
                        options={blueprintVariables.reactionStructure}
                        onChange={(e, v) => {
                          updateTempDetails((prev) => ({
                            ...prev,
                            structureName: v.value,
                            structureValue: 1,
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField {...params} variant="standard" />
                        )}
                      />
                      <FormHelperText variant="standard">
                        Structure Type
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sx={{ paddingLeft: "5px" }}>
                    <FormControl className={classes.TextField} fullWidth={true}>
                      <Autocomplete
                        size="small"
                        disableClearable={true}
                        options={blueprintVariables.reactionRigs}
                        onChange={(e, v) => {
                          updateTempDetails((prev) => ({
                            ...prev,
                            rigType: v.value,
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField {...params} variant="standard" />
                        )}
                      />
                      <FormHelperText variant="standard">
                        Rig Type
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                    <Tooltip
                      title="Calculation not yet implemented"
                      arrow
                      placement="right"
                    >
                      <FormControl
                        className={classes.TextField}
                        fullWidth={true}
                      >
                        <TextField
                          size="small"
                          variant="standard"
                          className={classes.TextField}
                          helperText="Installation Tax %"
                          type="number"
                          onBlur={(e) => {
                            updateTempDetails((prev) => ({
                              ...prev,
                              tax: e.target.value / 100,
                            }));
                          }}
                        />
                      </FormControl>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} align="center">
                    <Tooltip title="Add new structure" arrow postion="bottom">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          let newUsersArray = [...users];
                          newUsersArray[
                            parentUserIndex
                          ].settings.structures.reaction.push({
                            id: Date.now(),
                            name: tempDetails.name,
                            systemType: tempDetails.systemType,
                            structureName: tempDetails.structureName,
                            structureValue: tempDetails.structureValue,
                            rigType: tempDetails.rigType,
                            default:
                              newUsersArray[parentUserIndex].settings.structures
                                .reaction.length === 0
                                ? true
                                : false,
                            tax: tempDetails.tax,
                          });
                          updateMainUserDoc(newUsersArray);
                          updateUsers(newUsersArray);
                          logEvent(analytics, "Add Reaction Structure", {
                            UID: newUsersArray[parentUserIndex].accountID,
                          });
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            </Masonry>
          </Grid>

          <Grid
            container
            item
            xs={12}
            lg={6}
            sx={{
              paddingLeft: "5px",
              paddingRight: "5px",
              paddingBottom: "5px",
              overflowY: "auto",
              height: { xs: "200px", lg: "380px" },
            }}
          >
            {users[parentUserIndex].settings.structures.reaction.map(
              (entry) => {
                const systemText = blueprintVariables.reactionSystem.find(
                  (x) => x.value === entry.systemType
                );
                const structureText = blueprintVariables.reactionStructure.find(
                  (x) => x.value === entry.structureName
                );
                const rigText = blueprintVariables.reactionRigs.find(
                  (x) => x.value === entry.rigType
                );
                return (
                  <Grid item xs={12}>
                    <Card
                      key={entry.id}
                      raised={true}
                      sx={{
                        width: "100%",
                      }}
                    >
                      <CardContent>
                        <Grid container item xs={12} align="center">
                          <Grid
                            item
                            xs={12}
                            sx={{ flexWrap: "wrap", marginBottom: "10px" }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ overflowWrap: "anywhere" }}
                              color="primary"
                            >
                              {entry.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body1">
                              {systemText.label}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body1">
                              {structureText.label}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body1">
                              {rigText.label}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>{" "}
                      <CardActions>
                        <Grid container item xs={12}>
                          <Grid item xs={6} align="center">
                            <Button
                              size="small"
                              variant="contained"
                              disabled={entry.default}
                              onClick={() => {
                                let newUsersArray = [...users];
                                newUsersArray[
                                  parentUserIndex
                                ].settings.structures.reaction.forEach((i) => {
                                  if (i.id === entry.id) {
                                    i.default = true;
                                  } else {
                                    i.default = false;
                                  }
                                });
                                updateUsers(newUsersArray);
                                updateMainUserDoc(newUsersArray);
                              }}
                            >
                              Make Default
                            </Button>
                          </Grid>
                          <Grid item xs={6} align="center">
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() => {
                                let newUsersArray = [...users];
                                newUsersArray[
                                  parentUserIndex
                                ].settings.structures.reaction = newUsersArray[
                                  parentUserIndex
                                ].settings.structures.reaction.filter(
                                  (i) => i.id !== entry.id
                                );
                                if (
                                  newUsersArray[parentUserIndex].settings
                                    .structures.reaction.length > 0 &&
                                  entry.default === true
                                ) {
                                  newUsersArray[
                                    parentUserIndex
                                  ].settings.structures.reaction[0].default = true;
                                }
                                updateUsers(newUsersArray);
                                updateMainUserDoc(newUsersArray);
                                logEvent(
                                  analytics,
                                  "Remove Reaction Structure",
                                  {
                                    UID: newUsersArray[parentUserIndex]
                                      .accountID,
                                  }
                                );
                              }}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              }
            )}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
