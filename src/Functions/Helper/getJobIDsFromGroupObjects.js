function retrieveJobIDsFromGroupObjects(inputItem, groupArray) {
  if (!inputItem || !groupArray) {
    console.error(
      "Unable to retrieve job ids from groups with missing inputs."
    );
    return [];
  }

  let inputArray;

  if (typeof inputItem === "string") {
    inputArray = [inputItem];
  } else if (Array.isArray(inputItem)) {
    inputArray = inputItem;
  } else if (inputItem instanceof Set) {
    inputArray = Array.from(inputItem);
  } else {
    console.error("Invalid inputItem type. Expected a string, array, or set.");
    return [];
  }

  const jobIDs = inputArray
    .filter((id) => id.includes("group"))
    .map((id) => {
      const group = groupArray.find((i) => i.groupID === id);
      return group ? [...group.includedJobIDs] : [];
    })
    .flat();

  return [...new Set(jobIDs)];
}

export default retrieveJobIDsFromGroupObjects;
