function BuildMissingSystemIndexValue(systemID) {
  return {
    copying: 0,
    invention: 0,
    lastUpdated: Date.now(),
    manufacturing: 0,
    reaction: 0,
    researching_material_efficiency: 0,
    researching_time_efficiency: 0,
    solar_system_id: Number(systemID),
  };
}
module.exports = {
  BuildMissingSystemIndexValue: BuildMissingSystemIndexValue,
};
