import fetchWithCustomHeaders from "../fetchWithCustomHeaders";

/**
 * The playable races and the faction each belongs to.
 *
 * ESI names the faction field `alliance_id`; it holds a faction id, not an
 * alliance's.
 *
 * @returns {Promise<Array<{race_id: number, alliance_id: number, name: string}>>}
 */
export default async function getRaces() {
  const response = await fetchWithCustomHeaders(
    "https://esi.evetech.net/universe/races/?datasource=tranquility",
  );

  if (!response.ok) {
    throw new Error(
      `Race lookup failed with status ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}
