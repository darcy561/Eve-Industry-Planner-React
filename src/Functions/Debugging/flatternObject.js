function flattenObject(obj, parentKey = "", result = {}) {
  for (const key in obj) {
    // Create a new key name
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    // If the value is an object and not null, recurse
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenObject(obj[key], newKey, result);
    } else {
      // Convert arrays to string and keep other primitive values
      result[newKey] = Array.isArray(obj[key])
        ? JSON.stringify(obj[key])
        : obj[key];
    }
  }
  return result;
}

export default flattenObject
