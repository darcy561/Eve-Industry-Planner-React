import uuid from "react-uuid";

class Setup {
  constructor(setupInstructions) {
    this.id = setupInstructions?.id || uuid();
    this.runCount = setupInstructions?.runCount || 1;
    this.jobCount = setupInstructions?.jobCount || 1;
    this.ME = setupInstructions?.ME || 0;
    this.TE = setupInstructions?.TE || 0;
    this.structureID = setupInstructions?.structureID || 0;
    this.rigID = setupInstructions?.rigID || 0;
    this.systemTypeID = setupInstructions?.systemTypeID || 0;
    this.systemID = setupInstructions?.systemID || 30000142;
    this.taxValue = setupInstructions?.taxValue || 0.25;
    this.estimatedInstallCost = setupInstructions?.estimatedInstallCost || 0;
    this.customStructureID = setupInstructions?.customStructureID || null;
    this.selectedCharacter =
      setupInstructions?.selectedCharacter ||
      setupInstructions?.characterToUse ||
      null;
    this.materialCount = setupInstructions?.materialCount || {};
    this.estimatedTime = setupInstructions?.estimatedTime || 0;
    this.rawTime =
      setupInstructions?.rawTime || setupInstructions?.rawTimeValue || 0;
    this.jobType = setupInstructions.jobType;
  }
  toDocument() {
    return {
      id: this.id,
      runCount: this.runCount,
      jobCount: this.jobCount,
      ME: this.ME,
      TE: this.TE,
      structureID: this.structureID,
      rigID: this.rigID,
      systemTypeID: this.systemTypeID,
      systemID: this.systemID,
      taxValue: this.taxValue,
      estimatedInstallCost: this.estimatedInstallCost,
      customStructureID: this.customStructureID,
      selectedCharacter: this.selectedCharacter,
      materialCount: this.materialCount,
      estimatedTime: this.estimatedTime,
      rawTime: this.rawTime,
      jobType: this.jobType,
    };
  }
  calculateTime(skillsContext, usersContext) {
    //not implementated
    const character =
      usersContext.find((i) => i.CharacterHash === this.selectedCharacter) ||
      usersContext.find((i) => i.ParentUser);
    const characterSkills =
      skillsContext.find((i) => i.user === character.CharacterHash)?.data || {};

    const timeModifier = 2; // add
    const skillModifier = 2; // add

    this.estimatedInstallCost = Math.floor(
      this.rawTime * timeModifier * skillModifier * this.runCount
    );
  }
}
export default Setup;
