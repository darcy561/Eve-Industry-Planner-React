import React, { useContext } from "react";
import itemList from "./object_recipe_names.json";
import { Autocomplete } from "@material-ui/lab";
import { Container, TextField } from "@material-ui/core";
import { useCreateJobProcess } from "../../../../Hooks/useCreateJob";
import { IsLoggedInContext } from "../../../../Context/AuthContext";

export function Search() {
  const { newJobProcess } = useCreateJobProcess();
  const { isLoggedIn } = useContext(IsLoggedInContext);

  return (
    <Container style={{ width: "15%", marginRight: "2%"}}>
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
          if (value != null) {
            newJobProcess(value.itemID, null);
            console.log(isLoggedIn)
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
    </Container>
  );
};