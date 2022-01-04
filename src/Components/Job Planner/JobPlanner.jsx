import { lazy, useContext, useEffect, useState, Suspense } from "react";
import { IsLoggedInContext, MainUserContext } from "../../Context/AuthContext";
import { PlannerAccordion } from "./Planner Components/accordion";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { SearchBar } from "./Planner Components/searchbar";
import { Grid } from "@mui/material";

const EditJob = lazy(() => import("./Edit Job/EditJob"));

export let blueprintVariables = {
  me: [
    { value: 0, label: "0" },
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7" },
    { value: 8, label: "8" },
    { value: 9, label: "9" },
    { value: 10, label: "10" },
  ],
  te: [
    { value: 0, label: "0" },
    { value: 1, label: "2" },
    { value: 2, label: "4" },
    { value: 3, label: "6" },
    { value: 4, label: "8" },
    { value: 5, label: "10" },
    { value: 6, label: "12" },
    { value: 7, label: "14" },
    { value: 8, label: "16" },
    { value: 9, label: "18" },
    { value: 10, label: "20" },
  ],
  manStructure: [
    { value: "Station", label: "Station" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
    { value: "X-Large", label: "X-Large" },
  ],
  manRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
  manSystem: [
    { value: 1, label: "High Sec" },
    { value: 1.9, label: "Low Sec" },
    { value: 2.1, label: "Null Sec / WH" },
  ],
  reactionSystem: [
    { value: 1, label: "Low Sec" },
    { value: 1.1, label: "Null Sec / WH" },
  ],
  reactionStructure: [
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
  ],
  reactionRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
};

export let jobTypes = {
  baseMaterial: 0,
  manufacturing: 1,
  reaction: 2,
  pi: 3,
};

export function JobPlanner() {
  const [jobSettingsTrigger, updateJobSettingsTrigger] = useState(false);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { refreshMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);

  useEffect(async () => {
    if (
      mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) ||
      mainUser.aTokenEXP == null
    ) {
      if (localStorage.getItem("Auth") != null) {
        refreshMainUser(localStorage.getItem("Auth"));
      } else {
        updateIsLoggedIn(false);
        updatePageLoad(false);
      }
    } else {
      updatePageLoad(false);
    }
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    if (jobSettingsTrigger) {
      return (
        <Suspense fallback={<LoadingPage />}>
          <Grid container sx={{ marginTop: "10px" }}>
            <Grid item>
              <EditJob updateJobSettingsTrigger={updateJobSettingsTrigger} />
            </Grid>
          </Grid>
        </Suspense>
      );
    } else {
      return (
        <Grid container direction="column" sx={{ marginTop: "5px" }} spacing={2}>
            <Grid item>
              <SearchBar />
            </Grid>
            <Grid item>
              <PlannerAccordion
                updateJobSettingsTrigger={updateJobSettingsTrigger}
              />
            </Grid>
        </Grid>
      );
    }
  }
}
