import { useState } from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab, Tabs } from "@mui/material";
import { AvailableJobsTab } from "./availableJobs";
import { LinkedJobsTab } from "./linkedJobs";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import Job from "../../../../../../Classes/jobConstructor";

export function TabPanel_Building({
  activeJob,
  updateActiveJob,
  setJobModified,
  jobMatches,
  parentUser,
  esiDataToLink,
  updateEsiDataToLink,
}) {
  const { getJobCountFromJob } = useHelperFunction();
  const totalJobCount = getJobCountFromJob(activeJob);

  const [currentTab, updateTab] = useState(initialTab());

  function initialTab() {
    if (activeJob.layout.esiJobTab) {
      return activeJob.layout.esiJobTab;
    } else if (activeJob.apiJobs.size < totalJobCount) {
      return "0";
    } else {
      return "1";
    }
  }
  const handleChange = (event, newValue) => {
    updateTab(newValue);
    updateActiveJob((prev) => {
      prev.layout.esiJobTab = newValue;
      return new Job(prev);
    });
  };

  return (
    <Paper
      sx={{
        padding: "10px",
        width: "100%",
        minHeight: "35vh",
      }}
      elevation={3}
      square
    >
      <TabContext value={currentTab}>
        <Tabs value={currentTab} onChange={handleChange} variant="fullWidth">
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
                ? `${activeJob.build.costs.linkedJobs.length}/${totalJobCount} Linked ESI Job`
                : `${activeJob.build.costs.linkedJobs.length}/${totalJobCount} Linked ESI Jobs`
            }
            value="1"
          />
        </Tabs>
        <TabPanel value="0">
          <AvailableJobsTab
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            jobMatches={jobMatches}
            parentUser={parentUser}
            totalJobCount={totalJobCount}
            esiDataToLink={esiDataToLink}
            updateEsiDataToLink={updateEsiDataToLink}
          />
        </TabPanel>
        <TabPanel value="1">
          <LinkedJobsTab
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            parentUser={parentUser}
            esiDataToLink={esiDataToLink}
            updateEsiDataToLink={updateEsiDataToLink}
          />
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
