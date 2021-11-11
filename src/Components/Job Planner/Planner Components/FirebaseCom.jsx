import React, { useContext } from "react";
import { MainUserContext } from '../../../Context/AuthContext';
import { DataExchangeContext } from "../../../Context/LayoutContext";
import { JobArrayContext } from '../../../Context/JobContext';
import firebase from '../../../firebase';



export async function UploadJobPlanner() {
    const { jobArray } = useContext(JobArrayContext);
    const { DataExchange, updateDataExchange } = useContext(DataExchangeContext);
    const { mainUser } = useContext(MainUserContext);
    
    const fbCol = firebase.firestore().collection("JobPlanner");

    updateDataExchange(true);
    fbCol.doc(`${mainUser.CharacterHash}`).update({
        JSON: JSON.stringify(jobArray)
    });
    updateDataExchange(false);
};

export async function DownloadJobPlanner() {
    const { jobArray } = useContext(JobArrayContext);
    const { DataExchange, updateDataExchange } = useContext(DataExchangeContext);
    const { mainUser } = useContext(MainUserContext);

    const fbCol = firebase.firestore().collection("JobPlanner");

    updateDataExchange(true);
    fbCol.doc(`${mainUser.CharacterHash}`).get({})
    
};