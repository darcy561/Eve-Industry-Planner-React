export function useAssetHelperHooks() {
  const formatLocation = (locationFlag) => {
    switch (locationFlag) {
      case "Hangar":
        return "Hangar";
      case "Unlocked":
      case "Autofit":
        return "Container";
      default:
        return "Other";
    }
  };

  return {
    formatLocation,
  };
}
