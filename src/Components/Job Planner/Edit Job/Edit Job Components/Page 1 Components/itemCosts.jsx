import {
  Autocomplete,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";

export function ItemCostPanel() {
  const { activeJob } = useContext(ActiveJobContext);
  const { addNewJob } = useFirebase();
  const [marketSelect, updateMarketSelect] = useState(2);
    const marketOptions = [
        { id: 0, name: "Amarr" },
        { id: 1, name: "Dodixie" },
        { id: 2, name: "Jita" },
      ]
  return (
    <Paper
      elevation={3}
      square={true}
      sx={{ minWidth: "100%", padding: "20px", position: "relative" }}
    >
      <Grid container>
        <Grid item xs={12} align="center">
          <Typography variant="h6" color="primary">
            Market Prices
          </Typography>
        </Grid>
        <Autocomplete
                  disableClearable={true}
                  defaultValue={marketOptions.find((x)=> x.id === marketSelect)}
          size="small"
          options={marketOptions}
          onChange={(e, v) => {
            updateMarketSelect(v.id);
            console.log(v.id);
          }}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} variant="standard" />}
          sx={{
            width: "90px",
            position: "absolute",
            top: "20px",
            right: "30px",
          }}
        />
        <Grid item xs={12}></Grid>
      </Grid>
    </Paper>
  );
}
