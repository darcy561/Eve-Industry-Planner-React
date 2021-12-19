import React, { useState, createContext } from "react";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState([
    { id: 0, name: "Planning", sortOrder: 0,  expanded: true, openAPIJobs: false, completeAPIJobs: false },
    { id: 1, name: "Purchasing", sortOrder: 1, expanded: true, openAPIJobs: false, completeAPIJobs: false },
    { id: 2, name: "Building", sortOrder: 2, expanded: true, openAPIJobs: true, completeAPIJobs: false },
    { id: 3, name: "Complete", sortOrder: 3, expanded: true, openAPIJobs: false, completeAPIJobs: true},
    { id: 4, name: "For Sale", sortOrder: 4, expanded: true, openAPIJobs: false, completeAPIJobs: false}
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
        jobType: 1,
        manufacturing: {
          products: [
            {
              typeID: 31488,
              quantity: 1,
            },
          ],
          materials: [
            {
              quantity: 120,
              jobType: 0,
              name: "Micro Circuit",
              typeID: 25618,
            },
            {
              jobType: 0,
              typeID: 25611,
              name: "Current Pump",
              quantity: 90,
            },
            {
              name: "Interface Circuit",
              jobType: 0,
              quantity: 135,
              typeID: 25620,
            },
            {
              jobType: 1,
              name: "R.A.M.- Weapon Tech",
              typeID: 11486,
              quantity: 1,
            },
          ],
          time: 60000,
          skills: [
            {
              typeID: 3380,
              level: 5,
            },
            {
              level: 1,
              typeID: 11433,
            },
            {
              level: 1,
              typeID: 11447,
            },
            {
              level: 4,
              typeID: 26258,
            },
          ],
        },
        name: "Capital Energy Locus Coordinator II",
        jobID: 1639859110205,
        jobStatus: 0,
        volume: 40,
        itemID: 31488,
        maxProductionLimit: 1,
        runCount: 1,
        jobCount: 1,
        bpME: 0,
        bpTE: 0,
        structureType: 1,
        structureTypeDisplay: "",
        rigType: 0,
        systemType: 0,
        apiJobs: [],
        job: {
          products: {
            totalQuantity: 1,
            quantityPerJob: 1,
            recalculate: false,
          },
          costs: {
            totalPurchaseCost: 0,
            extrasCosts: [],
            extrasTotal: 0,
            installCosts: 0,
          },
          sale: {
            totalSold: 0,
            totalSale: 0,
            markUp: 0,
            transactions: [],
            brokersFee: [],
          },
          materials: [
            {
              quantity: 119,
              jobType: 0,
              name: "Micro Circuit",
              typeID: 25618,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 0,
              typeID: 25611,
              name: "Current Pump",
              quantity: 90,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Interface Circuit",
              jobType: 0,
              quantity: 134,
              typeID: 25620,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              name: "R.A.M.- Weapon Tech",
              typeID: 11486,
              quantity: 1,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
          ],
          buildChar: null,
          skills: [
            {
              typeID: 3380,
              level: 5,
            },
            {
              level: 1,
              typeID: 11433,
            },
            {
              level: 1,
              typeID: 11447,
            },
            {
              level: 4,
              typeID: 26258,
            },
          ],
          time: 60000,
        },
        planner: {
          products: {
            totalQuantity: 0,
            quantityPerJob: 0,
          },
          materials: [
            {
              quantity: 120,
              jobType: 0,
              name: "Micro Circuit",
              typeID: 25618,
            },
            {
              jobType: 0,
              typeID: 25611,
              name: "Current Pump",
              quantity: 90,
            },
            {
              name: "Interface Circuit",
              jobType: 0,
              quantity: 135,
              typeID: 25620,
            },
            {
              jobType: 1,
              name: "R.A.M.- Weapon Tech",
              typeID: 11486,
              quantity: 1,
            },
          ],
          skills: [
            {
              typeID: 3380,
              level: 5,
            },
            {
              level: 1,
              typeID: 11433,
            },
            {
              level: 1,
              typeID: 11447,
            },
            {
              level: 4,
              typeID: 26258,
            },
          ],
          time: 60000,
        },
      },
      {
        jobType: 2,
        reaction: {
          products: [
            {
              typeID: 30304,
              quantity: 250,
            },
          ],
          time: 10800,
          skills: [
            {
              typeID: 45746,
              level: 3,
            },
          ],
          materials: [
            {
              quantity: 5,
              jobType: 1,
              typeID: 4246,
              name: "Hydrogen Fuel Block",
            },
            {
              typeID: 30371,
              quantity: 100,
              jobType: 0,
              name: "Fullerite-C60",
            },
            {
              typeID: 30370,
              jobType: 0,
              name: "Fullerite-C50",
              quantity: 300,
            },
            {
              name: "Pyerite",
              jobType: 0,
              typeID: 35,
              quantity: 800,
            },
          ],
        },
        name: "PPD Fullerene Fibers",
        jobID: 1639867587500,
        jobStatus: 0,
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
        apiJobs: [],
        job: {
          products: {
            totalQuantity: 250,
            quantityPerJob: 250,
            recalculate: false,
          },
          costs: {
            totalPurchaseCost: 0,
            extrasCosts: [],
            extrasTotal: 0,
            installCosts: 0,
          },
          sale: {
            totalSold: 0,
            totalSale: 0,
            markUp: 0,
            transactions: [],
            brokersFee: [],
          },
          materials: [
            {
              quantity: 5,
              jobType: 1,
              typeID: 4246,
              name: "Hydrogen Fuel Block",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              typeID: 30371,
              quantity: 100,
              jobType: 0,
              name: "Fullerite-C60",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              typeID: 30370,
              jobType: 0,
              name: "Fullerite-C50",
              quantity: 300,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Pyerite",
              jobType: 0,
              typeID: 35,
              quantity: 800,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
          ],
          buildChar: null,
          skills: [
            {
              typeID: 45746,
              level: 3,
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
              quantity: 5,
              jobType: 1,
              typeID: 4246,
              name: "Hydrogen Fuel Block",
            },
            {
              typeID: 30371,
              quantity: 100,
              jobType: 0,
              name: "Fullerite-C60",
            },
            {
              typeID: 30370,
              jobType: 0,
              name: "Fullerite-C50",
              quantity: 300,
            },
            {
              name: "Pyerite",
              jobType: 0,
              typeID: 35,
              quantity: 800,
            },
          ],
          skills: [
            {
              typeID: 45746,
              level: 3,
            },
          ],
          time: 10800,
        },
      },
      {
        jobType: 1,
        manufacturing: {
          skills: [
            {
              typeID: 22242,
              level: 5,
            },
          ],
          materials: [
            {
              quantity: 100,
              jobType: 1,
              typeID: 21009,
              name: "Capital Propulsion Engine",
            },
            {
              jobType: 1,
              quantity: 400,
              typeID: 21011,
              name: "Capital Turret Hardpoint",
            },
            {
              name: "Capital Sensor Cluster",
              typeID: 21013,
              jobType: 1,
              quantity: 200,
            },
            {
              name: "Capital Armor Plates",
              jobType: 1,
              quantity: 300,
              typeID: 21017,
            },
            {
              jobType: 1,
              typeID: 21019,
              quantity: 400,
              name: "Capital Capacitor Battery",
            },
            {
              name: "Capital Power Generator",
              jobType: 1,
              quantity: 300,
              typeID: 21021,
            },
            {
              jobType: 1,
              typeID: 21023,
              quantity: 150,
              name: "Capital Shield Emitter",
            },
            {
              typeID: 21025,
              quantity: 400,
              jobType: 1,
              name: "Capital Jump Drive",
            },
            {
              jobType: 1,
              name: "Capital Computer System",
              typeID: 21035,
              quantity: 100,
            },
            {
              jobType: 1,
              typeID: 21037,
              name: "Capital Construction Parts",
              quantity: 200,
            },
            {
              name: "Capital Jump Bridge Array",
              jobType: 1,
              quantity: 556,
              typeID: 24545,
            },
            {
              quantity: 556,
              typeID: 24547,
              jobType: 1,
              name: "Capital Clone Vat Bay",
            },
            {
              name: "Capital Doomsday Weapon Mount",
              jobType: 1,
              typeID: 24556,
              quantity: 556,
            },
            {
              jobType: 1,
              typeID: 24558,
              name: "Capital Ship Maintenance Bay",
              quantity: 556,
            },
            {
              jobType: 1,
              name: "Capital Corporate Hangar Bay",
              quantity: 556,
              typeID: 24560,
            },
            {
              quantity: 500,
              jobType: 1,
              name: "S-R Trigger Neurolink Conduit",
              typeID: 57472,
            },
            {
              typeID: 57476,
              jobType: 1,
              name: "Magnetometric-FTL Interlink Communicator",
              quantity: 500,
            },
            {
              quantity: 5000,
              jobType: 1,
              typeID: 57478,
              name: "Auto-Integrity Preservation Seal",
            },
            {
              jobType: 1,
              quantity: 2500,
              typeID: 57486,
              name: "Life Support Backup Unit",
            },
            {
              typeID: 57487,
              name: "Capital Core Temperature Regulator",
              jobType: 1,
              quantity: 40,
            },
            {
              jobType: 1,
              typeID: 57489,
              name: "Enhanced Neurolink Protection Cell",
              quantity: 1,
            },
          ],
          products: [
            {
              typeID: 671,
              quantity: 1,
            },
          ],
          time: 9000000,
        },
        name: "Erebus",
        jobID: 1639868954580,
        jobStatus: 0,
        volume: 145500000,
        itemID: 671,
        maxProductionLimit: 1,
        runCount: 1,
        jobCount: 1,
        bpME: 0,
        bpTE: 0,
        structureType: 1,
        structureTypeDisplay: "",
        rigType: 0,
        systemType: 0,
        apiJobs: [],
        job: {
          products: {
            totalQuantity: 1,
            quantityPerJob: 1,
            recalculate: false,
          },
          costs: {
            totalPurchaseCost: 0,
            extrasCosts: [],
            extrasTotal: 0,
            installCosts: 0,
          },
          sale: {
            totalSold: 0,
            totalSale: 0,
            markUp: 0,
            transactions: [],
            brokersFee: [],
          },
          materials: [
            {
              quantity: 99,
              jobType: 1,
              typeID: 21009,
              name: "Capital Propulsion Engine",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              quantity: 396,
              typeID: 21011,
              name: "Capital Turret Hardpoint",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Capital Sensor Cluster",
              typeID: 21013,
              jobType: 1,
              quantity: 198,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Capital Armor Plates",
              jobType: 1,
              quantity: 297,
              typeID: 21017,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              typeID: 21019,
              quantity: 396,
              name: "Capital Capacitor Battery",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Capital Power Generator",
              jobType: 1,
              quantity: 297,
              typeID: 21021,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              typeID: 21023,
              quantity: 149,
              name: "Capital Shield Emitter",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              typeID: 21025,
              quantity: 396,
              jobType: 1,
              name: "Capital Jump Drive",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              name: "Capital Computer System",
              typeID: 21035,
              quantity: 99,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              typeID: 21037,
              name: "Capital Construction Parts",
              quantity: 198,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Capital Jump Bridge Array",
              jobType: 1,
              quantity: 551,
              typeID: 24545,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              quantity: 551,
              typeID: 24547,
              jobType: 1,
              name: "Capital Clone Vat Bay",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              name: "Capital Doomsday Weapon Mount",
              jobType: 1,
              typeID: 24556,
              quantity: 551,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              typeID: 24558,
              name: "Capital Ship Maintenance Bay",
              quantity: 551,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              name: "Capital Corporate Hangar Bay",
              quantity: 551,
              typeID: 24560,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              quantity: 495,
              jobType: 1,
              name: "S-R Trigger Neurolink Conduit",
              typeID: 57472,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              typeID: 57476,
              jobType: 1,
              name: "Magnetometric-FTL Interlink Communicator",
              quantity: 495,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              quantity: 4950,
              jobType: 1,
              typeID: 57478,
              name: "Auto-Integrity Preservation Seal",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              quantity: 2475,
              typeID: 57486,
              name: "Life Support Backup Unit",
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              typeID: 57487,
              name: "Capital Core Temperature Regulator",
              jobType: 1,
              quantity: 40,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
            {
              jobType: 1,
              typeID: 57489,
              name: "Enhanced Neurolink Protection Cell",
              quantity: 1,
              purchasing: [],
              quantityPurchased: 0,
              purchasedCost: 0,
              purchaseComplete: false,
            },
          ],
          buildChar: null,
          skills: [
            {
              typeID: 22242,
              level: 5,
            },
          ],
          time: 9000000,
        },
        planner: {
          products: {
            totalQuantity: 0,
            quantityPerJob: 0,
          },
          materials: [
            {
              quantity: 100,
              jobType: 1,
              typeID: 21009,
              name: "Capital Propulsion Engine",
            },
            {
              jobType: 1,
              quantity: 400,
              typeID: 21011,
              name: "Capital Turret Hardpoint",
            },
            {
              name: "Capital Sensor Cluster",
              typeID: 21013,
              jobType: 1,
              quantity: 200,
            },
            {
              name: "Capital Armor Plates",
              jobType: 1,
              quantity: 300,
              typeID: 21017,
            },
            {
              jobType: 1,
              typeID: 21019,
              quantity: 400,
              name: "Capital Capacitor Battery",
            },
            {
              name: "Capital Power Generator",
              jobType: 1,
              quantity: 300,
              typeID: 21021,
            },
            {
              jobType: 1,
              typeID: 21023,
              quantity: 150,
              name: "Capital Shield Emitter",
            },
            {
              typeID: 21025,
              quantity: 400,
              jobType: 1,
              name: "Capital Jump Drive",
            },
            {
              jobType: 1,
              name: "Capital Computer System",
              typeID: 21035,
              quantity: 100,
            },
            {
              jobType: 1,
              typeID: 21037,
              name: "Capital Construction Parts",
              quantity: 200,
            },
            {
              name: "Capital Jump Bridge Array",
              jobType: 1,
              quantity: 556,
              typeID: 24545,
            },
            {
              quantity: 556,
              typeID: 24547,
              jobType: 1,
              name: "Capital Clone Vat Bay",
            },
            {
              name: "Capital Doomsday Weapon Mount",
              jobType: 1,
              typeID: 24556,
              quantity: 556,
            },
            {
              jobType: 1,
              typeID: 24558,
              name: "Capital Ship Maintenance Bay",
              quantity: 556,
            },
            {
              jobType: 1,
              name: "Capital Corporate Hangar Bay",
              quantity: 556,
              typeID: 24560,
            },
            {
              quantity: 500,
              jobType: 1,
              name: "S-R Trigger Neurolink Conduit",
              typeID: 57472,
            },
            {
              typeID: 57476,
              jobType: 1,
              name: "Magnetometric-FTL Interlink Communicator",
              quantity: 500,
            },
            {
              quantity: 5000,
              jobType: 1,
              typeID: 57478,
              name: "Auto-Integrity Preservation Seal",
            },
            {
              jobType: 1,
              quantity: 2500,
              typeID: 57486,
              name: "Life Support Backup Unit",
            },
            {
              typeID: 57487,
              name: "Capital Core Temperature Regulator",
              jobType: 1,
              quantity: 40,
            },
            {
              jobType: 1,
              typeID: 57489,
              name: "Enhanced Neurolink Protection Cell",
              quantity: 1,
            },
          ],
          skills: [
            {
              typeID: 22242,
              level: 5,
            },
          ],
          time: 9000000,
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

export const ApiJobsContext = createContext();

export const ApiJobs = (props) => {
  const [apiJobs, updateApiJobs] = useState([]);

  return (
    <ApiJobsContext.Provider value={{apiJobs, updateApiJobs}}>
      {props.children}
    </ApiJobsContext.Provider>
  );
};