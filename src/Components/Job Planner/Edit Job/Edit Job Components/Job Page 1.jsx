import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { useCreateJobProcess } from "../../../../Hooks/useCreateJob";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import {
  Box,
  Icon,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ManufacturingOptions } from "./Page 1 Components/maunfacturingOptions";
import { ReactionOptions } from "./Page 1 Components/reactionOptions";
import { RawResourceList } from "./Page 1 Components/rawResources";
import { ProductionStats } from "./Page 1 Components/productionStats";

export function EditPage1({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { newJobProcess } = useCreateJobProcess();

  function OptionSwitch() {
    switch (activeJob.jobType) {
      case 1:
        return <ManufacturingOptions setJobModified={setJobModified} />;
      case 2:
        return <ReactionOptions setJobModified={setJobModified} />;
      case 3:
        return null;
      default:
        return null;
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      <Box
        sx={{
          flex: {
            xs: "1 1 100%",
            sm: "1 1 40%",
            lg: "1 1 25%",
          },
        }}
      >
        <ProductionStats />
        <OptionSwitch />
      </Box>
      <Box
        sx={{
          flex: {
            xs: "1 1 100%",
            sm: "1 1 60%",
            lg: "1 1 75%",
          },
        }}
      >
        <RawResourceList />
      </Box>
    </Box>
  );
}
