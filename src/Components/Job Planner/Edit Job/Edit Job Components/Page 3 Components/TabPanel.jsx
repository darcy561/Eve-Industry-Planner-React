import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab } from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { AvailableJobs } from "./Available Jobs";
import { LinkedJobs } from "./Linked Jobs";

export function Step3TabMenu({ jobMatches, setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const [currentTab, updateTab] = useState(() => {
    if (activeJob.apiJobs.length < activeJob.jobCount) {
      return "0";
    } else {
      return "1";
    }
  });

  const handleChange = (event, newValue) => {
    updateTab(newValue);
  };

  return (
    <Paper
      sx={{
        padding: "10px",
        width: "100%",
        minHeight: "35vh",
      }}
      elevation={3}
      square={true}
    >
      <TabContext value={currentTab}>
        <TabList
          value={currentTab}
          onChange={handleChange}
          variant="fullWidth"
          textColor={"secondary.main"}
        >
          <Tab
            label={
              jobMatches.length === 1
                ? `${jobMatches.length} Available ESI Job`
                : `${jobMatches.length} Available ESI Jobs`
            }
            value="0"
          />
          <Tab
            label={
              activeJob.build.costs.linkedJobs.length === 1
                ? `${activeJob.build.costs.linkedJobs.length} Linked ESI Job`
                : `${activeJob.build.costs.linkedJobs.length} Linked ESI Jobs`
            }
            value="1"
          />
        </TabList>
        <TabPanel value="0">
          <AvailableJobs
            jobMatches={jobMatches}
            setJobModified={setJobModified}
          />
        </TabPanel>
        <TabPanel value="1">
          <LinkedJobs jobMatches={jobMatches} setJobModified={setJobModified} />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
