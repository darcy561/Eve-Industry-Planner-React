import { useState } from "react";
import { Grid, Paper } from "@mui/material";

export function BlueprintLibrary() {
    const [blueprintResults, updateBlueprintResults] = useState([]);
    
    

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <Grid item xs={12}>
        <Paper
          square={true}
          elevation={2}
          sx={{
            padding: "20px",
          }}
          spacing={2}
        >
          ffff
        </Paper>
      </Grid>
    </Grid>
  );
}
