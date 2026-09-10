import useUsersStore from "../../../../../../Zustand/usersStore";

export function getMarketPriceForType(typeID, marketSelect, listingSelect) {
  const marketData = useUsersStore
    .getState()
    .worldData.actions.findMarketData(typeID);

  return marketData?.[marketSelect]?.[listingSelect] || 0;
}
