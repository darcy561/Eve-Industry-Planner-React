import { useContext, useEffect } from "react";
import { Box } from "@mui/material";
import { Header } from "../../Header";
import { useLocation, useNavigate } from "react-router-dom";
import { JobArrayContext } from "../../../Context/JobContext";
import findOrGetJobObject from "../../../Functions/Helper/findJobObject.js";
import Group from "../../../Classes/groupsConstructor.js";
import manageListenerRequests from "../../../Functions/Firebase/manageListenerRequests.js";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../Context/AuthContext.jsx";
import uploadJobSnapshotsToFirebase from "../../../Functions/Firebase/uploadJobSnapshots.js";
import uploadGroupsToFirebase from "../../../Functions/Firebase/uploadGroupData.js";
import updateJobInFirebase from "../../../Functions/Firebase/updateJob.js";

function NewGroupPage({ colorMode }) {
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    async function retrieveGroupData() {
      const groupJobs = [];
      const retrievedJobs = [];
      const jobsToSave = new Set();
      let newUserJobSnapshot = [...userJobSnapshot];
      const group = new Group();
      for (let id of jobIDsToInclude) {
        const matchedGroupJob = await findOrGetJobObject(
          id,
          jobArray,
          retrievedJobs
        );
        if (!matchedGroupJob) continue;
        groupJobs.push(matchedGroupJob);
        matchedGroupJob.groupID = group.groupID;

        for (let parentID of matchedGroupJob.parentJob) {
          if (jobIDsToInclude.includes(parentID)) continue;

          const matchedParentJob = await findOrGetJobObject(
            parentID,
            jobArray,
            retrievedJobs
          );
          if (!matchedParentJob) continue;

          let material =
            matchedParentJob.build.childJobs[matchedGroupJob.jobID];
          if (!material) continue;

          material = material.filter((i) => i !== matchedGroupJob.jobID);
          jobsToSave.add(matchedParentJob.jobID);
        }

        matchedGroupJob.parentJob = matchedGroupJob.parentJob.filter((i) =>
          jobIDsToInclude.includes(i)
        );

        for (let material of matchedGroupJob.build.materials) {
          let childJobArray = matchedGroupJob.build.childJobs[material.typeID];
          for (let id of childJobArray) {
            if (jobIDsToInclude.includes(id)) continue;

            const matchedChildJob = await findOrGetJobObject(
              id,
              jobArray,
              retrievedJobs
            );

            if (!matchedChildJob) continue;

            matchedChildJob.parentJob = matchedChildJob.parentJob.filter(
              (i) => !matchedGroupJob.jobID
            );
          }
          childJobArray = childJobArray.filter((i) =>
            jobIDsToInclude.includes(i)
          );
          jobsToSave.add(matchedGroupJob.jobID);
        }

        newUserJobSnapshot = newUserJobSnapshot.filter(
          (i) => i.jobID !== matchedGroupJob.jobID
        );
        jobsToSave.add(matchedGroupJob.jobID);
      }

      group.createGroup(groupJobs);

      if (isLoggedIn) {
        await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
        await uploadGroupsToFirebase([...groupArray, group]);

        for (let id of [...jobsToSave]) {
          let job = [...jobArray, ...retrievedJobs].find((i) => i.jobID === id);
          if (!job) {
            return;
          }
          await updateJobInFirebase(job);
        }
      }

      updateUserJobSnapshot(newUserJobSnapshot);
      updateJobArray((prev) => {
        const existingIDs = new Set(prev.map(({ jobID }) => jobID));
        return [
          ...prev,
          ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
        ];
      });
      updateGroupArray((prev) => [...prev, group]);

      manageListenerRequests(
        jobIDsToInclude,
        updateJobArray,
        updateFirebaseListeners,
        firebaseListeners,
        isLoggedIn
      );

      await Promise.race([checkJobsPresent(), timeout()]);
      navigate(`/group/${group.groupID}`);
    }

    function checkJobsPresent() {
      return new Promise((res, _) => {
        const intervalID = setInterval(() => {
          const allJobsFound = jobIDsToInclude.every((id) =>
            jobArray.some((i) => i.jobID === id)
          );
          if (allJobsFound) {
            clearInterval(intervalID);
            res(true);
          }
        }, 1000);

        return () => clearInterval(intervalID);
      });
    }

    function timeout() {
      return new Promise((res, rej) => {
        setTimeout(() => {
          rej(new Error("timeout"));
        }, 10000);
      });
    }

    const jobIDsToInclude =
      queryParams.get("includes")?.split(",").filter(Boolean) || [];

    retrieveGroupData().catch((err) => {
      console.error(err.message);
      navigate("/jobplanner");
    });
  }, []);

  return (
    <Box>
      <Header colorMode={colorMode} />
    </Box>
  );
}

export default NewGroupPage;
