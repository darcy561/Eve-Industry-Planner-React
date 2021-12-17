import { useCallback } from "react"
import skillsReference from "../RawData/bpSkills.json";
import searchData from "../RawData/searchIndex.json";

export function useEveApi() {
    
    const CharacterSkills = useCallback(async (userObj) => {
      try {
        const skillsPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/skills/?datasource=tranquility&token=${userObj.aToken}`
        );
        const skillsJSON = await skillsPromise.json();

        const newSkillArray = [];
        skillsReference.forEach((ref) => {
          const x = skillsJSON.skills.find((s) => ref.id === s.skill_id);
          const y = {
            id: ref.id,
            name: ref.name,
            activeLevel: null,
          };

          if (x !== undefined) {
            y.activeLevel = x.active_skill_level;
          } else {
            y.activeLevel = 0;
          }
          newSkillArray.push(y);
        });

        return newSkillArray;
      } catch (err) {
        console.log(err);
        return [];
      }
    });

    const IndustryJobs = useCallback(async (userObj) => {
        try {
            const indyPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`);

            const indyJSON = await indyPromise.json();
          // const indyJSON = indyTestData;
          
          indyJSON.forEach((job) => {
            const nameMatch = searchData.find((item) => item.itemID === job.product_type_id);
            if (nameMatch !== undefined) {
              job.product_name = nameMatch.name ;  
            } else {
              job.product_name = null
            }
            if (userObj.linkedJobs.includes(job.job_id)) {
              job.linked = true
            } else {
              job.linked = false
            }
          });
          
          return indyJSON

        }
        catch (err) {
            console.log(err);
            return []
        };
    });

    const MarketOrders = useCallback(async (userObj) => {
        try {
            const marketPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/?datasource=tranquility&token=${userObj.aToken}`);

            const marketJSON = await marketPromise.json();

            return (marketJSON);
        }
        catch (err) {
            console.log(err)
            return []
        }
    });

  const BlueprintLibrary = useCallback(async (userObj) => {
    try {
      const blueprintPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&token=${userObj.aToken}`)

      const blueprintJSON = await blueprintPromise.json();
            
      return (blueprintJSON)
            
    } catch (err) {
      console.log(err)
      return [];
    }
  });

  const WalletTransactions = useCallback(async (userObj) => {
    try {
      const transactionsPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/transactions/?datasource=tranquility&token=${userObj.aToken}`)

      const transactionsJSON = await transactionsPromise.json();
      
      return(transactionsJSON)

    } catch (err) {
      console.log(err)
      return [];
    }
  });

  const WalletJournal = useCallback(async (userObj) => {
    try {

      const journalPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/journal/?datasource=tranquility&page=1&token=${userObj.aToken}`)

      const journalJSON = await journalPromise.json();

      return(journalJSON)

    } catch (err) {
      console.log(err)
      return [];
    }
  });

    return { BlueprintLibrary, CharacterSkills, IndustryJobs, MarketOrders, WalletTransactions, WalletJournal }
};