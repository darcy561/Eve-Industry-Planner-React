import { useContext } from "react";
import { trace } from "firebase/performance"
import { performance } from "../../firebase"
import { IsLoggedInContext, UserJobSnapshotContext } from "../../Context/AuthContext";
import { JobArrayContext } from "../../Context/JobContext";
import { DataExchangeContext } from "../../Context/LayoutContext";
import { useJobBuild } from "../useJobBuild";
import { useJobManagement } from "../useJobManagement";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import { useJobSnapshotManagement } from "./useJobSnapshots";
import { useManageGroupJobs } from "../GroupHooks/useManageGroupJobs";
import { useFirebase } from "../useFirebase";


function useBuildNewJobs(buildRequests) {
    const { userJobSnapshot, updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
    const { jobArray, groupArray, updateJobArray, updateGroupArray } = useContext(JobArrayContext);
    const { updateDataExchange } = useContext(DataExchangeContext);
    const { isLoggedIn } = useContext(IsLoggedInContext);
    const { buildJob } = useJobBuild();
    const { addNewJob } = useFirebase();
    const { generatePriceRequestFromJob } = useJobManagement();
    const { newJobSnapshot } = useJobSnapshotManagement()
    const {addJobToGroup} = useManageGroupJobs()
    const { findParentUser } = useHelperFunction();


    async function addNewJobs() {
        const trace = trace(performance, "CreateJobProcessFull");
        let newUserJobSnapshot = [...userJobSnapshot]
        let newGroupArray = [...groupArray];
        let newJobArray = [...jobArray];
        const parentUser = findParentUser();
        let priceRequestSet = new Set();

        trace.start();
        updateDataExchange(true);
        
        let newJobObjects = await buildJob(buildRequests);

        if (!newJobObjects) return 

        if (!Array.isArray(newJobObjects)) {
            newJobObjects = [newJobObjects];
        }
        
        for (let jobObject of newJobObjects) {
            priceRequestSet = new Set([...priceRequestSet, generatePriceRequestFromJob(jobObject)])   
        }
        const itemPriceRequest = [getItemPrices([...priceRequestSet], parentUser)];

        for (let jobObject of newJobObjects) {
            newJobArray.push(jobObject);
            
            if (!jobObject.groupID) {
                newUserJobSnapshot = newJobSnapshot(jobObject, newUserJobSnapshot);
            }

            addJobToGroup: if (jobObject.groupID) {
                newGroupArray = addJobToGroup(newJob, newGroupArray, newJobArray);
            }

            if (isLoggedIn) {
                await addNewJob(jobObject);

                userJobListener(parentUser, jobObject.jobID)
                
            }
        }

}

    

    
}

export default useBuildNewJobs