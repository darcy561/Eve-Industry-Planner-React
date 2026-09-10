import VirtualisedLocationSearch from "../../../Styled Components/autocomplete/virtualisedLocationSearch";

/**
 * Default asset location picker, searchable rather than scrolled: an account that has been played
 * for a while holds things in hundreds of places.
 */
export function FirstLoginAssetLocationSelect({
  value,
  locations,
  onChange,
  isLoading = false,
  isError = false,
  labelText = "Default Asset Location",
}) {
  return (
    <VirtualisedLocationSearch
      places={locations}
      value={value}
      onChange={(locationId) => {
        if (!locationId) return;
        onChange(locationId);
      }}
      isLoading={isLoading}
      isError={isError}
      label={labelText}
    />
  );
}
