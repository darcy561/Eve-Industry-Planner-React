import React, { useState, createContext } from "react";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState([
    { id: 0, name: "Planning", expanded: true },
    { id: 1, name: "Purchasing", expanded: true },
    { id: 2, name: "Building", expanded: true },
    { id: 3, name: "Complete", expanded: true},
    { id: 4, name: "For Sale", expanded: true }
  ]);

  return (
    <JobStatusContext.Provider value={{ jobStatus, setJobStatus }}>
      {props.children}
    </JobStatusContext.Provider>
  );
};

export const JobArrayContext = createContext();

export const JobArray = (props) => {
  const [jobArray, updateJobArray] = useState([
    {
      jobType: 2,
      reaction: {
        products: [
          {
            quantity: 250,
            typeID: 30304,
          },
        ],
        time: 10800,
        materials: [
          {
            name: "Hydrogen Fuel Block",
            quantity: 5,
            typeID: 4246,
          },
          {
            quantity: 100,
            name: "Fullerite-C60",
            typeID: 30371,
          },
          {
            name: "Fullerite-C50",
            typeID: 30370,
            quantity: 300,
          },
          {
            typeID: 35,
            name: "Pyerite",
            quantity: 800,
          },
        ],
        skills: [
          {
            level: 3,
            typeID: 45746,
          },
        ],
      },
      name: "PPD Fullerene Fibers",
      jobID: 1636231328346,
      jobStatus: 1,
      volume: 0.5,
      itemID: 30304,
      maxProductionLimit: 1000,
      runCount: 1,
      jobCount: 1,
      bpME: 0,
      bpTE: 0,
      structureType: 1,
      structureTypeDisplay: "",
      rigType: 0,
      systemType: 0,
      job: {
        products: {
          totalQuantity: 0,
          quantityPerJob: 0,
          totalPurchaseCost: 0,
          totalComplete: 0,
          extrasCosts: [],
          extrasTotal: 0,
        },
        materials: [
          {
            name: "Hydrogen Fuel Block",
            quantity: 5,
            typeID: 4246,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            quantity: 100,
            name: "Fullerite-C60",
            typeID: 30371,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            name: "Fullerite-C50",
            typeID: 30370,
            quantity: 300,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            typeID: 35,
            name: "Pyerite",
            quantity: 800,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
        ],
        skills: [
          {
            level: 3,
            typeID: 45746,
          },
        ],
        time: 10800,
      },
      planner: {
        products: {
          totalQuantity: 0,
          quantityPerJob: 0,
        },
        materials: [
          {
            name: "Hydrogen Fuel Block",
            quantity: 5,
            typeID: 4246,
          },
          {
            quantity: 100,
            name: "Fullerite-C60",
            typeID: 30371,
          },
          {
            name: "Fullerite-C50",
            typeID: 30370,
            quantity: 300,
          },
          {
            typeID: 35,
            name: "Pyerite",
            quantity: 800,
          },
        ],
        skills: [
          {
            level: 3,
            typeID: 45746,
          },
        ],
        time: 10800,
      },
    },
    {
      jobType: 1,
      manufacturing: {
        time: 600,
        products: [
          {
            typeID: 209,
            quantity: 100,
          },
        ],
        skills: [
          {
            typeID: 3380,
            level: 1,
          },
        ],
        materials: [
          {
            quantity: 820,
            typeID: 34,
            name: "Tritanium",
          },
          {
            name: "Nocxium",
            quantity: 2,
            typeID: 38,
          },
        ],
      },
      name: "Scourge Heavy Missile",
      jobID: 1636229802117,
      jobStatus: 3,
      volume: 0.03,
      itemID: 209,
      maxProductionLimit: 300,
      runCount: 1,
      jobCount: 1,
      bpME: 0,
      bpTE: 0,
      structureType: 1,
      structureTypeDisplay: "",
      rigType: 0,
      systemType: 0,
      job: {
        products: {
          totalQuantity: 0,
          quantityPerJob: 0,
          totalPurchaseCost: 0,
          totalComplete: 0,
          extrasCosts: [],
          extrasTotal: 0,
        },
        materials: [
          {
            quantity: 820,
            typeID: 34,
            name: "Tritanium",
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            name: "Nocxium",
            quantity: 2,
            typeID: 38,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
        ],
        skills: [
          {
            typeID: 3380,
            level: 1,
          },
        ],
        time: 600,
      },
      planner: {
        products: {
          totalQuantity: 0,
          quantityPerJob: 0,
        },
        materials: [
          {
            quantity: 820,
            typeID: 34,
            name: "Tritanium",
          },
          {
            name: "Nocxium",
            quantity: 2,
            typeID: 38,
          },
        ],
        skills: [
          {
            typeID: 3380,
            level: 1,
          },
        ],
        time: 600,
      },
    },
  ]);

  return (
    <JobArrayContext.Provider value={{jobArray, updateJobArray}}>
      {props.children}
    </JobArrayContext.Provider>
  );
};


export const ActiveJobContext = createContext();

export const ActiveJob = (props) => {
  const [activeJob, updateActiveJob] = useState({});
  
  return (
    <ActiveJobContext.Provider value={{ activeJob, updateActiveJob }}>
      {props.children}
    </ActiveJobContext.Provider>
  );
};


export const JobSettingsTriggerContext = createContext();

export const JobSettingsTrigger = (props) => {
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useState(false);

  return (
    <JobSettingsTriggerContext.Provider value={{ JobSettingsTrigger, ToggleJobSettingsTrigger }}>
      {props.children}
    </JobSettingsTriggerContext.Provider>
  );
};