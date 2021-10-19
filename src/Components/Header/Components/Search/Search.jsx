import React, { useContext } from "react";
import itemList from "./object_recipe_names.json";
import { createJob } from "../../../Job Planner/JobBuild";
import { JobArrayContext } from "../../../../Context/JobContext";
import { Autocomplete } from "@material-ui/lab";
import { Box, TextField } from "@material-ui/core";
import { IsLoggedInContext, DataExchangeContext, MainUserContext } from "../../../../Context/AuthContext";
import firebase from '../../../../firebase';
import { UploadJobPlanner } from "../../../Job Planner/Planner Components/FirebaseCom"

export function Search() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { mainUser } = useContext(MainUserContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);

  const fbCol = firebase.firestore().collection("JobPlanner");

  async function createJobProcess(itemID) {
    updateDataExchange(true);
    const outputObject = await createJob(itemID);
    updateJobArray((prevArray) => [...prevArray, outputObject]);
    if (isLoggedIn) {
      fbCol.doc(`${mainUser.CharacterHash}`).set({
        JSON: JSON.stringify(jobArray)
      });
    }

    updateDataExchange(false);
  }

  return (
    <Box style={{ width: "15%", marginRight: "2%" }}>
      <Autocomplete
      fullWidth
      freeSolo
      id="Recipe Search"
      clearOnBlur={true}
      clearOnEscape={true}
      blurOnSelect={true}
      options={itemList}
      getOptionLabel={(option) => option.name}
      onChange={(event, value) => {
        if (value !== null) {          
          createJobProcess(value.itemID);
        }
      }}
        renderInput={(params) => (
        <TextField
          {...params}
          margin="normal"
          variant="outlined"
          style={{background:"white", borderRadius:"5px"}}
          InputProps={{ ...params.InputProps, type: "search" }}
        />
      )}
      />
      </Box>
  );
}
