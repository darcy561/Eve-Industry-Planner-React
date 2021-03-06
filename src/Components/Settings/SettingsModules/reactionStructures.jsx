import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { structureOptions } from "../../../Context/defaultValues";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "@mui/styles";
import { useState } from "react";
import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { Masonry } from "@mui/lab";
import { useFirebase } from "../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { SnackBarDataContext } from "../../../Context/LayoutContext";

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
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [textValue, updateTextValue] = useState("");
  const [systemValue, updateSystemValue] = useState(
    structureOptions.reactionSystem[0].value
  );
  const [structValue, updateStructValue] = useState(
    structureOptions.reactionStructure[0].value
  );
  const [rigsValue, updateRigsValue] = useState(
    structureOptions.reactionRigs[0].value
  );
  const [taxValue, updateTaxValue] = useState("");
  const classes = useStyles();
  const analytics = getAnalytics();

  const handleSubmit = (event) => {
    event.preventDefault();
    let newUsersArray = [...users];
    newUsersArray[parentUserIndex].settings.structures.reaction.push({
      id: Date.now(),
      name: textValue,
      systemType: systemValue,
      structureName: structValue,
      structureValue: 1,
      rigType: rigsValue,
      default:
        newUsersArray[parentUserIndex].settings.structures.reaction.length === 0
          ? true
          : false,
      tax: taxValue,
    });
    updateMainUserDoc(newUsersArray);
    updateUsers(newUsersArray);
    logEvent(analytics, "Add Reaction Structure", {
      UID: newUsersArray[parentUserIndex].accountID,
    });
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${textValue} Added`,
      severity: "success",
      autoHideDuration: 1000,
    }));
  };

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
                <form onSubmit={handleSubmit}>
                  <Grid container item xs={12}>
                    <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                      <TextField
                        required={true}
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
                          updateTextValue(input);
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sx={{ paddingLeft: "5px" }}>
                      <FormControl
                        className={classes.TextField}
                        fullWidth={true}
                      >
                        <Select
                          variant="standard"
                          size="small"
                          value={systemValue}
                          onChange={(e) => {
                            updateSystemValue(e.target.value);
                          }}
                        >
                          {structureOptions.reactionSystem.map((entry) => {
                            return (
                              <MenuItem key={entry.label} value={entry.value}>
                                {entry.label}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        <FormHelperText variant="standard">
                          System Type
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                      <FormControl
                        className={classes.TextField}
                        fullWidth={true}
                      >
                        <Select
                          variant="standard"
                          size="small"
                          value={structValue}
                          onChange={(e) => {
                            updateStructValue(e.target.value);
                          }}
                        >
                          {structureOptions.reactionStructure.map((entry) => {
                            return (
                              <MenuItem key={entry.label} value={entry.value}>
                                {entry.label}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        <FormHelperText variant="standard">
                          Structure Type
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingLeft: "5px" }}>
                      <FormControl
                        className={classes.TextField}
                        fullWidth={true}
                      >
                        <Select
                          variant="standard"
                          size="small"
                          value={rigsValue}
                          onChange={(e) => {
                            updateRigsValue(e.target.value);
                          }}
                        >
                          {structureOptions.reactionRigs.map((entry) => {
                            return (
                              <MenuItem key={entry.label} value={entry.value}>
                                {entry.label}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        <FormHelperText variant="standard">
                          Rig Type
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                      <FormControl
                        className={classes.TextField}
                        fullWidth={true}
                      >
                        <Tooltip
                          title="Calculation not yet implemented"
                          arrow
                          placement="right"
                        >
                          <TextField
                            required={true}
                            size="small"
                            variant="standard"
                            className={classes.TextField}
                            helperText="Installation Tax %"
                            type="number"
                            onBlur={(e) => {
                              updateTaxValue(e.target.value / 100);
                            }}
                          />
                        </Tooltip>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} align="center">
                      <Tooltip title="Add new structure" arrow postion="bottom">
                        <IconButton size="small" color="primary" type="submit">
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </form>
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
                const systemText = structureOptions.reactionSystem.find(
                  (x) => x.value === entry.systemType
                );
                const structureText = structureOptions.reactionStructure.find(
                  (x) => x.value === entry.structureName
                );
                const rigText = structureOptions.reactionRigs.find(
                  (x) => x.value === entry.rigType
                );
                return (
                  <Grid key={entry.id} item xs={12}>
                    <Card
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
