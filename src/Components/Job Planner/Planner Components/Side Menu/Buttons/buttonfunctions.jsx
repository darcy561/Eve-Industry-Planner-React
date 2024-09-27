import { useContext, useMemo } from "react";
import {
  DialogDataContext,
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
  ShoppingListContext,
} from "../../../../../Context/LayoutContext";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CallMergeIcon from "@mui/icons-material/CallMerge";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import PostAddIcon from "@mui/icons-material/PostAdd";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { useMoveItemsOnPlanner } from "../../../../../Hooks/GeneralHooks/useMoveItemsOnPlanner";
import { UserJobSnapshotContext } from "../../../../../Context/AuthContext";
import { useDeleteMultipleJobs } from "../../../../../Hooks/JobHooks/useDeleteMultipleJobs";
import useRightContentDrawer from "../../../../SideMenu/Hooks/rightContentMenuHooks";
import { useNavigate } from "react-router-dom";

export function useJobPlannerSideMenuFunctions(
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID
) {
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateShoppingListTrigger, updateShoppingListData } =
    useContext(ShoppingListContext);
  const { updatePriceEntryListData } = useContext(PriceEntryListContext);
  const { massBuildMaterials, buildItemPriceEntry, mergeJobsNew } =
    useJobManagement();
  const { moveItemsOnPlanner } = useMoveItemsOnPlanner();
  const { deleteMultipleJobs } = useDeleteMultipleJobs();
  const { toggleRightDrawerColapse } = useRightContentDrawer();
  const navigate = useNavigate();

  const standardDialogError =
    "You will need to select at least 1 job using the checkbox's on the job cards.";

  const buttonOptions = useMemo(() => {
    return [
      {
        displayText: "Add New Job",
        icon: <PostAddIcon />,
        tooltip: "Adds new jobs to the planner.",
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
        displayText: "New Group",
        icon: <CreateNewFolderIcon />,
        divider: true,
        tooltip:
          "Creates a new job group from the job selection you have or an empty group.",
        onClick: async () => {
          navigate(
            `/group/new?includes=${encodeURIComponent(
              [...multiSelectJobPlanner].join(",")
            )}`
          );
        },
      },
      {
        displayText: "Shopping List",
        icon: <ShoppingCartIcon />,
        tooltip:
          "Displays a shopping list of the remaining materials needed to build all of the selected jobs.",
        onClick: () => {
          if (multiSelectJobPlanner.length > 0) {
            updateShoppingListTrigger((prev) => !prev);
            updateShoppingListData(multiSelectJobPlanner);
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
      {
        displayText: "Add Ingredient Jobs",
        icon: <AccountTreeIcon />,
        tooltip:
          "Sets up new jobs to build the combined ingredient totals of each selected job cards.",
        onClick: () => {
          if (multiSelectJobPlanner.length > 0) {
            massBuildMaterials(multiSelectJobPlanner);
            updateMultiSelectJobPlanner([]);
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
      {
        displayText: "Add Item Costs",
        icon: <PriceCheckIcon />,
        tooltip: "Input item costs for all selected jobs.",
        onClick: async () => {
          if (multiSelectJobPlanner.length > 0) {
            const itemList = await buildItemPriceEntry(multiSelectJobPlanner);
            updatePriceEntryListData((prev) => ({
              ...prev,
              open: true,
              list: itemList,
            }));
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
      {
        displayText: "Move Backwards",
        icon: <ArrowUpwardIcon />,
        tooltip: "Moves the selected jobs 1 step backwards on the planner.",
        onClick: () => {
          if (multiSelectJobPlanner.length > 0) {
            moveItemsOnPlanner(multiSelectJobPlanner, "backward");
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
      {
        displayText: "Move Forwards",
        icon: <ArrowDownwardIcon />,
        tooltip: "Moves the selected jobs 1 step forwards on the planner.",
        onClick: () => {
          if (multiSelectJobPlanner.length > 0) {
            moveItemsOnPlanner(multiSelectJobPlanner, "forward");
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
      {
        displayText: "Merge Jobs",
        icon: <CallMergeIcon />,
        tooltip: "Merges the selected jobs into one.",
        disabled: multiSelectJobPlanner.every(
          (i) => i.itemID === multiSelectJobPlanner[0].itemID
        ),
        onClick: () => {
          if (multiSelectJobPlanner.length > 1) {
            mergeJobsNew(multiSelectJobPlanner);
            updateMultiSelectJobPlanner([]);
          } else {
            throwDialogError(
              "You will need to select at least 2 matching jobs using the checkbox's on the job cards"
            );
          }
        },
      },
      {
        displayText: "Select All",
        icon: <SelectAllIcon />,
        tooltip: "Selects all jobs on the planner.",
        onClick: () => {
          let newMultiArray = [...multiSelectJobPlanner];
          userJobSnapshot.forEach((job) => {
            newMultiArray.push(job.jobID);
          });
          updateMultiSelectJobPlanner(newMultiArray);
        },
      },
      {
        displayText: "Clear Selection",
        icon: <DeselectIcon />,
        tooltip: "Clears the selected jobs.",
        disabled: multiSelectJobPlanner.length === 0, // Fixed the condition here
        onClick: () => {
          updateMultiSelectJobPlanner([]);
        },
      },
      {
        displayText: "Delete",
        icon: <DeleteSweepIcon />,
        tooltip: "Deletes the selected jobs from the planner.",
        disabled: multiSelectJobPlanner.length === 0, // Fixed the condition here
        onClick: () => {
          if (multiSelectJobPlanner.length > 0) {
            deleteMultipleJobs(multiSelectJobPlanner);
            updateMultiSelectJobPlanner([]);
          } else {
            throwDialogError(standardDialogError);
          }
        },
      },
    ];
  }, [
    multiSelectJobPlanner,
    userJobSnapshot,
    updateRightContentMenuContentID,
    toggleRightDrawerColapse,
    updateMultiSelectJobPlanner,
    updateShoppingListTrigger,
    updateShoppingListData,
    massBuildMaterials,
    buildItemPriceEntry,
    updatePriceEntryListData,
    moveItemsOnPlanner,
    deleteMultipleJobs,
    standardDialogError,
  ]);

  function throwDialogError(inputText) {
    updateDialogData((prev) => ({
      ...prev,
      buttonText: "Close",
      id: "Empty-Multi-Select",
      open: true,
      title: "Oops",
      body: inputText,
    }));
  }

  return buttonOptions;
}
