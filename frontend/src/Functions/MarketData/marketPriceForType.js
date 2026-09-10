import useUsersStore from "../../Zustand/usersStore";

/**
 * One material's price at a hub, on one of the four bases the server publishes.
 *
 * @param {number} typeID
 * @param {string} marketSelect - A MARKET_OPTIONS id
 * @param {string} listingSelect - buy, sell, buyP95 or sellP05
 * @returns {number} 0 where the hub holds no figure for the type
 */
export function getMarketPriceForType(typeID, marketSelect, listingSelect) {
  const marketData = useUsersStore
    .getState()
    .worldData.actions.findMarketData(typeID);

  return marketData?.[marketSelect]?.[listingSelect] || 0;
}
