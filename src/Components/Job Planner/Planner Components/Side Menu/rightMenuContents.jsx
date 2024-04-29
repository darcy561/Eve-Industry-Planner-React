import TutorialTemplate from "../../../Tutorials/tutorialTemplate";
import { TutorialContent_JobPlanner } from "../tutorialPlanner";

function RightSideMenuContent_JobPlanner({
  rightContentMenuContentID,
  updateRightContentMenuContentID,
  updateExpandRightContentMenu,
}) {
  switch (rightContentMenuContentID) {
    case 1:
      return null;

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
