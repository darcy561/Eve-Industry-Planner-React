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
  const CORPORATION_OFFICE_ENTITY_NAME = "OfficeFolder";

  function findCorpLocationAssets(requestedLocationID) {
    const blueprintTypeIDsSet = findBlueprintTypeIDs();

    for (let corporationData of esiCorpData) {
      const corporationAssets = JSON.parse(
        sessionStorage.getItem(`corpAssets_${corporationData.corporation_id}`)
      );

      let filteredAssets = corporationAssets.filter(
        (i) =>
          !blueprintTypeIDsSet.has(i.type_id) &&
          i.location_id === requestedLocationID
      );

      const corporationOfficeObject = filteredAssets.find(
        (i) => i.location_flag === CORPORATION_OFFICE_ENTITY_NAME
      );

      if (corporationOfficeObject) {
        const corporationOfficeAssets = corporationAssets.filter(
          (i) => !blueprintTypeIDsSet.has(i.type_id) && i.location_id === corporationOfficeObject.item_id
        );
        filteredAssets = [...filteredAssets, ...corporationOfficeAssets].filter(
          (i) => i.location_flag !== CORPORATION_OFFICE_ENTITY_NAME
        );
      }

      const acceptedLocationItems = filteredAssets.filter((i) =>
        acceptedDirectLocationTypes.has(i.location_type)
      );
      const acceptedExtendedLocationItems = filteredAssets.filter((i) =>
        acceptedExtendedLocationTypes.has(i.location_type)
      );

      console.log(requestedLocationID);
      console.log(corporationAssets);
      console.log(corporationOfficeObject);

      console.log(filteredAssets);
      console.log(acceptedLocationItems);
      console.log(acceptedExtendedLocationItems);
    }
  }

  return {
    findCorpLocationAssets,
  };
}
