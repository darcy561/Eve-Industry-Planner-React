import { Grid } from "@mui/material";
import { useContext, useMemo } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { ESIOffline } from "../offlineNotification";
import { AssetTypeSelectPanel } from "./AssetTypeSelect";

export default function AssetLibrary() {
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <ESIOffline />
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <AssetTypeSelectPanel parentUser={parentUser} />
      </Grid>
    </Grid>
  );
}
