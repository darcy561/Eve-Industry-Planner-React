import AddNewJobSharedContentPanel from "../../SideMenu/Shared Panels/Add New Job/AddNewJobPanel";
import OutputJobsInfoPanel from "./Panels/OutputData/OutputFrame";

function RightSideMenuContent_GroupPage({
  groupJobs,
  rightContentMenuContentID,
  updateRightContentMenuContentID,
  updateExpandRightContentMenu,
  setSkeletonElementsToDisplay,
  highlightedItems,
  updateHighlightedItem,
}) {
  switch (rightContentMenuContentID) {
    case 1:
      return (
        <AddNewJobSharedContentPanel
          hideContentPanel={updateExpandRightContentMenu}
          contentID={rightContentMenuContentID}
          updateContentID={updateRightContentMenuContentID}
          setSkeletonElementsToDisplay={setSkeletonElementsToDisplay}
        />
      );
    default:
      return (
        <OutputJobsInfoPanel
          groupJobs={groupJobs}
          highlightedItems={highlightedItems}
          updateHighlightedItem={updateHighlightedItem}
        />
      );
  }
}

export default RightSideMenuContent_GroupPage;
