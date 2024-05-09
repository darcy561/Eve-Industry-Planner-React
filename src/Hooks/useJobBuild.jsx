import { useContext } from "react";
import { appCheck } from "../firebase";
import { getToken } from "firebase/app-check";
import { IsLoggedInContext } from "../Context/AuthContext";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
  SisiDataFilesContext,
} from "../Context/EveDataContext";
import { jobTypes } from "../Context/defaultValues";
import { useBlueprintCalc } from "./useBlueprintCalc";
import {
  DataExchangeContext,
  DialogDataContext,
  SnackBarDataContext,
} from "../Context/LayoutContext";
import { JobArrayContext } from "../Context/JobContext";
import uuid from "react-uuid";
import { useInstallCostsCalc } from "./GeneralHooks/useInstallCostCalc";
import { useHelperFunction } from "./GeneralHooks/useHelperFunctions";

export function useJobBuild() {
  const { sisiDataFiles } = useContext(SisiDataFilesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray } = useContext(JobArrayContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { esiBlueprints } = useContext(PersonalESIDataContext);
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const { calculateTime, calculateResources } = useBlueprintCalc();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();
  const { findParentUser } = useHelperFunction();

  const parentUser = findParentUser();

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
      this.jobID = `job-${uuid()}`;
      this.jobStatus = 0;
      this.volume = itemJson.volume;
      this.itemID = itemJson.itemID;
      this.maxProductionLimit = itemJson.maxProductionLimit;

      this.apiJobs = new Set();
      this.apiOrders = new Set();
      this.apiTransactions = new Set();
      this.parentJob = [];
      this.blueprintTypeID = itemJson.blueprintTypeID || null;
      this.groupID = null;
      this.isReadyToSell = false;
      this.build = {
        setup: {},
        products: {
          totalQuantity: 0,
        },
        childJobs: {},
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
        sisiData: buildRequest?.sisiData || false,
      };
      this.rawData = {};
      this.layout = {
        localMarketDisplay: null,
        localOrderDisplay: null,
        esiJobTab: null,
        setupToEdit: null,
        resourceDisplayType: null,
      };

      if (itemJson.jobType === jobTypes.manufacturing) {
        this.rawData.materials = itemJson.activities.manufacturing.materials;
        this.rawData.products = itemJson.activities.manufacturing.products;
        this.rawData.time = itemJson.activities.manufacturing.time;
        this.skills = itemJson.activities.manufacturing.skills || [];
        this.build.materials = JSON.parse(
          JSON.stringify(itemJson.activities.manufacturing.materials)
        );
        this.itemsProducedPerRun =
          itemJson.activities.manufacturing.products[0].quantity;
      }

      if (itemJson.jobType === jobTypes.reaction) {
        this.rawData.materials = itemJson.activities.reaction.materials;
        this.rawData.products = itemJson.activities.reaction.products;
        this.rawData.time = itemJson.activities.reaction.time;
        this.skills = itemJson.activities.reaction.skills || [];
        this.build.materials = JSON.parse(
          JSON.stringify(itemJson.activities.reaction.materials)
        );
        this.itemsProducedPerRun =
          itemJson.activities.reaction.products[0].quantity;
      }
    }
  }

  const buildJobObject = async (itemJson, buildRequest) => {
    try {
      const outputObject = new Job(itemJson, buildRequest);
      try {
        outputObject.build.materials.forEach((material) => {
          material.purchasing = [];
          material.quantityPurchased = 0;
          material.purchasedCost = 0;
          material.purchaseComplete = false;
          outputObject.build.childJobs[material.typeID] = [];
        });

        await buildSetupOptions(outputObject, buildRequest);

        buildRequest_ChildJobs(buildRequest, outputObject);
        buildRequest_ParentJobs(buildRequest, outputObject);
        buildRequest_GroupID(buildRequest, outputObject);

        outputObject.build.materials.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });

        outputObject.build.products.totalQuantity = Object.values(
          outputObject.build.setup
        ).reduce((prev, { runCount, jobCount }) => {
          return prev + outputObject.itemsProducedPerRun * runCount * jobCount;
        }, 0);

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

  const buildJob = async (buildRequest) => {
    try {
      if (Array.isArray(buildRequest)) {
        let returnArray = [];
        if (buildRequest.length === 0) return returnArray;

        let buildRequestIDs = new Set();
        for (let request of buildRequest) {
          buildRequestIDs.add(request.itemID);
        }
        const appCheckToken = await getToken(appCheck, true);
        const response = await fetch(`${import.meta.env.VITE_APIURL}/item`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Firebase-AppCheck": appCheckToken.token,
            accountID: parentUser.accountID,
            appVersion: __APP_VERSION__,
          },
          body: JSON.stringify({
            idArray: [...buildRequestIDs],
          }),
        });
        let jsonData = await response.json();

        for (let request of buildRequest) {
          let itemJson = jsonData.find((i) => i.itemID === request.itemID);
          if (!itemJson) {
            continue;
          }
          returnArray.push(await buildJobObject(itemJson, request));
        }
        return returnArray;
      } else {
        if (!buildRequest.hasOwnProperty("itemID")) {
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
              appVersion: __APP_VERSION__,
            },
          }
        );
        if (response.status === 400) {
          jobBuildErrors(buildRequest, "Outdated App Version");
          return undefined;
        }
        const itemJson = await response.json();

        return await buildJobObject(itemJson, buildRequest);
      }
    } catch (err) {
      console.log(err.message);
      return null;
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
      } else if (newJob === "Outdated App Version") {
        updateDialogData((prev) => ({
          ...prev,
          buttonText: "Close",
          id: "OutdatedAppVersion",
          open: true,
          title: "Outdated App Version",
          body: "A newer version of the application is available, refresh the page to begin using this.",
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

  function recalculateItemQty(
    maxProductionLimit,
    baseQuantity,
    itemQuantityRequired
  ) {
    const jobs = [];
    const totalPerMaxRuns = maxProductionLimit * baseQuantity;
    const numMaxRuns = Math.floor(itemQuantityRequired / totalPerMaxRuns);
    let leftOvers = 0;
    let singleJobRequired = false;

    if (totalPerMaxRuns > itemQuantityRequired) {
      jobs.push({
        runCount: Math.ceil(itemQuantityRequired / baseQuantity),
        jobCount: 1,
      });
      singleJobRequired = true;
    } else {
      leftOvers = itemQuantityRequired - totalPerMaxRuns * numMaxRuns;
    }

    if (!singleJobRequired) {
      jobs.push({
        runCount: maxProductionLimit,
        jobCount: numMaxRuns,
      });
    }
    if (leftOvers > 0) {
      jobs.push({
        runCount: Math.ceil(leftOvers / baseQuantity),
        jobCount: 1,
      });
    }

    return jobs;
  }

  async function buildSetupOptions(inputJobObject, buildRequestObject) {
    const setupLocation = inputJobObject.build.setup;
    const existingMaterialsLocation = inputJobObject.rawData.materials;
    const rawTimeValue = inputJobObject.rawData.time;

    const requiredQuantity =
      buildRequestObject?.itemQty ||
      inputJobObject.rawData.products[0].quantity;

    const { ME, TE } = addItemBlueprint(
      inputJobObject.jobType,
      inputJobObject.blueprintTypeID
    );
    const structureData = addDefaultStructure(inputJobObject.jobType);

    const setupQuantities = recalculateItemQty(
      inputJobObject.maxProductionLimit,
      inputJobObject.rawData.products[0].quantity,
      requiredQuantity
    );

    for (let i = 0; i < setupQuantities.length; i++) {
      let nextObject = buildNewSetupObject({
        ME,
        TE,
        ...structureData,
        ...setupQuantities[i],
        systemID: buildRequestObject?.systemID || structureData.systemID,
        characterToUse:
          buildRequestObject?.characterToUse || parentUser.CharacterHash,
        rawTimeValue,
        jobType: inputJobObject.jobType,
      });
      setupLocation[nextObject.id] = nextObject;

      existingMaterialsLocation.forEach((material) => {
        setupLocation[nextObject.id].materialCount[material.typeID] = {
          typeID: material.typeID,
          quantity: material.quantity,
          rawQuantity: material.quantity,
        };
      });
      setupLocation[nextObject.id].estimatedTime = calculateTime(
        setupLocation[nextObject.id],
        inputJobObject.skills
      );
      setupLocation[nextObject.id].materialCount = calculateResources(
        setupLocation[nextObject.id]
      );
      setupLocation[nextObject.id].estimatedInstallCost =
        calculateInstallCostFromJob(setupLocation[nextObject.id]);
    }

    const newTotalQuantities = calculateJobMaterialQuantities(setupLocation);

    for (const material of inputJobObject.build.materials) {
      const materialId = material.typeID.toString();
      if (materialId in newTotalQuantities) {
        material.quantity = newTotalQuantities[materialId];
      }
    }
  }

  function buildNewSetupObject(inputOptions) {
    return {
      id: uuid(),
      runCount: inputOptions?.runCount || 1,
      jobCount: inputOptions?.jobCount || 1,
      ME: inputOptions?.ME || 0,
      TE: inputOptions?.TE || 0,
      structureID: inputOptions?.structureID || 0,
      rigID: inputOptions?.rigID || 0,
      systemTypeID: inputOptions?.systemTypeID || 0,
      systemID: inputOptions?.systemID || 30000142,
      taxValue: inputOptions?.taxValue || 0.25,
      estimatedInstallCost: 0,
      customStructureID: inputOptions?.customStructureID || null,
      selectedCharacter: inputOptions?.characterToUse || null,
      materialCount: {},
      estimatedTime: 0,
      rawTime: inputOptions?.rawTimeValue || 0,
      jobType: inputOptions.jobType,
    };
  }

  function addItemBlueprint(inputJobType, blueprintTypeID) {
    const defaultReturn = {
      ME: checkForDefaultMaterialEfficiecyValue(inputJobType),
      TE: 0,
    };

    if (inputJobType !== jobTypes.manufacturing || !isLoggedIn) {
      return defaultReturn;
    }

    const filteredBlueprints = [
      ...esiBlueprints.flatMap((entry) => entry?.data ?? []),
      ...Array.from(corpEsiBlueprints.values())
        .filter((obj) => Object.keys(obj).length > 0)
        .map(Object.values)
        .reduce((acc, val) => acc.concat(val), []),
    ].filter((entry) => entry.type_id === blueprintTypeID);

    if (filteredBlueprints.length < 1) {
      return defaultReturn;
    }

    filteredBlueprints.sort(
      (a, b) =>
        a.quantity.toString().localeCompare(b.quantity.toString()) ||
        b.material_efficiency - a.material_efficiency ||
        b.time_efficiency - a.time_efficiency
    );

    return {
      ME: filteredBlueprints[0].material_efficiency,
      TE: filteredBlueprints[0].time_efficiency / 2,
    };
  }

  function addDefaultStructure(inputJobType) {
    const typeMap = {
      [jobTypes.manufacturing]: "manufacturing",
      [jobTypes.reaction]: "reaction",
    };

    const matchedStructure = parentUser.settings.structures[
      typeMap[inputJobType]
    ].find((i) => i.default);

    if (!matchedStructure) return {};

    return {
      rigID: matchedStructure.rigType,
      structureID: matchedStructure.structureType,
      systemTypeID: matchedStructure.systemType,
      systemID: matchedStructure.systemID,
      taxValue: matchedStructure.tax,
      customStructureID: matchedStructure.id,
    };
  }

  function buildRequest_ChildJobs(buildRequest, outputObject) {
    if (!Object.hasOwn(buildRequest, "childJobs")) {
      return;
    }

    for (let material of outputObject.build.materials) {
      const buildItem = buildRequest.childJobs.find(
        (i) => i.typeID === material.typeID
      );
      if (!buildItem) {
        continue;
      }
      outputObject.build.childJobs[material.typeID] = [...buildItem.childJobs];
    }
  }

  function buildRequest_ParentJobs(buildRequest, outputObject) {
    if (!buildRequest.hasOwnProperty("parentJobs")) {
      return;
    }
    outputObject.parentJob = [...buildRequest.parentJobs];
  }

  function buildRequest_GroupID(buildRequest, outputObject) {
    if (!buildRequest.hasOwnProperty("groupID")) {
      return;
    }
    outputObject.groupID = buildRequest.groupID;
  }

  function calculateJobMaterialQuantities(jobSetupObject) {
    const totals = {};

    for (const objId of Object.keys(jobSetupObject)) {
      const materialCount = jobSetupObject[objId].materialCount || {};

      for (const materialId of Object.keys(materialCount)) {
        const quantity = materialCount[materialId].quantity || 0;
        totals[materialId] = (totals[materialId] || 0) + quantity;
      }
    }

    return totals;
  }

  function checkForDefaultMaterialEfficiecyValue(inputJobType) {
    if (
      parentUser.settings.editJob?.defaultMaterialEfficiencyValue &&
      inputJobType === jobTypes.manufacturing
    ) {
      return parentUser.settings.editJob.defaultMaterialEfficiencyValue;
    }
    return 0;
  }

  return {
    addDefaultStructure,
    addItemBlueprint,
    buildJob,
    buildNewSetupObject,
    calculateJobMaterialQuantities,
    checkAllowBuild,
    jobBuildErrors,
    recalculateItemQty,
  };
}
