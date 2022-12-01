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
  const { CalculateResources, CalculateTime } = useBlueprintCalc();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  class Job {
    constructor(itemJson, buildRequest) {
      this.buildVer = __APP_VERSION__;
      this.metaLevel = itemJson.metaGroup || null;
      this.jobType = itemJson.jobType;
      if (buildRequest.sisiData) {
        this.name = `${itemJson.name} (Singularity)`;
      } else {
        this.name = itemJson.name;
      }
      this.jobID = Date.now();
      this.jobStatus = 0;
      this.isSnapshot = false;
      this.volume = itemJson.volume;
      this.itemID = itemJson.itemID;
      this.maxProductionLimit = itemJson.maxProductionLimit;
      this.runCount = 1;
      this.jobCount = 1;
      this.bpME = 0;
      this.bpTE = 0;
      this.rigType = 0;
      this.systemType = 1;
      this.apiJobs = new Set();
      this.apiOrders = new Set();
      this.apiTransactions = new Set();
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
          marketOrders: [],
          transactions: [],
          brokersFee: [],
        },
        materials: null,
        buildChar: null,
        sisiData: buildRequest.sisiData || false,
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

  const buildJob = async (buildRequest) => {
    try {
      if (buildRequest.itemID === undefined) {
        jobBuildErrors(buildRequest, "Item Data Missing From Request");
        return undefined;
      }
      const appCheckToken = await getToken(appCheck, true);
      const response = await fetch(
        buildRequest.sisiData
          ? `${import.meta.env.VITE_APIURL}/item/sisiData/${
              buildRequest.itemID
            }`
          : `${import.meta.env.VITE_APIURL}/item/${buildRequest.itemID}`,
        {
          headers: {
            "X-Firebase-AppCheck": appCheckToken.token,
            accountID: parentUser.accountID,
            appVersion: __APP_VERSION__
          },
        }
      );
      const itemJson = await response.json();

      const outputObject = new Job(itemJson, buildRequest);
      try {
        outputObject.build.materials.forEach((material) => {
          material.purchasing = [];
          material.quantityPurchased = 0;
          material.purchasedCost = 0;
          material.purchaseComplete = false;
          material.childJob = [];
          if (buildRequest.childJobs !== undefined) {
            buildRequest.childJobs.forEach((i) => {
              if (i.typeID === material.typeID) {
                material.childJob = [...i.childJobs];
              }
            });
          }
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
              let temp = JSON.parse(
                sessionStorage.getItem(`esiBlueprints_${user.CharacterHash}`)
              ).filter((i) => i.type_id === outputObject.blueprintTypeID);
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
            const structureData = parentUser.settings.structures.reaction.find(
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
        if (buildRequest.itemQty !== undefined) {
          recalculateItemQty(outputObject, buildRequest.itemQty);
        }

        outputObject.build.materials = CalculateResources({
          jobType: outputObject.jobType,
          rawMaterials: outputObject.rawData.materials,
          outputMaterials: outputObject.build.materials,
          runCount: outputObject.runCount,
          jobCount: outputObject.jobCount,
          bpME: outputObject.bpME,
          structureType: outputObject.structureType,
          rigType: outputObject.rigType,
          systemType: outputObject.systemType,
        });
        outputObject.build.time = CalculateTime({
          jobType: outputObject.jobType,
          CharacterHash: outputObject.build.buildChar,
          structureTypeDisplay: outputObject.structureTypeDisplay,
          runCount: outputObject.runCount,
          bpTE: outputObject.bpTE,
          rawTime: outputObject.rawData.time,
          skills: outputObject.skills,
        });
        outputObject.build.products.totalQuantity =
          outputObject.rawData.products[0].quantity *
          outputObject.runCount *
          outputObject.jobCount;

        outputObject.build.products.quantityPerJob =
          outputObject.rawData.products[0].quantity * outputObject.jobCount;

        if (buildRequest.parentJobs !== undefined) {
          outputObject.parentJob = outputObject.parentJob.concat(
            buildRequest.parentJobs
          );
        }
        return outputObject;
      } catch (err) {
        console.log(err);
        jobBuildErrors(buildRequest, "objectError");
        return undefined;
      }
    } catch (err) {
      jobBuildErrors(buildRequest, err.name);
      return undefined;
    }
  };

  const jobBuildErrors = (buildRequest, newJob) => {
    if (buildRequest.throwError !== undefined && !buildRequest.throwError) {
      return null;
    }
    if (buildRequest.throwError === undefined || buildRequest.throwError) {
      if (newJob === "TypeError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "No blueprint found for this item",
          severity: "error",
          autoHideDuration: 2000,
        }));
      } else if (newJob === "objectError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Error building job object, please try again",
          severity: "error",
          autoHideDuration: 2000,
        }));
      } else if (newJob === "Item Data Missing From Request") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Item Data Missing From Request",
          severity: "error",
          autoHideDuration: 2000,
        }));
      } else {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Unkown Error Contact Admin",
          severity: "error",
          autoHideDuration: 2000,
        }));
      }
    }
    updateDataExchange(false);
  };

  const checkAllowBuild = () => {
    if (!isLoggedIn && jobArray.length > 50) {
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

  const recalculateItemQty = (job, itemQty) => {
    job.jobCount = Math.ceil(
      itemQty / (job.maxProductionLimit * job.rawData.products[0].quantity)
    );
    job.runCount = Math.ceil(
      itemQty / job.rawData.products[0].quantity / job.jobCount
    );
    return job;
  };

  return { buildJob, checkAllowBuild, jobBuildErrors, recalculateItemQty };
}
