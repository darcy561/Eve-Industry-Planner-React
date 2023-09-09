import { useContext, useMemo } from "react";
import { UsersContext } from "../../Context/AuthContext";
import {
  CorpEsiDataContext,
  EveIDsContext,
} from "../../Context/EveDataContext";
import { useEveApi } from "../useEveApi";
import { useAssetHelperHooks } from "./useAssetHelper";
import searchData from "../../RawData/searchIndex.json";

export function useAssetManagement() {
  const { users } = useContext(UsersContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { esiCorpData } = useContext(CorpEsiDataContext);
  const { IDtoName } = useEveApi();
  const {
    acceptedDirectLocationTypes,
    acceptedExtendedLocationTypes,
    acceptedLocationFlags,
    findBlueprintTypeIDs,
    retrieveAssetLocation,
  } = useAssetHelperHooks();

  const parentUser = useMemo(() => users.find((i) => i.parentUser), [users]);

  function findCorpLocationAssets(requestedLocationID) {
    const blueprintTypeIDsSet = findBlueprintTypeIDs();



    for (let corporationData of esiCorpData) {
      const corporationAssets = JSON.parse(
        sessionStorage.getItem(`corpAssets_${corporationData.corporation_id}`)
      );
      const filteredAssets = corporationAssets.filter(
        (i) => !blueprintTypeIDsSet.has(i.type_id) && i.location_id === requestedLocationID
      );
        const acceptedLocationItems = filteredAssets.filter((i) => acceptedDirectLocationTypes.has(i.location_type) );
        const acceptedExtendedLocationItems = filteredAssets.filter((i) => acceptedExtendedLocationTypes.has(i.location_type));

        console.log(filteredAssets);
        console.log(acceptedLocationItems)
        console.log(acceptedExtendedLocationItems)
    }
  }

  return {
    findCorpLocationAssets,
  };
}
