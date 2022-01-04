import { useContext } from "react";
import {
  Autocomplete,
  CircularProgress,
  Grid,
  Paper,
  TextField,
} from "@mui/material";
import itemList from "../../../RawData/searchIndex.json";
import { useCreateJobProcess } from "../../../Hooks/useCreateJob";
import { DataExchangeContext } from "../../../Context/LayoutContext";

export function SearchBar() {
  const { DataExchange } = useContext(DataExchangeContext);
  const { newJobProcess } = useCreateJobProcess();
  return (
    <Paper
      sx={{
        padding: "20px",
        marginRight: { md: "10px" }, marginLeft: { md: "10px" },
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row" alignItems="center">
        <Grid item xs={11} sm={5} md={4} xl={2}>
          <Autocomplete
            disableClearable={true}
            fullWidth
            freeSolo
            id="Recipe Search"
            clearOnBlur={true}
            clearOnEscape={true}
            blurOnSelect={true}
            variant="standard"
            size="small"
            options={itemList}
            getOptionLabel={(option) => option.name}
            onChange={(event, value) => {
              if (value != null) {
                newJobProcess(value.itemID, null);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Item Search"
                margin="none"
                variant="standard"
                style={{ background: "white", borderRadius: "5px" }}
                InputProps={{ ...params.InputProps, type: "search" }}
              />
            )}
          />
        </Grid>
        {DataExchange &&
          <Grid item xs={1} sx={{ paddingLeft: { xs:"5px", sm:"0px"}}}>
            <CircularProgress size="24px" edge="false" />
          </Grid>
        }
      </Grid>
    </Paper>
  );
}
