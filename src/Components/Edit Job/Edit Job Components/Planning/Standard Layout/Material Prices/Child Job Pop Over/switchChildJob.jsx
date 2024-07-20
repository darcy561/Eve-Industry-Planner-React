import { Grid, IconButton, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { STANDARD_TEXT_FORMAT } from "../../../../../../../Context/defaultValues";

export function ChildJobSwitcher_ChildJobPopoverFrame({
  childJobObjects,
  jobDisplay,
  setJobDisplay,
}) {
  if (childJobObjects.length > 1) {
    return (
      <Grid container item xs={12} sx={{ marginTop: "10px" }}>
        <Grid item xs={1}>
          <IconButton
            disabled={jobDisplay === 0}
            onClick={() => {
              setJobDisplay((prev) => prev - 1);
            }}
          >
            <ArrowBackOutlinedIcon />
          </IconButton>
        </Grid>
        <Grid
          container
          item
          xs={10}
          justifyContent="center"
          alignItems="center"
        >
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Toggle Child Jobs
          </Typography>
        </Grid>
        <Grid item xs={1}>
          <IconButton
            disabled={jobDisplay === childJobObjects.length}
            onClick={() => {
              setJobDisplay((prev) => prev + 1);
            }}
          >
            <ArrowForwardOutlinedIcon />
          </IconButton>
        </Grid>
      </Grid>
    );
  }
}
