import uuid from "react-uuid";

class Group {
  constructor(data) {
    this.groupName = data?.groupName || "Untitled Group";
    this.groupID = data?.groupID || `group-${uuid()}`;
    this.includedJobIDs = data?.includedJobIDs || [];
    this.includedTypeIDs = new Set(data?.includedTypeIDs || []);
    this.materialIDs = new Set(data?.materialIDs || []);
    this.outputJobCount = data?.outputJobCount || 0;
    this.areComplete = data?.areComplete || [];
    this.showComplete = data?.showComplete || true;
    this.groupStatus = data?.groupStatus || 0;
    this.groupType = data?.groupType || 1;
    this.linkedJobIDs = data?.linkedJobIDs || [];
    this.linkedOrderIDs = data?.linkedOrderIDs || [];
    this.linkedTransIDs = data?.linkedTransIDs || [];
  }

  setGroupName(inputGroupName) {
    if (!inputGroupName) return;
    this.groupName = inputGroupName;
  }
  setGroupID(inputGroupID) {
    if (!inputGroupID) return;
    this.groupID = inputGroupID;
  }
  convertToNumber(id) {
    const num = typeof id === "string" ? Number(id) : id;
    return isNaN(num) ? null : num;
  }

  processIDs(inputIDs, action, targetSet) {
    if (!inputIDs || !action || !targetSet) return;

    if (Array.isArray(inputIDs) || inputIDs instanceof Set) {
      inputIDs.forEach((id) => {
        const numID = this.convertToNumber(id);
        if (numID) {
          action.call(targetSet, numID);
        }
      });
    } else {
      const numID = this.convertToNumber(id);
      if (numID) {
        action.call(targetSet, numID);
      }
    }
  }

  addIncludedJobIDs(inputJobIDs) {
    if (!inputJobIDs) return;

    if (Array.isArray(inputJobIDs) || inputJobIDs instanceof Set) {
      this.includedJobIDs = [...this.includedJobIDs, ...inputJobIDs];
    } else if (typeof inputJobIDs === "string") {
      this.includedJobIDs.push(inputJobIDs);
    }
  }

  removeIncludedJobIDs(inputJobIDs) {
    if (!inputJobIDs) return;

    if (Array.isArray(inputJobIDs) || inputJobIDs instanceof Set) {
      this.includedJobIDs = this.includedJobIDs.filter(
        (i) => !inputJobIDs.has(i) && !inputJobIDs.includes(i)
      );
    } else if (typeof inputJobIDs === "string") {
      this.includedJobIDs = this.includedJobIDs.filter(
        (i) => i !== inputJobIDs
      );
    }
  }

  addIncludedTypeIDs(inputJobIDs) {
    this.processIDs(inputJobIDs, Set.prototype.add, this.includedTypeIDs);
  }

  removeIncludedTypeIDs(inputJobIDs) {
    this.processIDs(inputJobIDs, Set.prototype.delete, this.includedTypeIDs);
    }
    
    addMaterialIDs(inputMaterialIDs) {
      this.processIDs(inputMaterialIDs, Set.prototype.add, this.materialIDs)

  }

    removeMaterialIDs(inputMaterialIDs) {
      this.processIDs(inputMaterialIDs, Set.prototype.delete, this.materialIDs)
  }
}

export default function createGroupObject(inputData) {
  return new Group(inputData);
}
