import TutorialTemplate from "../../../Tutorials/tutorialTemplate";
import { TutorialContent_JobPlanner } from "../tutorialPlanner";
import AddNewJobContentPanel from "./panalContents.jsx/addNewJob";

function RightSideMenuContent_JobPlanner({
  rightContentMenuContentID,
  updateRightContentMenuContentID,
  updateExpandRightContentMenu,
}) {
  switch (rightContentMenuContentID) {
    case 1:
      return <AddNewJobContentPanel />;

    default:
      return (
        <TutorialTemplate
          TutorialContent={TutorialContent_JobPlanner}
          updateExpandedMenu={updateExpandRightContentMenu}
        />
      );
  }
}

export default RightSideMenuContent_JobPlanner;
