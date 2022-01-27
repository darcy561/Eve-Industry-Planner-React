import { useContext } from "react";
import skillsReference from "../RawData/bpSkills.json";
import searchData from "../RawData/searchIndex.json";
import { EveIDsContext } from "../Context/EveDataContext";

export function useEveApi() {
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);

  const CharacterSkills = async (userObj) => {
    try {
      const skillsPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/skills/?datasource=tranquility&token=${userObj.aToken}`
      );
      const skillsJSON = await skillsPromise.json();

      const newSkillArray = [];
      if (skillsPromise.status === 200) {
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
      } else return []
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const IndustryJobs = async (userObj) => {
    try {
      const indyPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`
      );

      const indyJSON = await indyPromise.json();

      if (indyPromise.status === 200) {
        indyJSON.forEach((job) => {
          
          if (job.activity_id === 1) {
            const nameMatch = searchData.find(
              (item) => item.itemID === job.product_type_id
            );
            if (nameMatch !== undefined) {
              job.product_name = nameMatch.name;
            } else {
              job.product_name = null;
            }
            if (userObj.linkedJobs.includes(job.job_id)) {
              job.linked = true;
            } else {
              job.linked = false;
            }
          }
        });

        let filterOld = indyJSON.filter(
          (job) =>
            job.completed_date === undefined ||
            new Date() - Date.parse(job.completed_date) < 1209600000
          // 10 days
        );

        let filtered = filterOld.filter((job) => job.activity_id === 1 || job.activity_id === 4 || job.activity_id === 3 );

        let idRequest = [];

        filtered.forEach((item) => {
          
          if (
            !eveIDs.some((i)=>i.facility_id === item.facility_id) &&
            !idRequest.includes(item.facility_id)
          ) {
            idRequest.push(item.facility_id);
          }
        });
        if (idRequest.length !== 0) {
          const idNames = await IDtoName(idRequest, userObj);

          filtered.forEach((job) => {
            const facilityItem = idNames.find((i) => i.id === job.facility_id);
            job.facility_name = facilityItem.name;
          });
        }
        
        return filtered;
        
      } else return []
    } catch (err) {
      console.log(err);
    }
  };

  const MarketOrders = async (userObj) => {
    try {
      const marketPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/?datasource=tranquility&token=${userObj.aToken}`
      );

      const marketJSON = await marketPromise.json();

      let idRequest = [];
      if (marketPromise.status === 200) {
        marketJSON.forEach((item) => {
          if (
            !eveIDs.some((i)=>i.location_id === item.location_id) &&
            !idRequest.includes(item.location_id)
          ) {
            
            idRequest.push(item.location_id);
          }
          if (
            !eveIDs.some((i)=>i.region_id === item.region_id) &&
            !idRequest.includes(item.region_id)
          ) {
            idRequest.push(item.region_id);
          }
          item.CharacterHash = userObj.CharacterHash;
        });

        if (idRequest.length !== 0) {
          await IDtoName(idRequest, userObj);
        }

        let filtered = marketJSON.filter((item) => !item.is_buy_order);

        filtered.forEach((item) => {
          const nameMatch = searchData.find((i) => i.itemID === item.type_id);
          item.item_name = nameMatch.name;
        });
        return filtered;
      }
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const HistoricMarketOrders = async (userObj) => {
    const returnArray = [];
    let idRequest = [];
    let pageCount = 1;
    while (pageCount < 11) {
      try {
        const histPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/history/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );
        const histJSON = await histPromise.json();
        if (histPromise.status === 200) {
          histJSON.forEach((item) => {
            returnArray.push(item);
          });

          if (histJSON.length < 2501) {
            pageCount = 11;
          } else {
            pageCount++;
          }
        }
      } catch (err) {
        return [];
      }
    }
    let filtered = returnArray.filter((item) => !item.is_buy_order);

    filtered.forEach((item) => {
      if (
        !eveIDs.some((i)=>i.location_id === item.location_id) &&
        !idRequest.includes(item.location_id)
      ) {
        idRequest.push(item.location_id);
      }
      if (
        !eveIDs.some((i)=>i.region_id === item.region_id) &&
        !idRequest.includes(item.region_id)
      ) {
        idRequest.push(item.region_id);
      }

      const nameMatch = searchData.find((i) => i.itemID === item.type_id);
      if (nameMatch !== undefined) {
        item.item_name = nameMatch.name;
      } else {
        item.item_name = null;
      }
      item.CharacterHash = userObj.CharacterHash;
    });

    if (idRequest.length !== 0) {
      await IDtoName(idRequest, userObj);
    }
    return filtered;
  };

  const BlueprintLibrary = async (userObj) => {
    try {
      const blueprintPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&token=${userObj.aToken}`
      );

      const blueprintJSON = await blueprintPromise.json();
      if (blueprintPromise.status === 200) {
        return blueprintJSON;
      } else return []
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const WalletTransactions = async (userObj) => {
    try {
      const transactionsPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/transactions/?datasource=tranquility&token=${userObj.aToken}`
      );

      const transactionsJSON = await transactionsPromise.json();
      if (transactionsPromise.status === 200) {
        const filtered = transactionsJSON.filter((i)=> i.is_buy === false)
        return filtered;
      } else return []
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const WalletJournal = async (userObj) => {
    let pageCount = 1;
    let returnArray = [];
    while (pageCount < 11) {
      try {
        const journalPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/journal/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        const journalJSON = await journalPromise.json();
        if (journalPromise.status === 200) {
          journalJSON.forEach((item) => {
            returnArray.push(item);
          });

          if (journalJSON.length < 2501) {
            pageCount = 11;
          } else {
            pageCount++;
          }
        }
      } catch (err) {
        console.log(err);
        return [];
      }
    }

    return returnArray;
  };

  const IDtoName = async (idArray, userObj) => {
    let citadelIDs = idArray.filter((i) => i.toString().length > 10);

    let standardIDs = idArray.filter((i) => i.toString().length < 10);
    const newArray = [];
    if (standardIDs.length > 0) {
      try {
        const idPromise = await fetch(
          `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
          {
            method: "POST",
            body: JSON.stringify(standardIDs),
          }
        );

        const idJSON = await idPromise.json();

        if (idPromise.status === 200) {
          idJSON.forEach((item) => {
            newArray.push(item);
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
    if (citadelIDs.length > 0) {
      for (let id of citadelIDs) {
        try {
          const idPromise = await fetch(
            `https://esi.evetech.net/latest/universe/structures/${id}/?datasource=tranquility&token=${userObj.aToken}`
          );

          const idJSON = await idPromise.json();

          if (idPromise.status === 200) {
            idJSON.id = id;
            newArray.push(idJSON);
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
    updateEveIDs((prev) => prev.concat(newArray));
    return newArray;
  };
  return {
    BlueprintLibrary,
    CharacterSkills,
    HistoricMarketOrders,
    IDtoName,
    IndustryJobs,
    MarketOrders,
    WalletTransactions,
    WalletJournal,
  };
}
