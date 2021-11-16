import React, { useCallback } from "react"

export function useEveApi() {
    
    const CharacterSkills = useCallback(async (userObj) => {
        try {
            const skillsPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/skills/?datasource=tranquility&token=${userObj.aToken}`);
    
            const skillsJSON = await skillsPromise.json();
    
            return (skillsJSON.skills);
        }
        catch (err) {
            console.log(err)        
        };        
    }, []);

    const IndustryJobs = useCallback(async (userObj) => {
        try {
            const indyPromise = await fetch(`https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`);

            const indyJSON = await indyPromise.json();

            return (indyJSON);            
        }
        catch (err) {
            console.log(err);
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
        }
    }, []);


    return { CharacterSkills, IndustryJobs, MarketOrders}
};