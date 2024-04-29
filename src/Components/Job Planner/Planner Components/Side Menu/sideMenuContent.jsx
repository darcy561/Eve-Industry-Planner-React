import { List } from "@mui/material";
import { SidemenuButtonTemplate_JobPlanner } from "./Buttons/buttonTemplate";
import uuid from "react-uuid";
import { useJobPlannerSideMenuFunctions } from "./Buttons/buttonfunctions";

export function SideMenuContent_JobPlanner({
  expandedState,
  updateExpandRightContentMenu,
  rightContentMenuContentID,
  updateRightContentMenuContentID,
}) {
  const buttonOptions = useJobPlannerSideMenuFunctions(
    updateExpandRightContentMenu,
    updateRightContentMenuContentID
  );

  return (
    <List>
      {buttonOptions.map((option) => {
        return (
          <SidemenuButtonTemplate_JobPlanner
            key={uuid()}
            buttonContent={option}
            expandedState={expandedState}
          />
        );
      })}
    </List>
  );
}
