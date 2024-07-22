import { jobTypes } from "../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../global-config-app";

const { DEFAULT_MARKET_OPTION, DEFAULT_ORDER_OPTION, DEFAULT_ASSET_LOCATION } =
  GLOBAL_CONFIG;

class ApplicationSettingsObject {
  constructor(settings) {
    this.cloudAccounts =
      settings?.account?.cloudAccounts || settings?.cloudAccounts || false;
    this.hideTutorials =
      settings?.layout?.hideTutorials || settings?.hideTutorials || false;
    this.enableCompactView =
      settings?.layout?.enableCompactView ||
      settings?.enableCompactView ||
      false;
    this.localMarketDisplay =
      settings?.layout?.localMarketDisplay ||
      settings?.localMarketDisplay ||
      null;
    this.localOrderDisplay =
      settings?.layout?.localOrderDisplay ||
      settings?.localOrderDisplay ||
      null;
    this.esiJobTab = settings?.layout?.esiJobTab || settings?.esiJobTab || null;
    this.defaultMaterialEfficiencyValue =
      settings?.editJob?.defaultMaterialEfficiencyValue ||
      settings?.defaultMaterialEfficiencyValue ||
      0;
    this.defaultMarket =
      settings?.editJob?.defaultMarket ||
      settings?.defaultMarket ||
      DEFAULT_MARKET_OPTION;
    this.defaultOrders =
      settings?.editJob?.defaultOrders ||
      settings?.defaultOrders ||
      DEFAULT_ORDER_OPTION;
    this.hideCompleteMaterials =
      settings?.editJob?.hideCompleteMaterials ||
      settings?.hideCompleteMaterials ||
      false;
    this.defaultAssetLocation =
      settings?.editJob?.defaultAssetLocation ||
      settings?.defaultAssetLocation ||
      DEFAULT_ASSET_LOCATION;
    this.citadelBrokersFee =
      settings?.editJob?.citadelBrokersFee || settings?.citadelBrokersFee || 1;
    this.manufacturingStructures =
      settings?.structures?.manufacturing ||
      settings?.manufacturingStructures ||
      [];
    this.reactionStructures =
      settings?.structures?.reaction || settings?.reactionStructures || [];
    this.exemptTypeIDs = new Set(settings?.exemptTypeIDs || []);
  }

  toDocument() {
    return {
      account: {
        cloudAccounts: this.cloudAccounts,
      },
      editJob: {
        citatadelBrokersFee: this.citadelBrokersFee,
        defaultAssetLocation: this.defaultAssetLocation,
        defaultMarket: this.defaultMarket,
        defaultOrders: this.defaultOrders,
        hideCompleteMaterials: this.hideCompleteMaterials,
        defaultMaterialEfficiencyValue: this.defaultMaterialEfficiencyValue,
      },
      layout: {
        esiJobTab: this.esiJobTab,
        hideTutorials: this.hideTutorials,
        localMarketDisplay: this.localOrderDisplay,
        localOrderDisplay: this.localOrderDisplay,
        enableCompactView: this.enableCompactView,
      },
      structures: {
        manufacturing: this.manufacturingStructures,
        reaction: this.reactionStructures,
      },
      exemptTypeIDs: [...this.exemptTypeIDs],
    };
  }

  toggleCloudAccounts() {
    return new ApplicationSettingsObject({
      ...this,
      cloudAccounts: !this.cloudAccounts,
    });
  }

  toggleHideTutorials() {
    return new ApplicationSettingsObject({
      ...this,
      hideTutorials: !this.hideTutorials,
    });
  }

  toggleEnableCompactView() {
    return new ApplicationSettingsObject({
      ...this,
      enableCompactView: !this.enableCompactView,
    });
  }

