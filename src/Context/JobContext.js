import React, { useState, createContext } from "react";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState([
    {
      id: 0,
      name: "Planning",
      sortOrder: 0,
      expanded: true,
      openAPIJobs: false,
      completeAPIJobs: false,
    },
    {
      id: 1,
      name: "Purchasing",
      sortOrder: 1,
      expanded: true,
      openAPIJobs: false,
      completeAPIJobs: false,
    },
    {
      id: 2,
      name: "Building",
      sortOrder: 2,
      expanded: true,
      openAPIJobs: true,
      completeAPIJobs: false,
    },
    {
      id: 3,
      name: "Complete",
      sortOrder: 3,
      expanded: true,
      openAPIJobs: false,
      completeAPIJobs: true,
    },
    {
      id: 4,
      name: "For Sale",
      sortOrder: 4,
      expanded: true,
      openAPIJobs: false,
      completeAPIJobs: false,
    },
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
      name: "Genetic Mutation Inhibiter",
      jobID: 1640315399969,
      jobStatus: 0,
      volume: 1,
      itemID: 57485,
      maxProductionLimit: 40,
      runCount: 1,
      jobCount: 1,
      bpME: 0,
      bpTE: 0,
      rigType: 0,
      systemType: 1,
      apiJobs: [],
      build: {
        products: {
          totalQuantity: 20,
          quantityPerJob: 20,
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
          marketOrders: [],
        },
        materials: [
          {
            name: "Test Cultures",
            volume: 1.5,
            quantity: 100,
            typeID: 2319,
            jobType: 3,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            quantity: 100,
            name: "Isotropic Neofullerene Gamma-9",
            jobType: 2,
            typeID: 57465,
            volume: 8,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
        ],
        buildChar: null,
        time: 16000,
      },
      rawData: {
        materials: [
          {
            name: "Test Cultures",
            volume: 1.5,
            quantity: 100,
            typeID: 2319,
            jobType: 3,
          },
          {
            quantity: 100,
            name: "Isotropic Neofullerene Gamma-9",
            jobType: 2,
            typeID: 57465,
            volume: 8,
          },
        ],
        products: [
          {
            quantity: 20,
            typeID: 57485,
          },
        ],
        time: 16000,
      },
      structureType: 0,
      structureTypeDisplay: "Station",
      skills: [
        {
          typeID: 3380,
          level: 5,
        },
        {
          typeID: 25538,
          level: 5,
        },
      ],
    },
    {
      jobType: 1,
      name: "Broadsword",
      jobID: 1640906370641,
      jobStatus: 0,
      volume: 96000,
      itemID: 12013,
      maxProductionLimit: 1,
      runCount: 1,
      jobCount: 1,
      bpME: 0,
      bpTE: 0,
      rigType: 0,
      systemType: 1,
      apiJobs: [],
      build: {
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
          marketOrders: [],
          transactions: [],
          brokersFee: [],
        },
        materials: [
          {
            volume: 1,
            jobType: 1,
            typeID: 11530,
            name: "Plasma Thruster",
            quantity: 105,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            jobType: 0,
            volume: 0.01,
            quantity: 150,
            typeID: 11399,
            name: "Morphite",
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            name: "Fernite Carbide Composite Armor Plate",
            quantity: 6750,
            typeID: 11542,
            volume: 1,
            jobType: 1,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            quantity: 180,
            typeID: 11536,
            volume: 1,
            jobType: 1,
            name: "Ladar Sensor Cluster",
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            volume: 1,
            quantity: 2970,
            typeID: 11538,
            name: "Nanomechanical Microprocessor",
            jobType: 1,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            jobType: 1,
            typeID: 11555,
            name: "Deflection Shield Emitter",
            volume: 1,
            quantity: 413,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            jobType: 3,
            typeID: 3828,
            name: "Construction Blocks",
            volume: 1.5,
            quantity: 188,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            name: "Rupture",
            quantity: 1,
            jobType: 1,
            typeID: 629,
            volume: 96000,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            quantity: 21,
            typeID: 11478,
            name: "R.A.M.- Starship Tech",
            jobType: 1,
            volume: 0.04,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            typeID: 11548,
            volume: 1,
            name: "Nuclear Reactor Unit",
            jobType: 1,
            quantity: 53,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            volume: 1,
            quantity: 660,
            typeID: 11551,
            name: "Electrolytic Capacitor Unit",
            jobType: 1,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
        ],
        buildChar: null,
        time: 240000,
      },
      rawData: {
        materials: [
          {
            volume: 1,
            jobType: 1,
            typeID: 11530,
            name: "Plasma Thruster",
            quantity: 105,
          },
          {
            jobType: 0,
            volume: 0.01,
            quantity: 150,
            typeID: 11399,
            name: "Morphite",
          },
          {
            name: "Fernite Carbide Composite Armor Plate",
            quantity: 6750,
            typeID: 11542,
            volume: 1,
            jobType: 1,
          },
          {
            quantity: 180,
            typeID: 11536,
            volume: 1,
            jobType: 1,
            name: "Ladar Sensor Cluster",
          },
          {
            volume: 1,
            quantity: 2970,
            typeID: 11538,
            name: "Nanomechanical Microprocessor",
            jobType: 1,
          },
          {
            jobType: 1,
            typeID: 11555,
            name: "Deflection Shield Emitter",
            volume: 1,
            quantity: 413,
          },
          {
            jobType: 3,
            typeID: 3828,
            name: "Construction Blocks",
            volume: 1.5,
            quantity: 188,
          },
          {
            name: "Rupture",
            quantity: 1,
            jobType: 1,
            typeID: 629,
            volume: 96000,
          },
          {
            quantity: 21,
            typeID: 11478,
            name: "R.A.M.- Starship Tech",
            jobType: 1,
            volume: 0.04,
          },
          {
            typeID: 11548,
            volume: 1,
            name: "Nuclear Reactor Unit",
            jobType: 1,
            quantity: 53,
          },
          {
            volume: 1,
            quantity: 660,
            typeID: 11551,
            name: "Electrolytic Capacitor Unit",
            jobType: 1,
          },
        ],
        products: [
          {
            typeID: 12013,
            quantity: 1,
          },
        ],
        time: 240000,
      },
      structureType: 0,
      structureTypeDisplay: "Station",
      skills: [
        {
          level: 5,
          typeID: 3380,
        },
        {
          level: 1,
          typeID: 3397,
        },
        {
          typeID: 11445,
          level: 1,
        },
        {
          level: 1,
          typeID: 11446,
        },
      ],
    },
    {
      jobType: 2,
      name: "Graphene Nanoribbons",
      jobID: 1640907211076,
      jobStatus: 0,
      volume: 1.5,
      itemID: 30309,
      maxProductionLimit: 1000,
      runCount: 1,
      jobCount: 1,
      bpME: 0,
      bpTE: 0,
      rigType: 0,
      systemType: 1,
      apiJobs: [],
      build: {
        products: {
          totalQuantity: 120,
          quantityPerJob: 120,
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
          marketOrders: [],
          transactions: [],
          brokersFee: [],
        },
        materials: [
          {
            typeID: 4051,
            quantity: 5,
            name: "Nitrogen Fuel Block",
            jobType: 1,
            volume: 5,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            name: "Fullerite-C28",
            volume: 2,
            quantity: 100,
            jobType: 0,
            typeID: 30375,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            typeID: 30376,
            volume: 5,
            name: "Fullerite-C32",
            quantity: 100,
            jobType: 0,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
          {
            quantity: 400,
            name: "Nocxium",
            volume: 0.01,
            typeID: 38,
            jobType: 0,
            purchasing: [],
            quantityPurchased: 0,
            purchasedCost: 0,
            purchaseComplete: false,
          },
        ],
        buildChar: null,
        time: 10800,
      },
      rawData: {
        materials: [
          {
            typeID: 4051,
            quantity: 5,
            name: "Nitrogen Fuel Block",
            jobType: 1,
            volume: 5,
          },
          {
            name: "Fullerite-C28",
            volume: 2,
            quantity: 100,
            jobType: 0,
            typeID: 30375,
          },
          {
            typeID: 30376,
            volume: 5,
            name: "Fullerite-C32",
            quantity: 100,
            jobType: 0,
          },
          {
            quantity: 400,
            name: "Nocxium",
            volume: 0.01,
            typeID: 38,
            jobType: 0,
          },
        ],
        products: [
          {
            quantity: 120,
            typeID: 30309,
          },
        ],
        time: 10800,
      },
      structureType: 1,
      structureTypeDisplay: "Medium",
      skills: [
        {
          typeID: 45746,
          level: 3,
        },
      ],
    },
  ]);

  return (
    <JobArrayContext.Provider value={{ jobArray, updateJobArray }}>
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
    <ApiJobsContext.Provider value={{ apiJobs, updateApiJobs }}>
      {props.children}
    </ApiJobsContext.Provider>
  );
};
