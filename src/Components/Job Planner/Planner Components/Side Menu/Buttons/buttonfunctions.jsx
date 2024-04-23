import { useContext } from "react";
import {
  DialogDataContext,
  JobPlannerPageTriggerContext,
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
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { useGroupManagement } from "../../../../../Hooks/useGroupManagement";

export function useJobPlannerSideMenuFunctions(updateExpandRightContentMenu) {
  const { updateGroupArray } = useContext(JobArrayContext);
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
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
  const { createNewGroupWithJobs } = useGroupManagement();

  const standardDialogError =
    "You will need to select at least 1 job using the checkbox's on the job cards.";

  function addNewJobButton() {
    async function buttonClick() {
      updateExpandRightContentMenu((prev) => !prev);
    }

    return {
      displayText: "Add New Job",
      icon: <PostAddIcon />,
      onClick: buttonClick,
      tooltip: "Adds new jobs to the planner.",
    };
  }

  function newGroupButton() {
    async function buttonClick() {
      let newGroup = await createNewGroupWithJobs(multiSelectJobPlanner);
      updateGroupArray((prev) => [...prev, newGroup]);
      updateActiveGroup(newGroup.groupID);
      updateMultiSelectJobPlanner([]);
      updateEditGroupTrigger((prev) => !prev);
    }

    return {
      displayText: "New Group",
      icon: <CreateNewFolderIcon />,
      onClick: buttonClick,
      divider: true,
      tooltip:
        "Creates a new job group from the job selection you have or an empty group.",
    };
  }

  function shoppingListButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 0) {
        updateShoppingListTrigger((prev) => !prev);
        updateShoppingListData(multiSelectJobPlanner);
      } else {
        throwDialogError(standardDialogError);
      }
    }

    return {
      displayText: "Shopping List",
      icon: <ShoppingCartIcon />,
      onClick: buttonClick,
      tooltip:
        "Displays a shopping list of the remaining materials needed to build all of the selected jobs.",
    };
  }

  function addIngrediantsButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 0) {
        massBuildMaterials(multiSelectJobPlanner);
        updateMultiSelectJobPlanner([]);
      } else {
        throwDialogError(standardDialogError);
      }
    }

    return {
      displayText: "Add Ingredient Jobs",
      icon: <AccountTreeIcon />,
      onClick: buttonClick,
      tooltip:
        "Sets up new jobs to build the combined ingrediant totals of each selected job cards.",
    };
  }

  function priceEntryButton() {
    async function buttonClick() {
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
    }

    return {
      displayText: "Add Item Costs",
      icon: <PriceCheckIcon />,
      onClick: buttonClick,
      tooltip: "Input item costs for all selected jobs.",
    };
  }

  function moveItemBackwardsButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 0) {
        moveItemsOnPlanner(multiSelectJobPlanner, "backward");
      } else {
        throwDialogError(standardDialogError);
      }
    }

    return {
      displayText: "Move Backwards",
      icon: <ArrowUpwardIcon />,
      onClick: buttonClick,
      tooltip: "Moves the selected jobs 1 step backwards on the planner.",
    };
  }

  function moveItemForwardsButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 0) {
        moveItemsOnPlanner(multiSelectJobPlanner, "forward");
      } else {
        throwDialogError(standardDialogError);
      }
    }

    return {
      displayText: "Move Forwards",
      icon: <ArrowDownwardIcon />,
      onClick: buttonClick,
      tooltip: "Moves the selected jobs 1 step forwards on the planner.",
    };
  }

  function mergeJobsButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 1) {
        mergeJobsNew(multiSelectJobPlanner);
        updateMultiSelectJobPlanner([]);
      } else {
        throwDialogError(
          "You will need to select at least 2 matching jobs using the checkbox's on the job cards"
        );
      }
    }

    return {
      displayText: "Merge Jobs",
      icon: <CallMergeIcon />,
      onClick: buttonClick,
      disabled: multiSelectJobPlanner.every(
        (i) => i.itemID === multiSelectJobPlanner[0].itemID
      ),
      tooltip: "Merges the selected jobs into one.",
    };
  }

  function selectAllButton() {
    function buttonClick() {
      let newMultiArray = [...multiSelectJobPlanner];
      userJobSnapshot.forEach((job) => {
        newMultiArray.push(job.jobID);
      });
      updateMultiSelectJobPlanner(newMultiArray);
    }

    return {
      displayText: "Select All",
      icon: <SelectAllIcon />,
      onClick: buttonClick,
      tooltip: "Selects all jobs on the planner.",
    };
  }

  function clearSelectionButton() {
    function buttonClick() {
      updateMultiSelectJobPlanner([]);
    }

    return {
      displayText: "Clear Selection",
      icon: <DeselectIcon />,
      onClick: buttonClick,
      disabled: !multiSelectJobPlanner.length > 0,
      tooltip: "Clears the selected jobs.",
    };
  }

  function deleteJobsButton() {
    function buttonClick() {
      if (multiSelectJobPlanner.length > 0) {
        deleteMultipleJobs(multiSelectJobPlanner);
        updateMultiSelectJobPlanner([]);
      } else {
        throwDialogError(standardDialogError);
      }
    }

    return {
      displayText: "Delete",
      icon: <DeleteSweepIcon />,
      onClick: buttonClick,
      disabled: !multiSelectJobPlanner.length > 0,
      tooltip: "Deletes the selected jobs from the planner.",
    };
  }

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

  return [
    addNewJobButton(),
    newGroupButton(),
    shoppingListButton(),
    addIngrediantsButton(),
    priceEntryButton(),
    moveItemBackwardsButton(),
    moveItemForwardsButton(),
    mergeJobsButton(),
    selectAllButton(),
    clearSelectionButton(),
    deleteJobsButton(),
  ];
}
