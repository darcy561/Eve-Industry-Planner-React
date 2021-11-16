import React, { useContext, useEffect, useState } from "react";
import {  ActiveJobContext, JobArrayContext, JobSettingsTriggerContext
} from "../../Context/JobContext";
import { IsLoggedInContext, MainUserContext, UsersContext } from "../../Context/AuthContext";
import { EditJob } from "./Edit Job/EditJob";
import { PlannerAccordion } from "./Planner Components/accordion";
import { IconButton, CircularProgress, Container, Typography} from '@material-ui/core';
import { RefreshTokens } from "../Auth/RefreshToken";
import { firebaseAuth } from "../Auth/firebaseAuth";
import { useEveApi } from "../Hooks/useEveApi";
import { createJob } from "./JobBuild";
import { firebase } from "../../firebase";

export let blueprintVariables = {
  me: [
    { value: 0, label: 0 },
    { value: 1, label: 1 },
    { value: 2, label: 2 },
    { value: 3, label: 3 },
    { value: 4, label: 4 },
    { value: 5, label: 5 },
    { value: 6, label: 6 },
    { value: 7, label: 7 },
    { value: 8, label: 8 },
    { value: 9, label: 9 },
    { value: 10, label: 10 },
  ],
  te: [
    { value: 0, label: 0 },
    { value: 1, label: 2 },
    { value: 2, label: 4 },
    { value: 3, label: 6 },
    { value: 4, label: 8 },
    { value: 5, label: 10 },
    { value: 6, label: 12 },
    { value: 7, label: 14 },
    { value: 8, label: 16 },
    { value: 9, label: 18 },
    { value: 10, label: 20 },
  ],
  manStructure: [
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
    { value: "X-Large", label: "X-Large" },
  ],
  manRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
  manSystem: [
    { value: 1, label: "High Sec" },
    { value: 1.9, label: "Low Sec" },
    { value: 2.1, label: "Null Sec / WH" },
  ],
  reactionSystem: [
    { value: 1, label: "Low Sec" },
    { value: 1.1, label: "Null Sec / WH" },
  ],
  reactionStructure: [
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
  ],
  reactionRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
};

export let jobTypes = {
  baseMaterial: 0,
  manufacturing: 1,
  reaction: 2,
  pi: 3,
};

export function JobPlanner(){
  const { JobSettingsTrigger, ToggleJobSettingsTrigger } = useContext(JobSettingsTriggerContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { CharacterSkills, IndustryJobs, MarketOrders } = useEveApi();
  const [exampleJobs] = useState([3041, 671, 35834, 16656, 30309]);
  const [exampleJobsLoaded, UpdateExampleJobsLoaded] = useState(true);
  const [pageload, updatePageload] = useState(true);
  const [loadingText, setLoadingText] =useState("")



  useEffect(async () => {
    const rToken = localStorage.getItem("Auth");
    if (
      mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) ||
      mainUser.aTokenEXP == null
    ) {
      if (rToken != null) {
        setLoadingText("Logging Into Eve SSO");
        const refreshedUser = await RefreshTokens(rToken);
        refreshedUser.fbToken = await firebaseAuth(refreshedUser);
        setLoadingText("Loading API Data");
        refreshedUser.Skills = await CharacterSkills(refreshedUser);
        refreshedUser.Jobs = await IndustryJobs(refreshedUser);
        refreshedUser.Orders = await MarketOrders(refreshedUser);
        refreshedUser.ParentUser = true;
        setLoadingText("Building Character Object");
        const newUsersArray = [];
        newUsersArray.push(refreshedUser);
        updateUsers(newUsersArray);
        updateIsLoggedIn(true);
        updateMainUser(refreshedUser);
        updatePageload(false);
      } else {
        // if (exampleJobsLoaded === false) {
        //   const newJobArray = [];
        //     exampleJobs.forEach((item) => {
        //     const itemData = createJob(item);
        //     newJobArray.push(itemData);
        //   });
        //   Promise.all(newJobArray)
        //   console.log(newJobArray);
        //   updateJobArray((prevArray) => [...prevArray, newJobArray]);
          UpdateExampleJobsLoaded(true);
        // }
        updateIsLoggedIn(false);
        updatePageload(false);
      }
    } else {
      updatePageload(false);
    }
  }, []);

  // useEffect(() => {
  //   if (IsLoggedIn) {
  //     firebase.firestore().collection("JobPlanner").document(mainUser.CharacterHash).collection("Jobs")
  //       .getdocumentsnapshot(
    
  //     )
  //   };
  // },[])

  if (pageload) {
    return (
    <>
      { pageload && <CircularProgress color="primary" />}
        <Typography variant="body2">{loadingText}</Typography>
      </>
    )
  } else {
    if (JobSettingsTrigger) {
      return (
          <EditJob />
      )
    } else {
      return (
          <PlannerAccordion />
      )
    };
  };
};