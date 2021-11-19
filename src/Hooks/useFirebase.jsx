import { CopyrightTwoTone } from "@material-ui/icons";
import React, { useCallback, useContext } from "react";
import { MainUserContext } from "../Context/AuthContext";
import { DataExchangeContext } from "../Context/LayoutContext";
import firebase from "../firebase";
import { jobTypes } from "../Components/Job Planner";

export function useFirebase() {
    const { mainUser } = useContext(MainUserContext);
    const { updateDataExchange } = useContext(DataExchangeContext);

    const determineUserState = useCallback(async (user) => {
        console.log(user);
        if (user.fbToken.additionalUserInfo.isNewUser) {
            firebase.firestore().collection("JobPlanner").doc(user.CharacterHash).set({
                jobStatusArray: [
                    { id: 0, name: "Planning", sortOrder: 0, expanded: true, openAPIJobs: false, completeAPIJobs: false },
                    { id: 1, name: "Purchasing", sortOrder: 1, expanded: true, openAPIJobs: false, completeAPIJobs: false },
                    { id: 2, name: "Building", sortOrder: 2, expanded: true, openAPIJobs: true, completeAPIJobs: false },
                    { id: 3, name: "Complete", sortOrder: 3, expanded: true, openAPIJobs: false, completeAPIJobs: true },
                    { id: 4, name: "For Sale", sortOrder: 4, expanded: true, openAPIJobs: false, completeAPIJobs: false }
                ],
                accountID: `CHAR${Date.now()}`
            });
        };
    
    }, []);

    const addNewJob = useCallback(async (job) => {        
        if (job.jobType === jobTypes.manufacturing) {
            firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).collection("Jobs").doc(job.jobID.toString()).set({
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
            firebase.firestore().collection("JobPlanner").doc(`${mainUser.CharacterHash}`).collection("Jobs").doc(job.jobID.toString()).set({
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
    }, []);

    const uploadJob = useCallback(async (job) => {      
        if (job.jobType === jobTypes.manufacturing) {
            firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).collection("Jobs").doc(job.jobID.toString()).update({
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
            firebase.firestore().collection("JobPlanner").doc(`${mainUser.CharacterHash}`).collection("Jobs").doc(job.jobID.toString()).update({
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
    }, []);

    const uploadJobStatus = useCallback(async (newArray) => {
        updateDataExchange(true);
        firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).update({
            jobStatusArray: newArray
        });
        updateDataExchange(false);
    },[]);

    const removeJob = useCallback(async (job) => {
        firebase.firestore().collection("JobPlanner").doc(mainUser.CharacterHash).collection("Jobs").doc(job.jobID.toString()).delete()
    })

    const downloadCharacterData = useCallback(async (user) => {
        const CharDoc = await firebase.firestore().collection("JobPlanner").doc(user.CharacterHash).get();
        if (CharDoc.exists) {
            return CharDoc.data();
        } else {
            console.log("No Document Found")
        };      
    },[]);
    
    const downloadCharacterJobs = useCallback(async (user) => {
        const CharDoc = await firebase.firestore().collection("JobPlanner").doc(user.CharacterHash).collection("Jobs").get();
        const newJobArray = [];
        if (!CharDoc.empty) {
            CharDoc.docs.forEach((doc) => {
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
    },[]);


    return{determineUserState, addNewJob, uploadJob, uploadJobStatus, removeJob, downloadCharacterData, downloadCharacterJobs}
};