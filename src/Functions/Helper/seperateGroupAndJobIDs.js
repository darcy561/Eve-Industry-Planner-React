function seperateGroupAndJobIDs(inputItems) {
  if (typeof inputItems === "string") {
    inputItems = [inputItems];
  }

  if (!Array.isArray(inputItems) && !(inputItems instanceof Set)) {
    console.error("Invalid input: expected an array, a set, or a string.");
    return { groupIDs: [], jobIDs: [] };
  }

  const inputArray =
    inputItems instanceof Set ? Array.from(inputItems) : inputItems;

  const { groupIDs, jobIDs } = inputArray.reduce(
    (acc, id) => {
      if (typeof id === "string") {
        if (id.includes("group")) {
          acc.groupIDs.add(id);
        } else if (id.includes("job")) {
          acc.jobIDs.add(id);
        }
      }
      return acc;
    },
    { groupIDs: new Set(), jobIDs: new Set() }
  );

  return {
    groupIDs: [...groupIDs],
    jobIDs: [...jobIDs],
  };
}

export default seperateGroupAndJobIDs;
