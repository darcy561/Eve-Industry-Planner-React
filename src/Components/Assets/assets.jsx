import { Grid } from "@mui/material";
import { ESIOffline } from "../offlineNotification";
import { AssetTypeSelectPanel } from "./AssetTypeSelect";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header";
import useCheckUserAuthState from "../../Hooks/Auth Hooks/useCheckUserState";

export default function AssetLibrary({ colorMode }) {
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();

  useCheckUserAuthState();

  return (
    <>
      <Header colorMode={colorMode} />
      <Grid container sx={{ marginTop: 8 }} spacing={2}>
        <ESIOffline />
        <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
          <AssetTypeSelectPanel parentUser={parentUser} />
        </Grid>
        <Footer />
      </Grid>
    </>
  );
}
