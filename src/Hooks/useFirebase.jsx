import React, { useCallback, useContext } from "react";
import { IsLoggedInContext, MainUserContext } from "../Context/AuthContext";
import { firestore } from "../firebase"
import {collection, doc, deleteDoc, getDoc, getDocs, setDoc, updateDoc} from "firebase/firestore"
import { jobTypes } from "../Components/Job Planner";

export function useFirebase() {
    const { isLoggedIn } = useContext(IsLoggedInContext);
    const { mainUser } = useContext(MainUserContext);

    const determineUserState = useCallback(async (user) => {
        if (user.fbToken._tokenResponse.isNewUser) {
            setDoc(doc(firestore, `JobPlanner`, user.CharacterHash),{
                jobStatusArray: [
                    { id: 0, name: "Planning", sortOrder: 0, expanded: true, openAPIJobs: false, completeAPIJobs: false },
                    { id: 1, name: "Purchasing", sortOrder: 1, expanded: true, openAPIJobs: false, completeAPIJobs: false },
                    { id: 2, name: "Building", sortOrder: 2, expanded: true, openAPIJobs: true, completeAPIJobs: false },
                    { id: 3, name: "Complete", sortOrder: 3, expanded: true, openAPIJobs: false, completeAPIJobs: true },
                    { id: 4, name: "For Sale", sortOrder: 4, expanded: true, openAPIJobs: false, completeAPIJobs: false }
                ],
                accountID: user.accountID
            });
        };
    
    }, [isLoggedIn, mainUser]);

    const addNewJob = useCallback(async (job) => {        
        if (job.jobType === jobTypes.manufacturing) {
            setDoc(doc(firestore, `JobPlanner/${mainUser.CharacterHash}/Jobs`, job.jobID.toString()),{
                jobType: job.jobType,
                name: job.name,
                jobID: job.jobID,
                jobStatus: job.jobStatus,
                itemID: job.itemID,
                maxProductionLimit: job.maxProductionLimit,
                runCount: job.runCount,
                jobCount: job.jobCount,
                bpME: job.bpME,
                bpTE: job.bpTE,
                structureType: job.structureType,
                structureTypeDisplay: job.structureTypeDisplay,
                rigType: job.rigType,
                systemType: job.systemType,
                manufacturing: JSON.stringify(job.manufacturing),
                job: JSON.stringify(job.job),
                planner: JSON.stringify(job.planner),
            });
        };
        if (job.jobType === jobTypes.reaction) {
            setDoc(doc(firestore, `JobPlanner/${mainUser.CharacterHash}/Jobs`, job.jobID.toString()),{
                jobType: job.jobType,
                name: job.name,
                jobID: job.jobID,
                jobStatus: job.jobStatus,
                itemID: job.itemID,
                maxProductionLimit: job.maxProductionLimit,
                runCount: job.runCount,
                jobCount: job.jobCount,
                bpME: job.bpME,
                bpTE: job.bpTE,
                structureType: job.structureType,
                structureTypeDisplay: job.structureTypeDisplay,
                rigType: job.rigType,
                systemType: job.systemType,
                reaction: JSON.stringify(job.reaction),
                job: JSON.stringify(job.job),
                planner: JSON.stringify(job.planner),
            });
        };
    }, [isLoggedIn, mainUser]);

    const uploadJob = useCallback(async (job) => {      
        if (job.jobType === jobTypes.manufacturing) {
            updateDoc(doc(firestore, `JobPlanner/${mainUser.CharacterHash}/Jobs`, job.jobID.toString()),{
                jobType: job.jobType,
                name: job.name,
                jobID: job.jobID,
                jobStatus: job.jobStatus,
                itemID: job.itemID,
                maxProductionLimit: job.maxProductionLimit,
                runCount: job.runCount,
                jobCount: job.jobCount,
                bpME: job.bpME,
                bpTE: job.bpTE,
                structureType: job.structureType,
                structureTypeDisplay: job.structureTypeDisplay,
                rigType: job.rigType,
                systemType: job.systemType,
                manufacturing: JSON.stringify(job.manufacturing),
                job: JSON.stringify(job.job),
                planner: JSON.stringify(job.planner),
            });
        };
        if (job.jobType === jobTypes.reaction) {
            updateDoc(doc(firestore, `JobPlanner/${mainUser.CharacterHash}/Jobs`, job.jobID.toString()),{
                jobType: job.jobType,
                name: job.name,
                jobID: job.jobID,
                jobStatus: job.jobStatus,
                itemID: job.itemID,
                maxProductionLimit: job.maxProductionLimit,
                runCount: job.runCount,
                jobCount: job.jobCount,
                bpME: job.bpME,
                bpTE: job.bpTE,
                structureType: job.structureType,
                structureTypeDisplay: job.structureTypeDisplay,
                rigType: job.rigType,
                systemType: job.systemType,
                reaction: JSON.stringify(job.reaction),
                job: JSON.stringify(job.job),
                planner: JSON.stringify(job.planner),
            });
        };
    }, [isLoggedIn, mainUser]);

    const uploadJobStatus = useCallback(async (newArray) => {
        updateDoc(doc(firestore, "JobPlanner", mainUser.CharacterHash), {
            jobStatusArray: newArray
        });
    },[isLoggedIn, mainUser]);

    const removeJob = useCallback(async (job) => {
        deleteDoc(doc(firestore, `JobPlanner/${mainUser.CharacterHash}/Jobs`, job.jobID.toString()))
    },[isLoggedIn, mainUser])

    const downloadCharacterData = useCallback(async (user) => {
        const CharSnap = await getDoc(doc(firestore, "JobPlanner", user.CharacterHash));
        if (CharSnap.exists) {
            return CharSnap.data();
        } else {
            console.log("No Document Found")
        };      
    },[isLoggedIn, mainUser]);
    
    const downloadCharacterJobs = useCallback(async (user) => {
        const CharDocs = await getDocs(collection(firestore, `JobPlanner/${user.CharacterHash}/Jobs`))
        const newJobArray = [];
        if (!CharDocs.empty) {
            CharDocs.docs.forEach((doc) => {
                if (doc.data().jobType === jobTypes.manufacturing) {
                    const newJob = {
                        jobType: doc.data().jobType,
                        name: doc.data().name,
                        jobID: doc.data().jobID,
                        jobStatus: doc.data().jobStatus,
                        itemID: doc.data().itemID,
                        maxProductionLimit: doc.data().maxProductionLimit,
                        runCount: doc.data().runCount,
                        jobCount: doc.data().jobCount,
                        bpME: doc.data().bpME,
                        bpTE: doc.data().bpTE,
                        structureType: doc.data().structureType,
                        structureTypeDisplay: doc.data().structureTypeDisplay,
                        rigType: doc.data().rigType,
                        systemType: doc.data().systemType,
                        manufacturing: JSON.parse(doc.data().manufacturing),
                        job: JSON.parse(doc.data().job),
                        planner: JSON.parse(doc.data().planner),
                    }
                    newJobArray.push(newJob);

                };
                if (doc.data().jobType === jobTypes.reaction) {
                    const newJob = {
                        jobType: doc.data().jobType,
                        name: doc.data().name,
                        jobID: doc.data().jobID,
                        jobStatus: doc.data().jobStatus,
                        itemID: doc.data().itemID,
                        maxProductionLimit: doc.data().maxProductionLimit,
                        runCount: doc.data().runCount,
                        jobCount: doc.data().jobCount,
                        bpME: doc.data().bpME,
                        bpTE: doc.data().bpTE,
                        structureType: doc.data().structureType,
                        structureTypeDisplay: doc.data().structureTypeDisplay,
                        rigType: doc.data().rigType,
                        systemType: doc.data().systemType,
                        reaction: JSON.parse(doc.data().reaction),
                        job: JSON.parse(doc.data().job),
                        planner: JSON.parse(doc.data().planner),
                    }
                    newJobArray.push(newJob);
                };
            })
            return newJobArray;
        } else {
            return newJobArray;
        };
    },[isLoggedIn, mainUser]);

    return{determineUserState, addNewJob, uploadJob, uploadJobStatus, removeJob, downloadCharacterData, downloadCharacterJobs}
};