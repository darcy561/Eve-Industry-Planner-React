import uuid from "react-uuid";

class Group {
  constructor(data) {
    this.groupName = data?.groupName || "Untitled Group";
    this.groupID = data?.groupID || `group-${uuid()}`;
    this.includedJobIDs = new Set(data?.includedJobIDs?.map(String) || []);
    this.includedTypeIDs = new Set(data?.includedTypeIDs?.map(String) || []);
    this.materialIDs = new Set(data?.materialIDs || []);
    this.outputJobCount = data?.outputJobCount || 0;
    this.areComplete = new Set(data?.areComplete?.map(String) || []);
    this.showComplete = data?.showComplete || true;
    this.groupStatus = data?.groupStatus || 0;
    this.groupType = data?.groupType || 1;
    this.linkedJobIDs = new Set(data?.linkedJobIDs || []);
    this.linkedOrderIDs = new Set(data?.linkedOrderIDs || []);
    this.linkedTransIDs = new Set(data?.linkedTransIDs || []);
  }

  toDocument() {
    return {
      groupName: this.groupName,
      groupID: this.groupID,
      includedJobIDs: [...this.includedJobIDs],
      includedTypeIDs: [...this.includedTypeIDs],
      outputJobCount: this.outputJobCount,
      areComplete: [...this.areComplete],
      showComplete: this.showComplete,
      groupStatus: this.groupStatus,
      groupType: this.groupType,
      linkedJobIDs: [...this.linkedJobIDs],
      linkedOrderIDs: [...this.linkedOrderIDs],
      linkedTransIDs: [...this.linkedTransIDs],
    };
  }

  _convertToNumber(id) {
    const num = Number(id);
    return isNaN(num) ? null : num;
  }

  _convertToString(id) {
    return id != null ? String(id) : null;
  }

  _toSet(inputIDs, action, targetSet, converter) {
    if (!inputIDs || !action || !targetSet || !converter) return;

    if (Array.isArray(inputIDs) || inputIDs instanceof Set) {
      inputIDs.forEach((id) => {
        const convertedID = converter(id);
        if (convertedID !== null) {
          action.call(targetSet, convertedID);
        }
      });
    } else {
      const convertedID = converter(inputIDs);
      if (convertedID !== null) {
        action.call(targetSet, convertedID);
      }
    }
  }

  _newSet(inputIDs, converter) {
    const _newSet = new Set();
    this._toSet(inputIDs, Set.prototype.add, _newSet, converter);
    return _newSet;
  }

  _buildNewGroupData(arrayOfJobs) {
    if (!arrayOfJobs) return;

    const updateSet = (targetSet, sourceSet) => {
      sourceSet.forEach((item) => targetSet.add(item));
    };

    let newOutputJobCount = 0;
    const newMaterialIDs = new Set();
    const newJobTypeIDs = new Set();
    const newIncludedJobIDs = new Set();
    const newLinkedJobIDs = new Set();
    const newLinkedOrderIDs = new Set();
    const newLinkedTransIDs = new Set();

    arrayOfJobs.forEach((job) => {
      if (job.parentJob.length === 0) {
        newOutputJobCount++;
      }
      newMaterialIDs.add(job.itemID);
      newJobTypeIDs.add(job.itemID);
      newIncludedJobIDs.add(job.jobID);
      updateSet(newLinkedJobIDs, job.apiJobs);
      updateSet(newLinkedOrderIDs, job.apiOrders);
      updateSet(newLinkedTransIDs, job.apiTransactions);

      job.build.materials.forEach((mat) => {
        newMaterialIDs.add(mat.typeID);
      });
    });

    return {
      newOutputJobCount,
      newMaterialIDs,
      newJobTypeIDs,
      newIncludedJobIDs,
      newLinkedJobIDs,
      newLinkedOrderIDs,
      newLinkedTransIDs,
    };
  }

  setGroupName(inputGroupName) {
    if (!inputGroupName || inputGroupName.length === 0) return;
    this.groupName = inputGroupName;
  }

  setGroupID(inputGroupID) {
    if (!inputGroupID) return;
    this.groupID = inputGroupID;
  }

  addIncludedJobIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.includedJobIDs,
      this._convertToString
    );
  }

  setIncludedJobIDs(inputJobIDs) {
    this.includedJobIDs = this._newSet(inputJobIDs, this._convertToString);
  }

  removeIncludedJobIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.includedJobIDs,
      this._convertToString
    );
  }

  addIncludedTypeIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.includedTypeIDs,
      this._convertToNumber
    );
  }

  setIncludedTypeIDs(inputJobIDs) {
    this.includedTypeIDs = this._newSet(inputJobIDs, this._convertToNumber);
  }

  removeIncludedTypeIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.includedTypeIDs,
      this._convertToNumber
    );
  }

  addMaterialIDs(inputMaterialIDs) {
    this._toSet(
      inputMaterialIDs,
      Set.prototype.add,
      this.materialIDs,
      this._convertToNumber
    );
  }

  setMaterialIDs(inputJobIDs) {
    this.materialIDs = this._newSet(inputJobIDs, this._convertToNumber);
  }

  removeMaterialIDs(inputMaterialIDs) {
    this._toSet(
      inputMaterialIDs,
      Set.prototype.delete,
      this.materialIDs,
      this._convertToNumber
    );
  }

  updateOutputJobCount(input) {
    if (input == null || isNaN(Number(input))) return;
    this.outputJobCount = Number(input);
  }

  addAreComplete(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.areComplete,
      this._convertToString
    );
  }

  setAreComplete(inputJobIDs) {
    this.areComplete = this._newSet(inputJobIDs, this._convertToString);
  }

  removeAreComplete(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.areComplete,
      this._convertToString
    );
  }

  toggleShowComplete() {
    this.showComplete = !this.showComplete;
  }

  updateGroupStatus(input) {
    if (input == null || isNaN(Number(input))) return;
    this.groupStatus = Number(input);
  }

  addLinkedOrderIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.linkedOrderIDs,
      this._convertToNumber
    );
  }

  setLinkedOrderIDs(inputJobIDs) {
    this.linkedOrderIDs = this._newSet(inputJobIDs, this._convertToNumber);
  }

  removeLinkedOrderIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.linkedOrderIDs,
      this._convertToNumber
    );
  }

  addLinkedJobIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.linkedJobIDs,
      this._convertToNumber
    );
  }

  setLinkedJobIDs(inputJobIDs) {
    this.linkedJobIDs = this._newSet(inputJobIDs, this._convertToNumber);
  }

  removeLinkedJobIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.linkedJobIDs,
      this._convertToNumber
    );
  }

  addLinkedTransIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.add,
      this.linkedTransIDs,
      this._convertToNumber
    );
  }

  setLinkedTransIDs(inputJobIDs) {
    this.linkedTransIDs = this._newSet(inputJobIDs, this._convertToNumber);
  }

  removeLinkedTransIDs(inputJobIDs) {
    this._toSet(
      inputJobIDs,
      Set.prototype.delete,
      this.linkedTransIDs,
      this._convertToNumber
    );
  }

  updateGroupData(inputJobObjects) {
    if (!inputJobObjects) return;

    const jobArray = Array.isArray(inputJobObjects)
      ? inputJobObjects
      : [inputJobObjects];

    const {
      newOutputJobCount,
      newMaterialIDs,
      newJobTypeIDs,
      newIncludedJobIDs,
      newLinkedJobIDs,
      newLinkedOrderIDs,
      newLinkedTransIDs,
    } = this._buildNewGroupData(jobArray);

    this.updateOutputJobCount(newOutputJobCount);
    this.setMaterialIDs(newMaterialIDs);
    this.setIncludedJobIDs(newIncludedJobIDs);
    this.setIncludedTypeIDs(newJobTypeIDs);
    this.setLinkedJobIDs(newLinkedJobIDs);
    this.setLinkedOrderIDs(newLinkedOrderIDs);
    this.setLinkedTransIDs(newLinkedTransIDs);
  }

  addJobsToGroup(inputJobObjects) {
    if (!inputJobObjects) return;

    const jobArray = Array.isArray(inputJobObjects)
      ? inputJobObjects
      : [inputJobObjects];

    const {
      newOutputJobCount,
      newMaterialIDs,
      newJobTypeIDs,
      newIncludedJobIDs,
      newLinkedJobIDs,
      newLinkedOrderIDs,
      newLinkedTransIDs,
    } = this._buildNewGroupData(jobArray);

    this.updateOutputJobCount(newOutputJobCount);
    this.addMaterialIDs(newMaterialIDs);
    this.addIncludedJobIDs(newIncludedJobIDs);
    this.addIncludedTypeIDs(newJobTypeIDs);
    this.addLinkedJobIDs(newLinkedJobIDs);
    this.addLinkedOrderIDs(newLinkedOrderIDs);
    this.addLinkedTransIDs(newLinkedTransIDs);
  }

  removeJobsFromGroup(jobsToRemove, jobArray) {
    if (!jobsToRemove || !jobArray) return;

    const jobsToRemoveAsArray = Array.isArray(jobsToRemove)
      ? jobsToRemove
      : [jobsToRemove];

    const idsOfJobsToRemove = new Set();

    jobsToRemoveAsArray.forEach((job) => idsOfJobsToRemove.add(job.jobID));

    const remainingGroupJobs = jobArray.filter(
      (job) => job.groupID === this.groupID && !idsOfJobsToRemove.has(job.jobID)
    );

    const {
      newOutputJobCount,
      newMaterialIDs,
      newJobTypeIDs,
      newIncludedJobIDs,
      newLinkedJobIDs,
      newLinkedOrderIDs,
      newLinkedTransIDs,
    } = this._buildNewGroupData(remainingGroupJobs);

    this.updateOutputJobCount(newOutputJobCount);
    this.setMaterialIDs(newMaterialIDs);
    this.setIncludedJobIDs(newIncludedJobIDs);
    this.setIncludedTypeIDs(newJobTypeIDs);
    this.setLinkedJobIDs(newLinkedJobIDs);
    this.setLinkedOrderIDs(newLinkedOrderIDs);
    this.setLinkedTransIDs(newLinkedTransIDs);
  }
}

export default Group;
