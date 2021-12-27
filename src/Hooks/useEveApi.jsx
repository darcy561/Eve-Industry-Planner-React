import { useCallback, useContext } from "react";
import skillsReference from "../RawData/bpSkills.json";
import searchData from "../RawData/searchIndex.json";
import { EveIDsContext } from "../Context/EveDataContext";

export function useEveApi() {
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);

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

      return indyJSON;
    } catch (err) {
      console.log(err);
      return [];
    }
  });

  const MarketOrders = useCallback(async (userObj) => {
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
      IDtoName(idRequest);

      return marketJSON;
    } catch (err) {
      console.log(err);
      return [];
    }
  });

  const HistoricMarketOrders = useCallback(async (userObj) => {
    const returnArray = [];
    let idRequest = [];
    let pageCount = 1;
    while (pageCount < 11) {
      try {
        const histPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/history/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        if (histPromise.status == 200) {
          const histJSON = await histPromise.json();
          histJSON.forEach((item) => {
            returnArray.push(item);
          });
          pageCount++;
        } else {
          pageCount = 11;
        }
      } catch (err) {
        return [];
      }
    }

    returnArray.forEach((item) => {
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

    if (idRequest.length != 0) {
      IDtoName(idRequest);
    }
    return returnArray;
  });

  const BlueprintLibrary = useCallback(async (userObj) => {
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
  });

  const WalletTransactions = useCallback(async (userObj) => {
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
  });

  const WalletJournal = useCallback(async (userObj) => {
    let pageCount = 1;
    let returnArray = [];
    while (pageCount < 11) {
      try {
        const journalPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/journal/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        if (journalPromise.status == 200) {
          const journalJSON = await journalPromise.json();
          journalJSON.forEach((item) => {
            returnArray.push(item);
          });
          pageCount++;
        } else {
          pageCount = 11;
        }
      } catch (err) {
        console.log(err);
        return [];
      }
    }

    return returnArray
  });

  const IDtoName = useCallback(async (idArray) => {
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
  });

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
