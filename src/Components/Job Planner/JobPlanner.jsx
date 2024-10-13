import { lazy, useContext, Suspense, useState } from "react";
import { PlannerAccordion } from "./Planner Components/accordion";
import {
  JobPlannerPageTriggerContext,
  PageLoadContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { SearchBar } from "./Planner Components/searchbar";
import { Box, Toolbar, useMediaQuery } from "@mui/material";
import { ShoppingListDialog } from "../Dialogues/Shopping List/ShoppingList";
import { PriceEntryDialog } from "../Dialogues/Price Entry/PriceEntryList";
import { MassBuildFeedback } from "./Planner Components/massBuildInfo";
import { ESIOffline } from "../offlineNotification";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";
import { Header } from "../Header";
import LeftCollapseableMenuDrawer from "../SideMenu/leftMenuDrawer";
import { Footer } from "../Footer/Footer";
import useCheckUserAuthState from "../../Hooks/Auth Hooks/useCheckUserState";
import CollapseableContentDrawer_Right from "../SideMenu/rightContentDrawer";
import RightSideMenuContent_JobPlanner from "./Planner Components/Side Menu/rightMenuContents";
import { useJobPlannerSideMenuFunctions } from "./Planner Components/Side Menu/Buttons/buttonfunctions";

export default function JobPlanner({ colorMode }) {
  const { pageLoad } = useContext(PageLoadContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const [expandRightContentMenu, updateExpandRightContentMenu] =
    useState(false);
  const [rightContentMenuContentID, updateRightContentMenuContentID] =
    useState(null);
  const [skeletonElementsToDisplay, setSkeletonElementsToDisplay] = useState(0);

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  useCheckUserAuthState();

  const buttonOptions = useJobPlannerSideMenuFunctions(
    updateExpandRightContentMenu,
    rightContentMenuContentID,
    updateRightContentMenuContentID
  );

  if (!loginInProgressComplete) {
    return <UserLogInUI />;
  } else {
    if (pageLoad) {
      return <LoadingPage />;
    } else {
      return (
        <>
          <Header colorMode={colorMode} />

          <LeftCollapseableMenuDrawer inputDrawerButtons={buttonOptions} />

          <Box
            component="main"
            sx={{
              minHeight: "100vh",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              paddingTop: 10,
              paddingX: 2,
              gap: 2,
            }}
          >
            <ESIOffline />
            {!deviceNotMobile && rightContentMenuContentID === 1 && (
              <SearchBar
                updateRightContentMenuContentID={
                  updateRightContentMenuContentID
                }
                setSkeletonElementsToDisplay={setSkeletonElementsToDisplay}
              />
            )}

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: { xs: "center", md: "flex-start" },
                gap: 2,
                width: "100%",
                flex: 1,
              }}
            >
              <PlannerAccordion
                skeletonElementsToDisplay={skeletonElementsToDisplay}
              />
            </Box>

            <Footer />
          </Box>
          {deviceNotMobile && (
            <CollapseableContentDrawer_Right
              DrawerContent={
                <RightSideMenuContent_JobPlanner
                  rightContentMenuContentID={rightContentMenuContentID}
                  updateRightContentMenuContentID={
                    updateRightContentMenuContentID
                  }
                  updateExpandRightContentMenu={updateExpandRightContentMenu}
                  setSkeletonElementsToDisplay={setSkeletonElementsToDisplay}
                />
              }
              expandRightContentMenu={expandRightContentMenu}
              updateExpandRightContentMenu={updateExpandRightContentMenu}
            />
          )}
          <ShoppingListDialog />
          <MassBuildFeedback />
          <PriceEntryDialog />
        </>
      );
    }
  }
}
