import { useMediaQuery } from "@mui/material";
import { Complete_StandardLayout_EditJob } from "./Standard Layout/standardLayout";

export function LayoutSelector_EditJob_Complete({
  activeJob,
  updateActiveJob,
  setJobModified,
}) {
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  switch (deviceNotMobile) {
    case true:
      return (
        <Complete_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      );
    case false:
      return null;
    default:
      return (
        <Complete_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      );
  }
}
