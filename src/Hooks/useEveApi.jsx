import { useContext } from "react";
import skillsReference from "../RawData/bpSkills.json";
import { EveESIStatusContext } from "../Context/EveDataContext";

export function useEveApi() {
  const { eveESIStatus, updateEveESIStatus } = useContext(EveESIStatusContext);

  const fetchCharacterSkills = async (userObj) => {
    try {
      const response = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/skills/?datasource=tranquility&token=${userObj.aToken}`
      );
      const skills = await response.json();

      const mappedSkills = skillsReference.map((ref) => {
        const { active_skill_level = 0 } =
          skills.skills.find((s) => s.skill_id === ref.id) || {};
        return { id: ref.id, activeLevel: active_skill_level };
      });

      return mappedSkills;
    } catch (err) {
      console.error(`Error fetching character skills: ${err}`);
      return [];
    }
  };

  const fetchCharacterIndustryJobs = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`
      );

      let data = await request.json();

      if (request.status !== 200) {
        return [];
      }
      data = data.filter(
        (job) =>
          job.completed_date === undefined ||
          new Date() - Date.parse(job.completed_date) <= 1209600000
        // 14 days
      );

      return data.map((a) => ({ ...a, isCorp: false }));
    } catch (err) {
      console.error(`Error fetching character industry jobs: ${err}`);
      return [];
    }
  };

  const fetchCharacterMarketOrders = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/?datasource=tranquility&token=${userObj.aToken}`
      );

      let data = await request.json();

      if (request.status !== 200) {
        return [];
      }
      data = data.filter((item) => !item.is_buy_order);

      return data.map((a) => ({ ...a, CharacterHash: userObj.CharacterHash }));
    } catch (err) {
      console.error(`Error fetching character orders: ${err}`);
      return [];
    }
  };

  const fetchCharacterHistMarketOrders = async (userObj) => {
    let orders = [];
    let maxPages = 50;
    let maxEntries = 2500;
    let currentDate = Date.now();

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/history/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();
        if (request.status !== 200) break;

        orders.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching character historic orders: ${err}`);
        return [];
      }
    }
    //14 Days
    orders = orders.filter(
      (item) =>
        !item.is_buy_order 
        // currentDate - Date.parse(item.issued) <= 1209600000
    );

    return orders.map((a) => ({ ...a, CharacterHash: userObj.CharacterHash }));
  };

  const fetchCharacterBlueprints = async (userObj) => {
    let blueprints = [];
    let maxPages = 50;
    let maxEntries = 1000;

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        const data = await request.json();
        if (request.status !== 200) break;

        blueprints.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching character blueprints: ${err}`);
        return [];
      }
    }
    return blueprints;
  };

  const fetchCharacterTransactions = async (userObj) => {
    let transactions = [];
    let maxPages = 20;
    let maxEntries = 2500;
    let currentDate = new Date();

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/transactions/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();
        if (request.status !== 200) break;

        transactions.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching character transactions: ${err}`);
        return [];
      }
    }

    //14 Days
    return transactions.filter(
      (i) =>
        i.is_buy === false && currentDate - Date.parse(i.date) <= 1209600000
    );
  };

  const fetchCharacterJournal = async (userObj) => {
    let journal = [];
    let maxPages = 20;
    let maxEntries = 2500;
    let currentDate = new Date();

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/journal/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        let data = await request.json();
        if (request.status !== 200) break;

        journal.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching character journal: ${err}`);
        return [];
      }
    }

    // 14 Days
    return journal.filter(
      (item) => currentDate - Date.parse(item.date) <= 1209600000
    );
  };

  const IDtoName = async (idArray, userObj) => {
    let citadelIDs = idArray.filter((i) => i.toString().length > 10);

    let standardIDs = idArray.filter((i) => i.toString().length < 10);
    let newArray = [];
    if (standardIDs.length > 0) {
      const idPromise = await fetch(
        `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
        {
          method: "POST",
          body: JSON.stringify(standardIDs),
        }
      );
      if (idPromise.status === 200) {
        const idJSON = await idPromise.json();
        newArray = newArray.concat(idJSON);
      }
    }
    if (citadelIDs.length > 0) {
      for (let id of citadelIDs) {
        const idPromise = await fetch(
          `https://esi.evetech.net/latest/universe/structures/${id}/?datasource=tranquility&token=${userObj.aToken}`
        );
        if (idPromise.status === 200) {
          const idJSON = await idPromise.json();

          idJSON.id = id;
          newArray.push(idJSON);
        } else if (idPromise.status === 403) {
          newArray.push({ id: id, name: "No Access To Location" });
        } else {
          break;
        }
      }
    }
    return newArray;
  };

  const serverStatus = async () => {
    try {
      const statusPromise = await fetch(
        "https://esi.evetech.net/latest/status/?datasource=tranquility"
      );

      const statusJSON = await statusPromise.json();
      if (statusPromise.status === 200 || statusPromise.status === 304) {
        let newAttempt = [...eveESIStatus.serverStatus.attempts];
        if (newAttempt.length <= 5) {
          newAttempt.push(1);
        } else {
          newAttempt.shift();
          newAttempt.push(1);
        }
        updateEveESIStatus((prev) => ({
          ...prev,
          serverStatus: {
            online: true,
            playerCount: statusJSON.players,
            attempts: newAttempt,
          },
        }));
        return true;
      } else {
        let newAttempt = [...eveESIStatus.serverStatus.attempts];
        if (newAttempt.length <= 5) {
          newAttempt.push(0);
        } else {
          newAttempt.shift();
          newAttempt.push(0);
        }
        updateEveESIStatus((prev) => ({
          ...prev,
          serverStatus: {
            online: false,
            playerCount: 0,
            attempts: newAttempt,
          },
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCharacterAssets = async (userObj) => {
    let assets = [];
    let maxPages = 20;
    let maxEntries = 1000;

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/assets/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();

        if (request.status !== 200) break;

        assets.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching character assets: ${err}`);
        return [];
      }
    }

    return assets.map((a) => ({ ...a, CharacterHash: userObj.CharacterHash }));
  };

  const fetchCharacterStandings = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/standings/?datasource=tranquility&token=${userObj.aToken}`
      );
      const data = await request.json();

      if (request.status !== 200) return [];

      return data;
    } catch (err) {
      console.error(`Error fetching character standings: ${err}`);
      return [];
    }
  };

  const stationData = async (stationID) => {
    try {
      const stationDataPromise = await fetch(
        `https://esi.evetech.net/latest/universe/stations/${stationID}`
      );

      const stationDataJson = await stationDataPromise.json();

      if (stationDataPromise.status === 200) {
        return stationDataJson;
      }
    } catch (err) {
      return null;
    }
  };

  const fetchCharacterData = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/legacy/characters/${userObj.CharacterID}/?datasource=tranquility`
      );
      const data = await request.json();

      if (request.status === 200) {
        return data;
      }
    } catch (err) {
      console.error(`Error fetching character data: ${err}`);
      return {};
    }
  };

  const fetchCorpIndustryJobs = async (userObj) => {
    let indyJobs = [];
    let maxPages = 1;
    let maxEntries = 1000;

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/industry/jobs/?include_completed=true&page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();
        if (request.status !== 200) break;

        indyJobs.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching corporation industry job data: ${err}`);
        return [];
      }
    }

    indyJobs = indyJobs.filter(
      (job) =>
        job.completed_date === undefined ||
        new Date() - Date.parse(job.completed_date) <= 1209600000
      // 14 days
    );

    indyJobs = indyJobs.filter(
      (job) => job.installer_id === userObj.CharacterID
    );

    return indyJobs.map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpMarketOrdersJobs = async (userObj) => {
    let orders = [];
    let maxPages = 1;
    let maxEntries = 1000;

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/orders?page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();
        if (request.promise !== 200) break;

        orders.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching corporation market order data: ${err}`);
        return [];
      }
    }
    orders = orders.filter(
      (item) => !item.is_buy_order && item.issued_by === userObj.CharacterID
    );

    return orders.map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpHistMarketOrders = async (userObj) => {
    let orders = [];
    let maxPages = 10;
    let maxEntries = 1000;
    let currentDate = Date.now();

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/orders/history?page=${pageCount}&token=${userObj.aToken}`
        );
        const data = await request.json();
        if (request.status !== 200) break;

        orders.push(...data);

        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(
          `Error fetching corporation historic market order data: ${err}`
        );
        break;
      }
    }
    //14 Days
    orders = orders.filter(
      (item) =>
        !item.is_buy_order &&
        item.issued_by === userObj.CharacterID &&
        currentDate - Date.parse(item.issued) <= 1209600000
    );

    return orders.map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpBlueprintLibrary = async (userObj) => {
    let blueprints = [];
    let maxPages = 50;
    let maxEntries = 1000;

    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/blueprints?page=${pageCount}&token=${userObj.aToken}`
        );

        const data = await request.json();

        if (request.status !== 200) break;

        blueprints.push(...data);
        if (data.length < maxEntries) break;
      } catch (err) {
        console.error(`Error fetching corporation blueprint data: ${err}`);
        break;
      }
    }

    return blueprints.map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpDivisions = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/divisions?token=${userObj.aToken}`
      );
      let data = await request.json();
      if (request.status === 403) return null;

      data.corporation_id = userObj.corporation_id;
      console.log(data);
      return data;
    } catch (err) {}
  };

  const fetchCorpJournal = async (userObj) => {
    let journal = [];
    let maxDivisions = 7;
    let maxPages = 50;
    let maxEntries = 2500;
    let currentDate = Date.now();
    let refTypes = new Set([
      "market_escrow",
      "market_transaction",
      "transaction_tax",
    ]);

    try {
      divisions: for (let division = 1; division <= maxDivisions; division++) {
        let divisionArray = [];
        pages: for (let page = 1; page <= maxPages; page++) {
          const request = await fetch(
            `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/wallets/${division}/journal?page=${page}&token=${userObj.aToken}`
          );
          const data = await request.json();

          if (!request.ok) break divisions;

          divisionArray.push(...data);

          if (data.length < maxEntries) break;
        }
        //14 Days
        divisionArray = divisionArray.filter(
          (item) =>
            currentDate - Date.parse(item.date) <= 1209600000 &&
            refTypes.has(item.ref_type)
        );
        journal.push({
          division,
          data: divisionArray,
        });
      }
      return journal;
    } catch (err) {
      console.error(`Error fetching corporation journal: ${err}`);
      return [];
    }
  };

  const fetchCorpTransactions = async (userObj) => {
    let transactions = [];
    let maxDivisions = 7;
    let maxPages = 50;
    let maxEntries = 2500;
    let currentDate = Date.now();

    try {
      divisions: for (let division = 1; division <= maxDivisions; division++) {
        let divisionArray = [];
        pages: for (let page = 1; page <= maxPages; page++) {
          const request = await fetch(
            `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/wallets/${division}/transactions?page=${page}&token=${userObj.aToken}`
          );
          const data = await request.json();

          if (!request.ok) break divisions;

          divisionArray.push(...data);

          if (data.length < maxEntries) break;
        }
        //14 Days
        divisionArray = divisionArray.filter(
          (item) =>
            currentDate - Date.parse(item.date) <= 1209600000 && !item.is_buy
        );
        transactions.push({
          division,
          data: divisionArray,
        });
      }
      return transactions;
    } catch (err) {
      console.error(`Error fetching corporation transactions: ${err}`);
      return [];
    }
  };

  return {
    fetchCharacterBlueprints,
    fetchCharacterData,
    fetchCharacterSkills,
    fetchCharacterAssets,
    fetchCharacterHistMarketOrders,
    fetchCharacterStandings,
    fetchCharacterIndustryJobs,
    fetchCharacterMarketOrders,
    fetchCharacterTransactions,
    fetchCharacterJournal,
    IDtoName,
    serverStatus,
    stationData,
    fetchCorpDivisions,
    fetchCorpIndustryJobs,
    fetchCorpJournal,
    fetchCorpTransactions,
    fetchCorpMarketOrdersJobs,
    fetchCorpHistMarketOrders,
    fetchCorpBlueprintLibrary,
  };
}
