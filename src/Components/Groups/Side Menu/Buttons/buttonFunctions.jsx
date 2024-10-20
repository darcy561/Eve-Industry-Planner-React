import { useContext, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import Polyline from "@mui/icons-material/Polyline";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import PostAddIcon from "@mui/icons-material/PostAdd";
import {
  ApplicationSettingsContext,
  DialogDataContext,
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
  ShoppingListContext,
} from "../../../../Context/LayoutContext";
import useRightContentDrawer from "../../../SideMenu/Hooks/rightContentMenuHooks";
import useCloseGroup from "../../../../Hooks/GroupHooks/useCloseGroup";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../Context/JobContext";
import { useJobManagement } from "../../../../Hooks/useJobManagement";
import { useMoveItemsOnPlanner } from "../../../../Hooks/GeneralHooks/useMoveItemsOnPlanner";
import { useNavigate } from "react-router-dom";
import { DoneAll } from "@mui/icons-material";
import passBuildCostsToParentJobs from "../../../../Functions/Shared/passBuildCosts";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshot,
  UserJobSnapshotContext,
} from "../../../../Context/AuthContext";
import uploadJobSnapshotsToFirebase from "../../../../Functions/Firebase/uploadJobSnapshots";
import manageListenerRequests from "../../../../Functions/Firebase/manageListenerRequests";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";
import buildFullJobTree from "../../Functions/buildFullJobTree";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { useRecalcuateJob } from "../../../../Hooks/GeneralHooks/useRecalculateJob";

