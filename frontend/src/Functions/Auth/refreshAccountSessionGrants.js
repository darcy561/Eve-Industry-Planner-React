import useUserStore from "../../Zustand/usersStore";
import updateCorporationClaims from "../Endpoints/Private/corporationClaims";
import { getEsiAccessToken } from "./esiCredentials/provider.js";

/**
 * Submits current character ESI access tokens so the backend can refresh
 * account session grants (corporations/alliances).
 *
 * @returns {Promise<void>}
 */
async function refreshAccountSessionGrants() {
  try {
    const state = useUserStore.getState();
    if (state?.applicationSettings?.userCloudAccounts) {
      // Cloud accounts submit claims-refresh tokens server-side during login/refresh.
      return;
    }

    const characters = state.account.characters.filter(
      (character) => character?.CharacterHash && !character.isPlaceholder
    );
    const acquired = await Promise.allSettled(
      characters.map((character) => getEsiAccessToken(character.CharacterHash))
    );
    const esiTokens = acquired
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.accessToken);
    if (esiTokens.length === 0) return;
    await updateCorporationClaims(esiTokens);
  } catch (error) {
    console.error("Error checking user claims:", error);
  }
}

export default refreshAccountSessionGrants;
