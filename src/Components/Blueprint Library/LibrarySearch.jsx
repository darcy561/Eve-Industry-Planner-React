import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import { useContext, useState } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { ApiJobsContext } from "../../Context/JobContext";
import itemList from "../../RawData/searchIndex.json";

export function LibrarySearch({ updateBlueprintData }) {
  const [displayAll, changeDisplayAll] = useState(true);
  const [displayActive, changeDisplayActive] = useState(false);
  const [displayReactions, changeDisplayReactions] = useState(false);
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  return (
    <Paper
      square={true}
      elevation={2}
      sx={{
        padding: "20px",
      }}
    >
      <Grid container>
        <Grid item xs={12} sm={5} md={4} xl={2}>
          <Autocomplete
            disableClearable
            fullWidth
            id="Blueprint Search"
            clearOnBlur
            blurOnSelect
            variant="standard"
            size="small"
            options={itemList}
            getOptionLabel={(option) => option.name}
            onChange={(event, value) => {
              let tempArray = [];
              let idArray = new Set();
              for (let user of users) {
                tempArray = tempArray.concat(user.apiBlueprints);
              }
              tempArray = tempArray.filter(
                (i) => i.type_id == value.blueprintID
              );
              tempArray.forEach((bp) => {
                idArray.add(bp.type_id);
              });
              updateBlueprintData({
                ids: [...idArray],
                blueprints: tempArray,
              });
              if (displayAll) {
                changeDisplayAll((prev) => !prev);
              }
              if (displayActive) {
                changeDisplayActive((prev) => !prev);
              }
              if (displayReactions) {
                changeDisplayReactions((prev) => !prev);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Search"
                nargin="none"
                variant="standard"
                InputProps={{ ...params.InputProps, type: "search" }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={7} md={8} xl={10}>
          <FormControl>
            <RadioGroup row>
              <FormControlLabel
                control={
                  <Radio
                    checked={displayAll}
                    onChange={() => {
                      let tempArray = [];
                      let idArray = new Set();
                      if (displayActive) {
                        changeDisplayActive((prev) => !prev);
                      }
                      if (displayReactions) {
                        changeDisplayReactions((prev) => !prev);
                      }
                      for (let user of users) {
                        tempArray = tempArray.concat(user.apiBlueprints);
                      }
                      tempArray.forEach((bp) => {
                        idArray.add(bp.type_id);
                      });

                      updateBlueprintData({
                        ids: [...idArray],
                        blueprints: tempArray,
                      });
                      changeDisplayAll((prev) => !prev);
                    }}
                  />
                }
                label="All"
              />
              <FormControlLabel
                control={
                  <Radio
                    checked={displayActive}
                    onChange={() => {
                      let tempArray = [];
                      let idArray = new Set();
                      if (displayAll) {
                        changeDisplayAll((prev) => !prev);
                      }
                      if (displayReactions) {
                        changeDisplayReactions((prev) => !prev);
                      }
                      for (let user of users) {
                        tempArray = tempArray.concat(user.apiBlueprints);
                      }

                      tempArray = tempArray.filter((blueprint) =>
                        apiJobs.some(
                          (job) =>
                            job.blueprint_id === blueprint.item_id &&
                            job.status === "active"
                        )
                      );
                      tempArray.forEach((bp) => {
                        idArray.add(bp.type_id);
                      });

                      updateBlueprintData({
                        ids: [...idArray],
                        blueprints: tempArray,
                      });

                      changeDisplayActive((prev) => !prev);
                    }}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Radio
                    checked={displayReactions}
                    onChange={() => {
                      let tempArray = [];
                      let idArray = new Set();
                      if (displayAll) {
                        changeDisplayAll((prev) => !prev);
                      }
                      if (displayActive) {
                        changeDisplayActive((prev) => !prev);
                      }
                      for (let user of users) {
                        tempArray = tempArray.concat(user.apiBlueprints);
                      }

                      tempArray = tempArray.filter((blueprint) =>
                        itemList.some(
                          (item) =>
                            item.blueprintID === blueprint.type_id &&
                            item.jobType === jobTypes.reaction
                        )
                      );
                      tempArray.forEach((bp) => {
                        idArray.add(bp.type_id);
                      });

                      updateBlueprintData({
                        ids: [...idArray],
                        blueprints: tempArray,
                      });
                      changeDisplayReactions((prev) => !prev);
                    }}
                  />
                }
                label="Reactions"
              />
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
}
