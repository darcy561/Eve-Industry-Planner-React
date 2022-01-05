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
  };

  const IndustryJobs = async (userObj) => {
    try {
      const indyPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`
      );

      const indyJSON = await indyPromise.json();
      // const indyJSON = indyTestData;

    indyJSON.forEach((job) => {
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
    });
      
    let filtered = indyJSON.filter((job) => 
      job.completed_date === undefined || new Date() - Date.parse(job.completed_date) < 1209600000
      );
      
    let idRequest = [];
      
    filtered.forEach((item) => {
      if (
        !eveIDs.includes(item.blueprint_location_id) &&
        !idRequest.includes(item.blueprint_location_id)
      ) {
        idRequest.push(item.blueprint_location_id);
      }
      if (
        !eveIDs.includes(item.station_id) &&
        !idRequest.includes(item.station_id)
      ) {
        idRequest.push(item.station_id);
      }
      if (
        !eveIDs.includes(item.facility_id) &&
        !idRequest.includes(item.facility_id)
      ) {
        idRequest.push(item.facility_id);
      }
    });
      if (idRequest.length !== 0) {
        IDtoName(idRequest);
      }

      return filtered;
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const MarketOrders = async (userObj) => {
    try {
      const marketPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/?datasource=tranquility&token=${userObj.aToken}`
      );

      const marketJSON = await marketPromise.json();

      let idRequest = [];

      marketJSON.forEach((item) => {
        if (
          !eveIDs.includes(item.location_id) &&
          !idRequest.includes(item.location_id)
        ) {
          idRequest.push(item.location_id);
        }
        if (
          !eveIDs.includes(item.region_id) &&
          !idRequest.includes(item.region_id)
        ) {
          idRequest.push(item.region_id);
        }
      });
      if (idRequest.length !== 0) {
        IDtoName(idRequest);
      }

      return marketJSON;
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
        histJSON.forEach((item) => {
          returnArray.push(item);
        });

        if (histJSON.length < 2501) {
          pageCount = 11;
        } else {
          pageCount++;
        }
      } catch (err) {
        return [];
      }
    }
    let filtered = returnArray.filter((item) =>
      !item.is_buy_order)

    filtered.forEach((item) => {
      if (
        !eveIDs.includes(item.location_id) &&
        !idRequest.includes(item.location_id)
      ) {
        idRequest.push(item.location_id);
      }
      if (
        !eveIDs.includes(item.region_id) &&
        !idRequest.includes(item.region_id)
      ) {
        idRequest.push(item.region_id);
      }
    });

    if (idRequest.length !== 0) {
      IDtoName(idRequest);
    }
    return filtered;
  };

  const BlueprintLibrary = async (userObj) => {
    try {
      const blueprintPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&token=${userObj.aToken}`
      );

      const blueprintJSON = await blueprintPromise.json();

      return blueprintJSON;
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

      return transactionsJSON;
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
        journalJSON.forEach((item) => {
          returnArray.push(item);
        });

        if (journalJSON.length < 2501) {
          pageCount = 11;
        } else {
          pageCount++;
        }
      } catch (err) {
        console.log(err);
        return [];
      }
    }

    return returnArray;
  };

  const IDtoName = async (idArray) => {
    try {
      const idPromise = await fetch(
        `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
        {
          method: "POST",
          body: JSON.stringify(idArray),
        }
      );

      const idJSON = await idPromise.json();

      const newArray = eveIDs;
      idJSON.forEach((item) => {
        newArray.push(item);
      });
      updateEveIDs(newArray);
    } catch (err) {
      console.log(err);
    }
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
