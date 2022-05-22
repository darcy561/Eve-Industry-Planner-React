import { Autocomplete, Grid, Paper, TextField } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import itemList from "../../RawData/searchIndex.json";

export function LibrarySearch({ updateBlueprintData }) {
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
          fff
        </Grid>
      </Grid>
    </Paper>
  );
}
