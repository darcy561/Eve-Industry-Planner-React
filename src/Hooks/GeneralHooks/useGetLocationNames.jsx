import { useContext } from "react"
import { EveIDsContext } from "../../Context/EveDataContext"



export function useGetLocationNames() {
    const { eveIDs, updateEveIDs } = useContext(EveIDsContext);

    function getCharacterAssetLocationNames(locationIDs, characterHash) {
    
    
    }
    
    return {
getCharacterAssetLocationNames
    }
}