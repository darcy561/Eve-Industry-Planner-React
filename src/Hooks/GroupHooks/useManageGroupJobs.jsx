import { useContext } from "react"
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext"



export function useManageGroupJobs() {
    const { groupArray } = useContext(JobArrayContext);
    const { activeGroup } = useContext(ActiveJobContext);

    const addJobToGroup = (inputJob, inputGroupArray, inputJobArray) => {
        if (!inputJob) return inputGroupArray
        
        if (!inputJob.groupID) return inputGroupArray
        

        const selectedGroupIndex = inputGroupArray.findIndex(
            (i) => i.groupID === inputJob.groupID
        );
        
        if (selectedGroupIndex === -1) return inputGroupArray

        const matchedGroup = inputGroupArray[selectedGroupIndex]
        
        const filteredGroupJobs = inputJobArray.filter((job)=> job.groupID === activeGroup.groupID && job.jobID !== inputJob.jobID)
        
        const isActiveGroup = matchedGroup.groupID === activeGroup.groupID;

        const {
            outputJobCount,
            materialIDs,
            jobTypeIDs,
            includedJobIDs,
            linkedJobIDs,
            linkedTransIDs,
            linkedOrderIDs,
          } = groupJobs.reduce(
            (prev, job) => {
              if (job.parentJob.length === 0) {
                prev.outputJobCount++;
              }
              prev.materialIDs.add(job.itemID);
              prev.jobTypeIDs.add(job.itemID);
              prev.includedJobIDs.add(job.jobID);
              prev.linkedJobIDs = new Set([...prev.linkedJobIDs, ...job.apiJobs]);
              prev.linkedOrderIDs = new Set([
                ...prev.linkedOrderIDs,
                ...job.apiOrders,
              ]);
              prev.linkedTransIDs = new Set([
                ...prev.linkedTransIDs,
                ...job.apiTransactions,
              ]);
    
              job.build.materials.forEach((mat) => {
                prev.materialIDs.add(mat.typeID);
              });
              return prev;
            },
            {
              outputJobCount: 0,
              materialIDs: new Set(),
              jobTypeIDs: new Set(),
              includedJobIDs: new Set(),
              linkedJobIDs: new Set(),
              linkedTransIDs: new Set(),
              linkedOrderIDs: new Set(),
            }
          );




        
    }

    const removeJobFromGroup = ()=>{
        
    }
    


    return {

    }
}