  updatelocalMarketDisplay(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      localMarketDisplay: newValue,
    });
  }

  updateLocaleOrderDisplay(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      localOrderDisplay: newValue,
    });
  }

  updateEsiJobTab(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      esiJobTab: newValue,
    });
  }

  updateDefaultMaterialEfficiencyValue(newValue) {
    if (!newValue) return this;

    return new ApplicationSettingsObject({
      ...this,
      defaultAssetLocation: newValue,
    });
  }

  updateDefaultMarket(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      defaultMarket: newValue,
    });
  }

  updateDefaultOrders(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      defaultOrders: newValue,
    });
  }

  toggleHideCompleteMaterials() {
    return new ApplicationSettingsObject({
      ...this,
      hideCompleteMaterials: !this.hideCompleteMaterials,
    });
  }

  updateDefaultAssetLocation(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      defaultAssetLocation: newValue,
    });
  }

  updateCitadelBrokersFee(newValue) {
    if (!newValue) return this;
    return new ApplicationSettingsObject({
      ...this,
      citadelBrokersFee: newValue,
    });
  }

  updateExemptTypeIDs(newValue) {
    if (!newValue) return this;
    this.exemptTypeIDs.add(newValue);
    return new ApplicationSettingsObject(this);
  }

  checkTypeIDisExempt(inputTypeID) {
    if (!inputTypeID) return false;

    return this.exemptTypeIDs.has(inputTypeID);
  }

  addCustomManufacturingStructure(structure) {
    if (!structure) return this;
    this.manufacturingStructures.push(structure);
    return new ApplicationSettingsObject(this);
  }

  removeCustomManufacturingStructure(structure) {
    if (!structure) return;
    this.manufacturingStructures = this.manufacturingStructures.filter(
      (i) => i.id !== structure.id
    );
    if (this.manufacturingStructures.length > 0 && structure.default) {
      this.manufacturingStructures[0].default = true;
    }
    return new ApplicationSettingsObject(this);
  }

  setDefaultCustomManufacturingStructure(id) {
    if (!id) return;
    this.manufacturingStructures.forEach((obj) =>
      obj.id === id ? (obj.default = true) : (obj.default = false)
    );
    return new ApplicationSettingsObject(this);
  }

  addCustomReactionStructure(structure) {
    if (!structure) return this;
    this.reactionStructures.push(structure);
    return new ApplicationSettingsObject(this);
  }

  removeCustomReactionStructure(structure) {
    if (!structure) return;
    this.reactionStructures = this.reactionStructures.filter(
      (i) => i.id !== structure.id
    );
    if (this.reactionStructures.length > 0 && structure.default) {
      this.reactionStructures[0].default = true;
    }
    return new ApplicationSettingsObject(this);
  }

  setDefaultCustomReactionStructure(id) {
    if (!id) return;
    this.reactionStructures.forEach((obj) =>
      obj.id === id ? (obj.default = true) : (obj.default = false)
    );
    return new ApplicationSettingsObject(this);
  }

  getCustomStructureWithID(inputID) {
    if (!inputID) return null;
    let structureLocation;
    if (inputID.includes("manStruct")) {
      structureLocation = this.manufacturingStructures;
    } else if (inputID.includes("reacStruct")) {
      structureLocation = this.reactionStructures;
    } else {
      console.warn(`Input ID ${inputID} does not match.`);
      return null;
    }

    if (!Array.isArray(structureLocation)) {
      console.error("Structure location is not an array.");
      return null;
    }

    const foundStructure = structureLocation.find((obj) => obj.id === inputID);

    if (!foundStructure) {
      console.warn(`No structure found with ID ${inputID}.`);
      return null;
    }

    return foundStructure;
  }

  getDefaultCustomStructureWithJobType(inputJobType) {
    if (!inputJobType) return null;

    let structureLocation;

    if (jobTypes.manufacturing === inputJobType) {
      structureLocation = this.manufacturingStructures;
    } else if (jobTypes.reaction === inputJobType) {
      structureLocation = this.reactionStructures;
    } else {
      console.warn(`No custom structures for job type. ${inputJobType}`);
      return null;
    }
    if (!Array.isArray(structureLocation)) {
      console.error("Structure location is not an array.");
      return null;
    }

    return (
      structureLocation.find((obj) => obj.default) ||
      structureLocation[0] ||
      null
    );
  }
}

export default ApplicationSettingsObject;
