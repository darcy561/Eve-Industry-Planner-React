import { useMediaQuery } from "@mui/material";
import { Selling_StandardLayout_EditJob } from "./Standard Layout/standardLayout";

export function LayoutSelector_EditJob_Selling({
  activeJob,
  updateActiveJob,
  setJobModified,
  esiDataToLink,
  updateEsiDataToLink
}) {
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  switch (deviceNotMobile) {
    case true:
      return (
        <Selling_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
    case false:
      return (
        <Selling_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
    default:
      return (
        <Selling_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
  }
}
