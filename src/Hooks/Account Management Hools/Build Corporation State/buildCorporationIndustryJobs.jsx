export function buildCorporationIndustyJobs_AccountManagement(corporationMap) {
  const returnMap = new Map();

  corporationMap.forEach((userObjectsArray, corporation_id) => {
    const includedCorporationJobs = {};
    userObjectsArray.forEach(({ esiCorpJobs }) => {
      esiCorpJobs.forEach((corpJob) => {
        includedCorporationJobs[corpJob.job_id] = corpJob;
      });
    });
    returnMap.set(corporation_id, includedCorporationJobs);
  });

  return returnMap;
}
