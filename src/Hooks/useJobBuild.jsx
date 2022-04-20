import { useContext, useMemo } from "react";
import { appCheck } from "../firebase";
import { getToken } from "firebase/app-check";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { SisiDataFilesContext } from "../Context/EveDataContext";
import { jobTypes } from "../Context/defaultValues";
import { useBlueprintCalc } from "./useBlueprintCalc";
import {
  DataExchangeContext,
  DialogDataContext,
  SnackBarDataContext,
} from "../Context/LayoutContext";
import { JobArrayContext } from "../Context/JobContext";

export function useJobBuild() {
  const { sisiDataFiles } = useContext(SisiDataFilesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { CalculateResources } = useBlueprintCalc();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  class Job {
    constructor(itemJson) {
      this.buildVer = process.env.REACT_APP_Version;
      this.metaLevel = itemJson.metaGroup || null;
      this.jobType = itemJson.jobType;
      if (sisiDataFiles) {
        this.name = `${itemJson.name} (Singularity)`;
      } else {
        this.name = itemJson.name;
      }
      this.jobID = Date.now();
      this.jobStatus = 0;
      this.volume = itemJson.volume;
      this.itemID = itemJson.itemID;
      this.maxProductionLimit = itemJson.maxProductionLimit;
      this.runCount = 1;
      this.jobCount = 1;
      this.bpME = 0;
      this.bpTE = 0;
      this.rigType = 0;
      this.systemType = 1;
      this.apiJobs = [];
      this.apiOrders = [];
      this.apiTransactions = [];
      this.parentJob = [];
      this.blueprintTypeID = itemJson.blueprintTypeID || null;
      this.projectID = null;
      this.build = {
        products: {
          totalQuantity: 0,
          quantityPerJob: 0,
        },
        costs: {
          totalPurchaseCost: 0,
          extrasCosts: [],
          extrasTotal: 0,
          linkedJobs: [],
          installCosts: 0,
          inventionCosts: 0,
          inventionEntries: [],
        },
        sale: {
          totalSold: 0,
          totalSale: 0,
          markUp: 0,
          marketOrders: [],
          transactions: [],
          brokersFee: [],
        },
        materials: null,
        buildChar: null,
        sisiData: sisiDataFiles,
      };
      this.rawData = {};
      this.layout = {
        localMarketDisplay: null,
        localOrderDisplay: null,
        esiJobTab: null,
      };

      if (itemJson.jobType === jobTypes.manufacturing) {
        this.rawData.materials = itemJson.activities.manufacturing.materials;
        this.rawData.products = itemJson.activities.manufacturing.products;
        this.rawData.time = itemJson.activities.manufacturing.time;
        this.structureType = 0;
        this.structureTypeDisplay = "Station";
        this.skills = itemJson.activities.manufacturing.skills;
        this.build.materials = JSON.parse(
          JSON.stringify(itemJson.activities.manufacturing.materials)
        );
        this.build.time = JSON.parse(
          JSON.stringify(itemJson.activities.manufacturing.time)
        );
      }

      if (itemJson.jobType === jobTypes.reaction) {
        this.rawData.materials = itemJson.activities.reaction.materials;
        this.rawData.products = itemJson.activities.reaction.products;
        this.rawData.time = itemJson.activities.reaction.time;
        this.structureType = 1;
        this.structureTypeDisplay = "Medium";
        this.skills = itemJson.activities.reaction.skills;
        this.build.materials = JSON.parse(
          JSON.stringify(itemJson.activities.reaction.materials)
        );
        this.build.time = JSON.parse(
          JSON.stringify(itemJson.activities.reaction.time)
        );
      }

      if (itemJson.jobType === jobTypes.pi) {
        this.rawData = itemJson.activities.pi;
      }
    }
  }

  const buildJob = async (itemID, itemQty, parentJobs) => {
    try {
      if (itemID !== undefined) {
        const appCheckToken = await getToken(appCheck, true);
        const response = await fetch(
          sisiDataFiles
            ? `${process.env.REACT_APP_APIURL}/item/sisiData/${itemID}`
            : `${process.env.REACT_APP_APIURL}/item/${itemID}`,
          {
            headers: {
              "X-Firebase-AppCheck": appCheckToken.token,
            },
          }
        );
        const itemJson = await response.json();
        const outputObject = new Job(itemJson);
        try {
          outputObject.build.materials.forEach((material) => {
            material.purchasing = [];
            material.quantityPurchased = 0;
            material.purchasedCost = 0;
            material.purchaseComplete = false;
            material.childJob = [];
          });
          outputObject.build.materials.sort((a, b) => {
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          });

          outputObject.build.buildChar = parentUser.CharacterHash;
          if (isLoggedIn) {
            if (outputObject.jobType === jobTypes.manufacturing) {
              let blueprintOptions = [];
              users.forEach((user) => {
                let temp = user.apiBlueprints.filter(
                  (i) => i.type_id === outputObject.blueprintTypeID
                );
                temp.forEach((i) => {
                  blueprintOptions.push(i);
                });
              });
              if (blueprintOptions.length > 0) {
                blueprintOptions.sort(
                  (a, b) =>
                    b.material_efficiency - a.material_efficiency ||
                    b.time_efficiency - a.time_efficiency
                );
                outputObject.bpME = blueprintOptions[0].material_efficiency;
                outputObject.bpTE = blueprintOptions[0].time_efficiency / 2;
              }

              const structureData =
                parentUser.settings.structures.manufacturing.find(
                  (i) => i.default === true
                );
              if (structureData !== undefined) {
                outputObject.rigType = structureData.rigType;
                outputObject.systemType = structureData.systemType;
                outputObject.structureType = structureData.structureValue;
                outputObject.structureTypeDisplay = structureData.structureName;
              }
            }
            if (outputObject.jobType === jobTypes.reaction) {
              const structureData =
                parentUser.settings.structures.reaction.find(
                  (i) => i.default === true
                );
              if (structureData !== undefined) {
                outputObject.rigType = structureData.rigType;
                outputObject.systemType = structureData.systemType;
                outputObject.structureType = structureData.structureValue;
                outputObject.structureTypeDisplay = structureData.structureName;
              }
            }
          }
          if (itemQty != null) {
            outputObject.jobCount = Math.ceil(
              itemQty /
                (outputObject.maxProductionLimit *
                  outputObject.rawData.products[0].quantity)
            );
            outputObject.runCount = Math.ceil(
              itemQty /
                outputObject.rawData.products[0].quantity /
                outputObject.jobCount
            );
          }

          const calculatedJob = CalculateResources(outputObject);
          if (parentJobs !== undefined) {
            let itemParents = [];
            parentJobs.forEach((job) => {
              job.build.materials.forEach((mat) => {
                if (mat.typeID === calculatedJob.itemID) {
                  itemParents.push(job.jobID);
                }
              });
            });
            calculatedJob.parentJob = itemParents;
          }
          return calculatedJob;
        } catch (err) {
          jobBuildErrors("objectError");
          return undefined;
        }
      } else {
        jobBuildErrors("Item Data Missing From Request");
        return undefined;
      }
    } catch (err) {
      jobBuildErrors(err.name);
      return undefined;
    }
  };

  const jobBuildErrors = (newJob) => {
    if (newJob === "TypeError") {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: "No blueprint found for this item",
        severity: "error",
        autoHideDuration: 2000,
      }));
      updateDataExchange(false);
    } else if (newJob === "objectError") {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: "Error building job object, please try again",
        severity: "error",
        autoHideDuration: 2000,
      }));
      updateDataExchange(false);
    } else if (newJob === "Item Data Missing From Request") {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: "Item Data Missing From Request",
        severity: "error",
        autoHideDuration: 2000,
      }));
      updateDataExchange(false);
    } else {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: "Unkown Error Contact Admin",
        severity: "error",
        autoHideDuration: 2000,
      }));
      updateDataExchange(false);
    }
  };

  const checkAllowBuild = () => {
    if (!isLoggedIn && jobArray.length > 20) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body:
          "You have exceeded the maximum number of jobs you can create as an unregistered user." +
          "\r\n" +
          "Sign into your Eve Account to create more.Jobs that have been created without registering will be lost upon leaving / refreshing the page.",
      }));
      return false;
    } else if (isLoggedIn && jobArray.length > 300) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You currently cannot create more than 300 individual job cards. Remove existing job cards to add more.",
      }));
      return false;
    } else {
      return true;
    }
  };
  return { buildJob, checkAllowBuild, jobBuildErrors };
}
