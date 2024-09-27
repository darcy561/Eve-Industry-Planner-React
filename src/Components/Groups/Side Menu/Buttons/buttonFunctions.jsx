import { useContext, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import PostAddIcon from "@mui/icons-material/PostAdd";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  DialogDataContext,
  MultiSelectJobPlannerContext,
  ShoppingListContext,
} from "../../../../Context/LayoutContext";
import useRightContentDrawer from "../../../SideMenu/Hooks/rightContentMenuHooks";
import useCloseGroup from "../../../../Hooks/GroupHooks/useCloseGroup";

export function useGroupPageSideMenuFunctions(
  groupJobs,
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID
) {
  const { updateDialogData } = useContext(DialogDataContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateShoppingListTrigger, updateShoppingListData } =
    useContext(ShoppingListContext);
  const { toggleRightDrawerColapse } = useRightContentDrawer();
  const { closeGroup } = useCloseGroup();

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

  return buttons;
}
