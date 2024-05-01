import { useHelperFunction } from "../../../Hooks/GeneralHooks/useHelperFunctions";

function useRightContentDrawer() {
  const { checkDisplayTutorials } = useHelperFunction();
  function toggleRightDrawerColapse(
    newContentID,
    existingContentID,
    updaterFunction
  ) {
    const tutorialFlag = checkDisplayTutorials();

    if (newContentID === existingContentID && !tutorialFlag) {
      updaterFunction(false);
    } else {
      updaterFunction(true);
    }
  }

  return {
    toggleRightDrawerColapse,
  };
}

export default useRightContentDrawer;
