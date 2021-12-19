import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { useCreateJobProcess } from "../../../../Hooks/useCreateJob";
import { blueprintVariables } from "../..";
import { jobTypes } from "../..";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import {
  Box,
  Grid,
  FormHelperText,
  Icon,
  IconButton,
  TextField,
  Typography,
  Button,
  Tooltip,
  FormControl,
} from "@mui/material";
import { ManufacturingOptions } from "./Page 1 Components/maunfacturingOptions";
import { ReactionOptions } from "./Page 1 Components/reactionOptions";
import { RawResourceList } from "./Page 1 Components/rawResources";

export function EditPage1({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { newJobProcess } = useCreateJobProcess();

  function AddBuildIcon({ material }) {
    if (material.jobType === 1) {
      return (
        <Tooltip
          title="Click to add as a manufacturing job"
          placement="left-start"
        >
          <IconButton
            sx={{ color: "manufacturing.main" }}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === 2) {
      return (
        <Tooltip title="Click to add as a reaction job" placement="left-start">
          <IconButton
            sx={{ color: "reaction.main" }}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === 3) {
      return (
        <Tooltip title="Planetary Interaction" placement="left-start">
          <Icon sx={{ color: "pi.main" }} fontSize="small">
            <MdRemoveCircle />
          </Icon>
        </Tooltip>
      );
    } else if (material.jobType === 0) {
      return (
        <Tooltip title="Base Material" placement="left-start">
          <Icon fontSize="small" sx={{ color: "baseMat.main" }}>
            <MdRemoveCircle />
          </Icon>
        </Tooltip>
      );
    }
  }

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