export function useGroupPageSideMenuFunctions(
  groupJobs,
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID
) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateShoppingListTrigger, updateShoppingListData } =
    useContext(ShoppingListContext);
  const { updatePriceEntryListData } = useContext(PriceEntryListContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const { toggleRightDrawerColapse } = useRightContentDrawer();
  const { closeGroup } = useCloseGroup();
  const { buildItemPriceEntry } = useJobManagement();
  const { moveItemsOnPlanner } = useMoveItemsOnPlanner();
  const { buildJob } = useJobBuild();
  const { sendSnackbarNotificationSuccess, sendSnackbarNotificationError } =
    useHelperFunction();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const navigate = useNavigate();
  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  const standardDialogError =
    "You will need to select at least 1 job using the checkbox's on the job cards.";

  const buttons = useMemo(() => {
    return [
      {
        displayText: "Close Group",
        icon: <CloseIcon />,
        hoverColor: "error.main",
        tooltip: "Saves and closes the group.",
        divider: true,
        onClick: () => {
          closeGroup(groupJobs);
          navigate("/jobplanner");
        },
      },
      {
        displayText: "Add New Jobs",
        icon: <PostAddIcon />,
        tooltip: "Adds new jobs to the group.",
        onClick: () => {
          updateRightContentMenuContentID((prev) => (prev === 1 ? null : 1));
          toggleRightDrawerColapse(
            1,
            rightContentMenuContentID,
            updateExpandRightContentMenu
          );
        },
      },
      {
        displayText: "Shopping List",
        icon: <ShoppingCartIcon />,
        tooltip:
          "Displays a shopping list of the remaining materials needed for all group jobs  or selected jobs.",
        onClick: () => {
          const jobList =
            multiSelectJobPlanner.length > 0
              ? multiSelectJobPlanner
              : [...activeGroupObject.includedJobIDs];
          updateShoppingListTrigger((prev) => !prev);
          updateShoppingListData(jobList);
        },
      },
      {
        displayText: "Add Item Costs",
        icon: <PriceCheckIcon />,
        tooltip:
          "Input item costs for all selected jobs or all jobs in the group.",
        onClick: async () => {
          const jobList =
            multiSelectJobPlanner.length > 0
              ? multiSelectJobPlanner
              : [...activeGroupObject.includedJobIDs];

          const itemList = await buildItemPriceEntry(jobList);

          updatePriceEntryListData((prev) => ({
            ...prev,
            open: true,
            list: itemList,
          }));
        },
      },
      {
        displayText: "Build Child Jobs",
        icon: <AccountTreeIcon />,
        tooltip:
          "Adds the next ingrediants of all of the jobs or just the selected jobs.",
        onClick: () => {
          // if (multiSelectJobPlanner.length > 0) {
          //   massBuildMaterials(multiSelectJobPlanner);
          //   updateMultiSelectJobPlanner([]);
          // } else {
          //   throwDialogError(standardDialogError);
          // }
        },
      },
      {
        displayText: "Build Full Tree",
        icon: <Polyline />,
        tooltip: "Adds the full item tree for all output jobs.",
        onClick: async () => {
          const retrievedJobs = [];
          const jobList =
            multiSelectJobPlanner.length > 0
              ? multiSelectJobPlanner
              : [...activeGroupObject.includedJobIDs];

          const g = await buildFullJobTree(
            jobList,
            jobArray,
            retrievedJobs,
            activeGroup,
            groupArray,
            applicationSettings,
            buildJob,
            recalculateJobForNewTotal
          );
        },
      },
      {
        displayText: "Move Backwards",
        icon: <ArrowUpwardIcon />,
        tooltip: "Moves the selected jobs 1 step backwards on the planner.",
        onClick: () => {
          if (multiSelectJobPlanner.length === 0) {
            throwDialogError();
            return;
          }
          moveItemsOnPlanner(multiSelectJobPlanner, "backward");
        },
      },
      {
        displayText: "Move Forwards",
        icon: <ArrowDownwardIcon />,
        tooltip: "Moves the selected jobs 1 step forwards on the planner.",
        onClick: () => {
          if (multiSelectJobPlanner.length === 0) {
            throwDialogError();
            return;
          }
          moveItemsOnPlanner(multiSelectJobPlanner, "forward");
        },
      },
      {
        displayText: "Send Item Costs",
        icon: <DoneAll />,
        tooltip:
          "Sends the selected items costs to their parent jobs and marks the jobs as complete.",
        onClick: async () => {
          if (multiSelectJobPlanner.length === 0) {
            throwDialogError();
            return;
          }
          const retrievedJobs = [];
          const group = groupArray.find((i) => i.groupID === activeGroup);
          group.addAreComplete(multiSelectJobPlanner);
          const messageText = await passBuildCostsToParentJobs(
            multiSelectJobPlanner,
            jobArray,
            userJobSnapshot,
            retrievedJobs
          );
          manageListenerRequests(
            retrievedJobs,
            updateJobArray,
            updateFirebaseListeners,
            firebaseListeners,
            isLoggedIn
          );
          if (messageText) {
            sendSnackbarNotificationSuccess(messageText);
          } else {
            sendSnackbarNotificationError(`No build costs imported.`, 3);
          }
          updateUserJobSnapshot((prev) => [...prev]);
          updateJobArray((prev) => {
            const existingIDs = new Set(prev.map(({ jobID }) => jobID));
            return [
              ...prev,
              ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
            ];
          });
          updateGroupArray([...groupArray]);

          if (isLoggedIn) {
            await uploadJobSnapshotsToFirebase(userJobSnapshot);
          }
        },
      },
      {
        displayText: "Select All",
        icon: <SelectAllIcon />,
        tooltip: "Selects all jobs in the group.",
        onClick: () => {
          updateMultiSelectJobPlanner([
            ...new Set(groupJobs.map((job) => job.jobID)),
          ]);
        },
      },
      {
        displayText: "Clear Selection",
        icon: <DeselectIcon />,
        tooltip: "Clears the selected jobs.",
        disabled: multiSelectJobPlanner.length === 0,
        onClick: () => {
          updateMultiSelectJobPlanner([]);
        },
      },
      {
        displayText: "Delete",
        icon: <DeleteSweepIcon />,
        hoverColor: "error.main",
        tooltip: "Deletes the selected jobs from the group.",
        disabled: multiSelectJobPlanner.length === 0,
        onClick: () => {
          if (multiSelectJobPlanner.length === 0) {
            throwDialogError();
            return;
          }
          deleteMultipleJobs(multiSelectJobPlanner);
          updateMultiSelectJobPlanner([]);
        },
      },
    ];
  }, [
    closeGroup,
    groupJobs,
    multiSelectJobPlanner,
    rightContentMenuContentID,
    toggleRightDrawerColapse,
    updateExpandRightContentMenu,
    updateRightContentMenuContentID,
    updateShoppingListTrigger,
    updateShoppingListData,
  ]);

  function throwDialogError(inputText = standardDialogError) {
    updateDialogData((prev) => ({
      ...prev,
      buttonText: "Close",
      id: "Empty-Multi-Select",
      open: true,
      title: "Oops",
      body: inputText,
    }));
  }

  return buttons;
}
