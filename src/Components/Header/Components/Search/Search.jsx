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

  const fbJobs = firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).collection("Jobs");

  async function createJobProcess(itemID) {
    if (isLoggedIn == false && jobArray.length >= 10) {
      alert(
        "You have exceeded the maximum number of jobs you can create as an unregistered user. Sign into your Eve Account to create more, jobs that have been created without without registering will not be saved."
      );
    } else if (isLoggedIn && jobArray.length >= 100) {
      alert(
        "You currently cannot create more than 100 individual job cards. Remove existing job cards to add more."
      );
    } else {
      updateDataExchange(true);
      const outputObject = await createJob(itemID);
      updateJobArray((prevArray) => [...prevArray, outputObject]);
      if (isLoggedIn) {
        fbJobs.doc(outputObject.jobID).set({
          JSON: JSON.stringify(outputObject),
        });
      };
      updateDataExchange(false);
    };  
  };

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
            style={{ background: "white", borderRadius: "5px" }}
            InputProps={{ ...params.InputProps, type: "search" }}
          />
        )}
      />
    </Box>
  );
}
