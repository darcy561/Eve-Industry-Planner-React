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
import { ShoppingListDialog } from "./Dialogues/ShoppingList/ShoppingList";
import { PriceEntryDialog } from "./Dialogues/PriceEntry/PriceEntryList";
import { MassBuildFeedback } from "./Planner Components/massBuildInfo";
import { ESIOffline } from "../offlineNotification";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";
import { Header } from "../Header";
import CollapseableMenuDrawer from "../SideMenu/leftMenuDrawer";
import { SideMenuContent_JobPlanner } from "./Planner Components/Side Menu/sideMenuContent";
import { Footer } from "../Footer/Footer";
import useCheckUserAuthState from "../../Hooks/Auth Hooks/useCheckUserState";
import CollapseableContentDrawer_Right from "../SideMenu/rightContentDrawer";
import RightSideMenuContent_JobPlanner from "./Planner Components/Side Menu/rightMenuContents";

const EditGroup = lazy(() => import("./Groups/GroupPage"));

export default function JobPlanner({ colorMode }) {
  const { editGroupTrigger, updateEditGroupTrigger } = useContext(
    JobPlannerPageTriggerContext
  );
  const { pageLoad } = useContext(PageLoadContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const [expandRightContentMenu, updateExpandRightContentMenu] =
    useState(false);
  const [rightContentMenuContentID, updateRightContentMenuContentID] =
    useState(null);

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  useCheckUserAuthState();

  if (!loginInProgressComplete) {
    return <UserLogInUI />;
  } else {
    if (pageLoad) {
      return <LoadingPage />;
    } else {
      if (editGroupTrigger) {
        return (
          <Suspense fallback={<LoadingPage />}>
            <ShoppingListDialog />
            <PriceEntryDialog />
            <Header colorMode={colorMode} />
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
                <EditGroup updateEditGroupTrigger={updateEditGroupTrigger} />
              </Box>
              <Footer />
            </Box>
          </Suspense>
        );
      } else {
        return (
          <>
            <Header colorMode={colorMode} />

            <CollapseableMenuDrawer
              expandRightContentMenu={expandRightContentMenu}
              updateExpandRightContentMenu={updateExpandRightContentMenu}
              rightContentMenuContentID={rightContentMenuContentID}
              updateRightContentMenuContentID={updateRightContentMenuContentID}
              DrawerContents={SideMenuContent_JobPlanner}
            />

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
                <SearchBar updateRightContentMenuContentID={updateRightContentMenuContentID} />
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
                <PlannerAccordion />
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
}
