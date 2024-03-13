import { Grid } from "@mui/material";
import { ESIOffline } from "../offlineNotification";
import { AssetTypeSelectPanel } from "./AssetTypeSelect";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export default function AssetLibrary() {
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <ESIOffline />
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <AssetTypeSelectPanel parentUser={parentUser} />
      </Grid>
    </Grid>
  );
}
