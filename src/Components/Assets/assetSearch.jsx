import {
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { useContext } from "react";
import { EveIDsContext } from "../../Context/EveDataContext";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Select: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
  },
}));

export function AssetSearch({
  locationList,
  selectedLocation,
  updateSelectedLocation,
  pageLoad,
}) {
  const { eveIDs } = useContext(EveIDsContext);

  const classes = useStyles();

  return (
    <Paper
      square={true}
      elevation={2}
      sx={{
        padding: "20px",
      }}
    >
      <Grid container>
        {pageLoad ? (
          <Grid item xs={6}>
            <FormControl className={classes.Select} fullWidth>
              <Select
                value={selectedLocation}
                size="small"
                onChange={(e) => {
                  updateSelectedLocation(e.target.value);
                }}
              >
                {locationList.map((entry) => {
                  let locationNameData = eveIDs.find((i) => entry === i.id);

                  if (
                    locationNameData === undefined ||
                    locationNameData.name === "No Access To Location"
                  ) {
                    return null;
                  }
                  return (
                    <MenuItem key={entry} value={entry}>
                      {locationNameData.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Asset Locations
              </FormHelperText>
            </FormControl>
          </Grid>
        ) : (
          <Grid item xs={12} align="center">
            <CircularProgress color="primary" />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
