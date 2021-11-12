import React, { useContext } from "react";
import itemList from "./object_recipe_names.json";
import { createJob } from "../../../Job Planner/JobBuild";
import { JobArrayContext } from "../../../../Context/JobContext";
import { Autocomplete } from "@material-ui/lab";
import { Box, TextField } from "@material-ui/core";
import { IsLoggedInContext, MainUserContext } from "../../../../Context/AuthContext";
import { DataExchangeContext, DialogDataContext, SnackBarDataContext } from "../../../../Context/LayoutContext";
import firebase from '../../../../firebase';
import { UploadJobPlanner } from "../../../Job Planner/Planner Components/FirebaseCom"
import { CalculateTotals } from "../../../Job Planner/Edit Job/blueprintCalcs";

export function Search() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { mainUser } = useContext(MainUserContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);

  const fbJobs = firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).collection("Jobs");

  async function createJobProcess(itemID) {
    if (isLoggedIn == false && jobArray.length >= 8) {
      updateDialogData((prev) => ({
        ...prev, buttonText: "Close", id: "Max-Jobs-Exceeded", open: true, title: "Job Count Exceeded", body: "You have exceeded the maximum number of jobs you can create as an unregistered user. Sign into your Eve Account to create more. Jobs that have been created without registering will be lost upon leaving/refreshing the page."
      }));
    } else if (isLoggedIn && jobArray.length >= 100) {
      updateDialogData((prev) => ({
        ...prev, buttonText: "Close", id: "Max-Jobs-Exceeded", open: true, title: "Job Count Exceeded", body: "You currently cannot create more than 100 individual job cards. Remove existing job cards to add more."
      }));
    } else {
      updateDataExchange(true);
      const outputObject = await createJob(itemID);
      outputObject.job.materials = CalculateTotals(outputObject);
      updateJobArray((prevArray) => [...prevArray, outputObject]);
      if (isLoggedIn) {
        fbJobs.doc(outputObject.jobID).set({
          JSON: JSON.stringify(outputObject),
        });
      };
      setSnackbarData((prev) => ({
        ...prev, open: true, message: `${outputObject.name} Added`, severity: "success", autoHideDuration: 3000,
      }));
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
