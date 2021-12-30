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
      "jobType": 1,
      "name": "Genetic Mutation Inhibiter",
      "jobID": 1640315399969,
      "jobStatus": 0,
      "volume": 1,
      "itemID": 57485,
      "maxProductionLimit": 40,
      "runCount": 1,
      "jobCount": 1,
      "bpME": 0,
      "bpTE": 0,
      "rigType": 0,
      "systemType": 1,
      "apiJobs": [],
      "build": {
          "products": {
              "totalQuantity": 20,
              "quantityPerJob": 20,
              "recalculate": false
          },
          "costs": {
              "totalPurchaseCost": 0,
              "extrasCosts": [],
              "extrasTotal": 0,
              "installCosts": 0
          },
          "sale": {
              "totalSold": 0,
              "totalSale": 0,
              "markUp": 0,
              "transactions": [],
              "brokersFee": [],
              "marketOrders": []
          },
          "materials": [
              {
                  "name": "Test Cultures",
                  "volume": 1.5,
                  "quantity": 100,
                  "typeID": 2319,
                  "jobType": 3,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 100,
                  "name": "Isotropic Neofullerene Gamma-9",
                  "jobType": 2,
                  "typeID": 57465,
                  "volume": 8,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              }
          ],
          "buildChar": null,
          "time": 16000
      },
      "rawData": {
          "materials": [
              {
                  "name": "Test Cultures",
                  "volume": 1.5,
                  "quantity": 100,
                  "typeID": 2319,
                  "jobType": 3
              },
              {
                  "quantity": 100,
                  "name": "Isotropic Neofullerene Gamma-9",
                  "jobType": 2,
                  "typeID": 57465,
                  "volume": 8
              }
          ],
          "products": [
              {
                  "quantity": 20,
                  "typeID": 57485
              }
          ],
          "time": 16000
      },
      "structureType": 0,
      "structureTypeDisplay": "Station",
      "skills": [
          {
              "typeID": 3380,
              "level": 5
          },
          {
              "typeID": 25538,
              "level": 5
          }
      ]
  },
    {
      "jobType": 1,
      "name": "Broadsword",
      "jobID": 1640315466269,
      "jobStatus": 0,
      "volume": 96000,
      "itemID": 12013,
      "maxProductionLimit": 1,
      "runCount": 1,
      "jobCount": 1,
      "bpME": 0,
      "bpTE": 0,
      "rigType": 0,
      "systemType": 1,
      "apiJobs": [],
      "build": {
          "products": {
              "totalQuantity": 1,
              "quantityPerJob": 1,
              "recalculate": false
          },
          "costs": {
              "totalPurchaseCost": 0,
              "extrasCosts": [],
              "extrasTotal": 0,
              "installCosts": 0
          },
          "sale": {
              "totalSold": 0,
              "totalSale": 0,
              "markUp": 0,
              "transactions": [],
              "brokersFee": [],
              "marketOrders": []
          },
          "materials": [
              {
                  "typeID": 11530,
                  "jobType": 1,
                  "name": "Plasma Thruster",
                  "volume": 1,
                  "quantity": 105,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 150,
                  "name": "Morphite",
                  "volume": 0.01,
                  "typeID": 11399,
                  "jobType": 0,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "jobType": 1,
                  "quantity": 6750,
                  "name": "Fernite Carbide Composite Armor Plate",
                  "volume": 1,
                  "typeID": 11542,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "typeID": 11536,
                  "jobType": 1,
                  "volume": 1,
                  "quantity": 180,
                  "name": "Ladar Sensor Cluster",
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 2970,
                  "jobType": 1,
                  "name": "Nanomechanical Microprocessor",
                  "volume": 1,
                  "typeID": 11538,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "volume": 1,
                  "jobType": 1,
                  "name": "Deflection Shield Emitter",
                  "quantity": 413,
                  "typeID": 11555,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "jobType": 3,
                  "volume": 1.5,
                  "name": "Construction Blocks",
                  "quantity": 188,
                  "typeID": 3828,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 1,
                  "name": "Rupture",
                  "typeID": 629,
                  "jobType": 1,
                  "volume": 96000,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "jobType": 1,
                  "name": "R.A.M.- Starship Tech",
                  "quantity": 21,
                  "volume": 0.04,
                  "typeID": 11478,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 53,
                  "name": "Nuclear Reactor Unit",
                  "volume": 1,
                  "jobType": 1,
                  "typeID": 11548,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "volume": 1,
                  "jobType": 1,
                  "name": "Electrolytic Capacitor Unit",
                  "quantity": 660,
                  "typeID": 11551,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              }
          ],
          "buildChar": null,
          "time": 240000
      },
      "rawData": {
          "materials": [
              {
                  "typeID": 11530,
                  "jobType": 1,
                  "name": "Plasma Thruster",
                  "volume": 1,
                  "quantity": 105
              },
              {
                  "quantity": 150,
                  "name": "Morphite",
                  "volume": 0.01,
                  "typeID": 11399,
                  "jobType": 0
              },
              {
                  "jobType": 1,
                  "quantity": 6750,
                  "name": "Fernite Carbide Composite Armor Plate",
                  "volume": 1,
                  "typeID": 11542
              },
              {
                  "typeID": 11536,
                  "jobType": 1,
                  "volume": 1,
                  "quantity": 180,
                  "name": "Ladar Sensor Cluster"
              },
              {
                  "quantity": 2970,
                  "jobType": 1,
                  "name": "Nanomechanical Microprocessor",
                  "volume": 1,
                  "typeID": 11538
              },
              {
                  "volume": 1,
                  "jobType": 1,
                  "name": "Deflection Shield Emitter",
                  "quantity": 413,
                  "typeID": 11555
              },
              {
                  "jobType": 3,
                  "volume": 1.5,
                  "name": "Construction Blocks",
                  "quantity": 188,
                  "typeID": 3828
              },
              {
                  "quantity": 1,
                  "name": "Rupture",
                  "typeID": 629,
                  "jobType": 1,
                  "volume": 96000
              },
              {
                  "jobType": 1,
                  "name": "R.A.M.- Starship Tech",
                  "quantity": 21,
                  "volume": 0.04,
                  "typeID": 11478
              },
              {
                  "quantity": 53,
                  "name": "Nuclear Reactor Unit",
                  "volume": 1,
                  "jobType": 1,
                  "typeID": 11548
              },
              {
                  "volume": 1,
                  "jobType": 1,
                  "name": "Electrolytic Capacitor Unit",
                  "quantity": 660,
                  "typeID": 11551
              }
          ],
          "products": [
              {
                  "typeID": 12013,
                  "quantity": 1
              }
          ],
          "time": 240000
      },
      "structureType": 0,
      "structureTypeDisplay": "Station",
      "skills": [
          {
              "typeID": 3380,
              "level": 5
          },
          {
              "level": 1,
              "typeID": 3397
          },
          {
              "typeID": 11445,
              "level": 1
          },
          {
              "level": 1,
              "typeID": 11446
          }
      ]
    },
    {
      "jobType": 2,
      "name": "Scandium Metallofullerene",
      "jobID": 1640315507914,
      "jobStatus": 0,
      "volume": 0.65,
      "itemID": 30308,
      "maxProductionLimit": 1000,
      "runCount": 1,
      "jobCount": 1,
      "bpME": 0,
      "bpTE": 0,
      "rigType": 0,
      "systemType": 1,
      "apiJobs": [],
      "build": {
          "products": {
              "totalQuantity": 160,
              "quantityPerJob": 160,
              "recalculate": false
          },
          "costs": {
              "totalPurchaseCost": 0,
              "extrasCosts": [],
              "extrasTotal": 0,
              "installCosts": 0
          },
          "sale": {
              "totalSold": 0,
              "totalSale": 0,
              "markUp": 0,
              "transactions": [],
              "brokersFee": [],
              "marketOrders": []
          },
          "materials": [
              {
                  "quantity": 5,
                  "volume": 5,
                  "typeID": 4247,
                  "name": "Helium Fuel Block",
                  "jobType": 1,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "jobType": 0,
                  "volume": 0.01,
                  "name": "Zydrine",
                  "typeID": 39,
                  "quantity": 25,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "name": "Fullerite-C72",
                  "volume": 2,
                  "jobType": 0,
                  "typeID": 30373,
                  "quantity": 100,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              },
              {
                  "quantity": 100,
                  "typeID": 30375,
                  "jobType": 0,
                  "name": "Fullerite-C28",
                  "volume": 2,
                  "purchasing": [],
                  "quantityPurchased": 0,
                  "purchasedCost": 0,
                  "purchaseComplete": false
              }
          ],
          "buildChar": null,
          "time": 10800
      },
      "rawData": {
          "materials": [
              {
                  "quantity": 5,
                  "volume": 5,
                  "typeID": 4247,
                  "name": "Helium Fuel Block",
                  "jobType": 1
              },
              {
                  "jobType": 0,
                  "volume": 0.01,
                  "name": "Zydrine",
                  "typeID": 39,
                  "quantity": 25
              },
              {
                  "name": "Fullerite-C72",
                  "volume": 2,
                  "jobType": 0,
                  "typeID": 30373,
                  "quantity": 100
              },
              {
                  "quantity": 100,
                  "typeID": 30375,
                  "jobType": 0,
                  "name": "Fullerite-C28",
                  "volume": 2
              }
          ],
          "products": [
              {
                  "quantity": 160,
                  "typeID": 30308
              }
          ],
          "time": 10800
      },
      "structureType": 1,
      "structureTypeDisplay": "Medium",
      "skills": [
          {
              "typeID": 45746,
              "level": 3
          }
      ]
  }
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