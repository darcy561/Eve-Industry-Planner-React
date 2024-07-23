import TutorialTemplate from "../../../Tutorials/tutorialTemplate";
import { TutorialContent_JobPlanner } from "../tutorialPlanner";
import AddNewJobContentPanel from "./panalContents.jsx/addNewJob";

function RightSideMenuContent_JobPlanner({
  rightContentMenuContentID,
  updateRightContentMenuContentID,
  updateExpandRightContentMenu,
  setSkeletonElementsToDisplay
}) {
  switch (rightContentMenuContentID) {
    case 1:
      return (
        <AddNewJobContentPanel
          hideRightContentPanel={updateExpandRightContentMenu}
          rightContentMenuContentID={rightContentMenuContentID}
          updateRightContentMenuContentID={updateRightContentMenuContentID}
          setSkeletonElementsToDisplay={setSkeletonElementsToDisplay}
        />
      );

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
