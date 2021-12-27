import React, { useContext, useState } from "react";
import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";

import { BiMinus } from "react-icons/bi";
import { BuildStats } from "./Page 4 Components/buildStats";
import { ExtrasList } from "./Page 4 Components/extras";

export function EditPage4({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [extras, updateExtras] = useState({ text: "", value: 0 });
  const { setSnackbarData } = useContext(SnackBarDataContext);

  return (
    <Grid container direction="row" spacing={2}>
      <Grid item xs={12} md={6}>
        <ExtrasList setJobModified={setJobModified} />
      </Grid>
      <Grid item xs={12} md={6}>
        <BuildStats setJobModified={setJobModified} />
      </Grid>
    </Grid>
  );
}
