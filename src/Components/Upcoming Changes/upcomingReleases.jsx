import { Grid } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { PageLoadContext } from "../../Context/LayoutContext";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { LoadingPage } from "../loadingPage";
import { ManufacturingOptionsUpcomingChanges } from "./manufacturingOptions";
import { ReactionOptionsUpcomingChanges } from "./reactionOptions";
import { UpcomingChangesSearch } from "./searchBar";
import { SisiItem } from "./sisiItem";
import { TranqItem } from "./tranqItem";

export function UpcomingChanges() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { RefreshUserAToken, reloadMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);
  const [itemLoad, updateItemLoad] = useState(false);
  const [tranqItem, updateTranqItem] = useState(null);
  const [sisiItem, updateSisiItem] = useState(null);

  let parentUser = useMemo(() => {
    return users.find((u) => u.ParentUser);
  }, [users]);

  useEffect(async () => {
    if (isLoggedIn) {
      if (parentUser.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        let newUsersArray = [...users];
        const index = newUsersArray.findIndex((i) => i.ParentUser);
        newUsersArray[index] = await RefreshUserAToken(parentUser);
        updateUsers(newUsersArray);
      }
      updatePageLoad(false);
    } else {
      if (localStorage.getItem("Auth") == null) {
        updatePageLoad(false);
      } else {
        reloadMainUser(localStorage.getItem("Auth"));
      }
    }
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    return (
      <Grid
        container
        sx={{
          paddingLeft: { xs: "10px", sm: "20px" },
          paddingRight: { xs: "10px", sm: "20px" },
          marginTop: "5px",
        }}
        spacing={2}
      >
        <Grid item xs={12}>
          <UpcomingChangesSearch
            updateTranqItem={updateTranqItem}
            updateSisiItem={updateSisiItem}
            updateItemLoad={updateItemLoad}
          />
        </Grid>
        <Grid item xs={12}>
          {tranqItem !== null && sisiItem !== null ? (
            tranqItem.jobType === jobTypes.manufacturing &&
            sisiItem.jobType === jobTypes.manufacturing ? (
              <ManufacturingOptionsUpcomingChanges
                tranqItem={tranqItem}
                updateTranqItem={updateTranqItem}
                sisiItem={sisiItem}
                updateSisiItem={updateSisiItem}
                itemLoad={itemLoad}
              />
            ) : tranqItem.jobType === jobTypes.reaction &&
              sisiItem.jobType === jobTypes.reaction ? (
              <ReactionOptionsUpcomingChanges
                tranqItem={tranqItem}
                updateTranqItem={updateTranqItem}
                sisiItem={sisiItem}
                updateSisiItem={updateSisiItem}
                itemLoad={itemLoad}
              />
            ) : null
          ) : null}
        </Grid>
        <Grid container item xs={12} spacing={2} sx={{}}>
          <Grid item xs={12} md={6}>
            <TranqItem tranqItem={tranqItem} itemLoad={itemLoad} />
          </Grid>
          <Grid item xs={12} md={6}>
            <SisiItem sisiItem={sisiItem} itemLoad={itemLoad} />
          </Grid>
        </Grid>
      </Grid>
    );
  }
}
