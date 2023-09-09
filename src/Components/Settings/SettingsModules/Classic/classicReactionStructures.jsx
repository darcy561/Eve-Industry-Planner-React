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
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { structureOptions } from "../../../../Context/defaultValues";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { useContext } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { Masonry } from "@mui/lab";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import systemIDS from "../../../../RawData/systems.json";
import uuid from "react-uuid";
import GLOBAL_CONFIG from "../../../../global-config-app";

export function ClassicReactionStrutures({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [textValue, updateTextValue] = useState("");
  const [systemValue, updateSystemValue] = useState(
    structureOptions.reactionSystem[0].id
  );
  const [structValue, updateStructValue] = useState(
    structureOptions.reactionStructure[0].id
  );
  const [rigsValue, updateRigsValue] = useState(
    structureOptions.reactionRigs[0].id
  );
  const [taxValue, updateTaxValue] = useState("");
  const [systemIDValue, updateSystemIDValue] = useState("");
  const analytics = getAnalytics();
  const {PRIMARY_THEME} = GLOBAL_CONFIG

  const handleSubmit = (event) => {
    event.preventDefault();
    let newUsersArray = [...users];
    newUsersArray[parentUserIndex].settings.structures.reaction.push({
      id: `reacStruct-${uuid()}`,
      name: textValue,
      systemType: systemValue,
      structureType: structValue,
      rigType: rigsValue,
      tax: taxValue,
      systemID: systemIDValue,
      default:
        newUsersArray[parentUserIndex].settings.structures.reaction.length === 0
          ? true
          : false,
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
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
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
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
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
                          {Object.values(structureOptions.reactionSystem).map(
                            (entry) => {
                              return (
                                <MenuItem key={entry.id} value={entry.id}>
                                  {entry.label}
                                </MenuItem>
                              );
                            }
                          )}
                        </Select>
                        <FormHelperText variant="standard">
                          System Type
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                      <FormControl
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
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
                          {Object.values(
                            structureOptions.reactionStructure
                          ).map((entry) => {
                            return (
                              <MenuItem key={entry.id} value={entry.id}>
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
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
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
                          {Object.values(structureOptions.reactionRigs).map(
                            (entry) => {
                              return (
                                <MenuItem key={entry.id} value={entry.id}>
                                  {entry.label}
                                </MenuItem>
                              );
                            }
                          )}
                        </Select>
                        <FormHelperText variant="standard">
                          Rig Type
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingRight: "5px" }}>
                      <FormControl
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
                        fullWidth={true}
                      >
                        <TextField
                          required={true}
                          size="small"
                          variant="standard"
                          helperText="Installation Tax %"
                          inputProps={{
                            step: "0.01",
                          }}
                          type="number"
                          onBlur={(e) => {
                            updateTaxValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ paddingLeft: "5px" }}>
                      <FormControl
                        sx={{
                          "& .MuiFormHelperText-root": {
                            color: (theme) => theme.palette.secondary.main,
                          },
                          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                        }}
                        fullWidth={true}
                      >
                        <Autocomplete
                          disableClearable
                          fullWidth
                          id="System Search"
                          clearOnBlur
                          blurOnSelect
                          variant="standard"
                          size="small"
                          options={systemIDS}
                          getOptionLabel={(option) => option.name}
                          onChange={(event, value) => {
                            updateSystemIDValue(Number(value.id));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              sx={{
                                color: (theme) =>
                                  theme.palette.mode === PRIMARY_THEME
                                    ? "black"
                                    : theme.palette.secondary.main,
                                borderColor: (theme) =>
                                  theme.palette.mode === PRIMARY_THEME
                                    ? "black"
                                    : theme.palette.secondary.main,
                              }}
                              margin="none"
                              variant="standard"
                              style={{ borderRadius: "5px" }}
                              InputProps={{
                                ...params.InputProps,
                                type: "System Name",
                              }}
                            />
                          )}
                        />
                        <FormHelperText variant="standard">
                          System Name
                        </FormHelperText>
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
                const systemText =
                  structureOptions.reactionSystem[entry.systemType]?.label ||
                  "Missing System Type";
                const structureText =
                  structureOptions.reactionStructure[entry.structureType]
                    ?.label || "Missing Structure Type";
                const rigText =
                  structureOptions.reactionRigs[entry.rigType]?.label ||
                  "Missing Rig Type";

                const systemName =
                  systemIDS.find((i) => i.id === entry.systemID)?.name ||
                  "Missing System Name";

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
                              {systemText}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body1">
                              {structureText}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body1">{rigText}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography>{`${entry.tax || 0}%`}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography>{systemName}</Typography>
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
                                  entry.default
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
