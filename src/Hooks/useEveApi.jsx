import React, { useCallback } from "react"
import indyTestData from "../RawData/industryAPI.json";
import skillsReference from "../RawData/bpSkills.json";

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

          if (x != undefined) {
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
    }, []);

    const IndustryJobs = useCallback(async (userObj) => {
        try {
            const indyPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`);

            const indyJSON = await indyPromise.json();

            return (indyTestData);            
        }
        catch (err) {
            console.log(err);
            return []
        };
    }, []);

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
    }, []);

    const BlueprintLibrary = useCallback(async (userObj) => {
        try {
            const blueprintPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&token=${userObj.aToken}`)

            const blueprintJSON = await blueprintPromise.json();
            
            return (blueprintJSON)
            
        } catch (err) {
            console.log(err)
            return [];            
        }
    })


    return { BlueprintLibrary, CharacterSkills, IndustryJobs, MarketOrders}
};