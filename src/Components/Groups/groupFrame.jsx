import { useContext, useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Header } from "../Header";
import useSetupUnmountEventListeners from "../../Hooks/GeneralHooks/useSetupUnmountEventListeners";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { LoadingPage } from "../loadingPage";
import { ESIOffline } from "../offlineNotification";
import { SearchBar } from "../Job Planner/Planner Components/searchbar";
import { ShoppingListDialog } from "../Dialogues/Shopping List/ShoppingList";
import { useNavigate, useParams } from "react-router-dom";
import LeftCollapseableMenuDrawer from "../SideMenu/leftMenuDrawer";
import { Footer } from "../Footer/Footer";
import CollapseableContentDrawer_Right from "../SideMenu/rightContentDrawer";
import RightSideMenuContent_GroupPage from "./Side Menu/rightSideMenuContent";
import GroupAccordionFrame from "./Accordion/AccordionFrame";
import { useFirebase } from "../../Hooks/useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
} from "../../Context/AuthContext";
import manageListenerRequests from "../../Functions/Firebase/manageListenerRequests";
import GroupNameFrame from "./Group Name/groupNameFrame";
import { MultiSelectJobPlannerContext } from "../../Context/LayoutContext";
import { useGroupPageSideMenuFunctions } from "./Side Menu/Buttons/buttonFunctions";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";
import getMissingJobObjects from "../../Functions/Helper/getMissingJobObjects";

function GroupPageFrame({ colorMode }) {
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray, groupArray } = useContext(JobArrayContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const [expandRightContentMenu, updateExpandRightContentMenu] =
    useState(false);
  const [rightContentMenuContentID, updateRightContentMenuContentID] =
    useState(null);
  const [skeletonElementsToDisplay, setSkeletonElementsToDisplay] = useState(0);
  const [highlightedItems, updateHighlightedItem] = useState(new Set());
  const { getItemPrices } = useFirebase();
  const { groupID } = useParams();

  const navigate = useNavigate();
  const activeGroupObject = groupArray.find((i) => i.groupID === groupID);
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const groupJobs = useMemo(() => {
    if (!activeGroupObject) return [];
    const groupJobs = [...jobArray]
      .filter((job) => activeGroupObject.includedJobIDs.has(job.jobID))
      .sort((a, b) => a.name.localeCompare(b.name));

    return groupJobs;
  }, [jobArray, activeGroupObject]);

  useEffect(() => {
    async function retrieveGroupData() {
      try {
        if (!activeGroupObject) {
          throw new Error("Unable to find requested group");
        }

        const itemPriceRequest = getItemPrices([
          ...activeGroupObject.materialIDs,
        ]);

        const retrievedJobs = await getMissingJobObjects(
          activeGroupObject.includedJobIDs,
          jobArray
        );

        const itemPriceResult = await itemPriceRequest;

        updateEvePrices((prev) => ({
          ...prev,
          ...itemPriceResult,
        }));
        updateActiveGroup(activeGroupObject.groupID);
        updateMultiSelectJobPlanner([]);
        updateJobArray((prev) => {
          const existingIDs = new Set(prev.map(({ jobID }) => jobID));
          return [
            ...prev,
            ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
          ];
        });
        manageListenerRequests(
          activeGroupObject.includedJobIDs,
          updateJobArray,
          updateFirebaseListeners,
          firebaseListeners,
          isLoggedIn
        );
      } catch (err) {
        console.error(err);
        navigate("/jobplanner");
      }
    }
    retrieveGroupData();
  }, [groupArray]);

  useSetupUnmountEventListeners();

  const buttonOptions = useGroupPageSideMenuFunctions(
    groupJobs,
    updateExpandRightContentMenu,
    rightContentMenuContentID,
    updateRightContentMenuContentID
  );

  if (!activeGroup) return <LoadingPage />;

  return (
    <>
      <Header colorMode={colorMode} />

      <ShoppingListDialog />
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
        <GroupNameFrame />
        {!deviceNotMobile && rightContentMenuContentID === 1 && (
          <SearchBar
            updateRightContentMenuContentID={updateRightContentMenuContentID}
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
          <GroupAccordionFrame
            skeletonElementsToDisplay={skeletonElementsToDisplay}
            groupJobs={groupJobs}
            highlightedItems={highlightedItems}
          />
        </Box>
        <Footer />
      </Box>
      {deviceNotMobile && (
        <CollapseableContentDrawer_Right
          DrawerContent={
            <RightSideMenuContent_GroupPage
              groupJobs={groupJobs}
              rightContentMenuContentID={rightContentMenuContentID}
              updateRightContentMenuContentID={updateRightContentMenuContentID}
              updateExpandRightContentMenu={updateExpandRightContentMenu}
              setSkeletonElementsToDisplay={setSkeletonElementsToDisplay}
              highlightedItems={highlightedItems}
              updateHighlightedItem={updateHighlightedItem}
            />
          }
          expandRightContentMenu={expandRightContentMenu}
          updateExpandRightContentMenu={updateExpandRightContentMenu}
        />
      )}
    </>
  );
}

export default GroupPageFrame;
