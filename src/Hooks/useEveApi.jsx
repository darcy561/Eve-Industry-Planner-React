import { useContext } from "react";
import skillsReference from "../RawData/bpSkills.json";
import { EveESIStatusContext } from "../Context/EveDataContext";
import GLOBAL_CONFIG from "../global-config-app";
import { STATIONID_RANGE } from "../Context/defaultValues";

export function useEveApi() {
  const { eveESIStatus, updateEveESIStatus } = useContext(EveESIStatusContext);
  const { ESI_DATE_PERIOD, ESI_MAX_PAGES } = GLOBAL_CONFIG;

  async function fetchAllPages(url) {
    const { data: firstPage, totalPages } = await fetchData(url, 1);
    const promises = [];
    for (let i = 2; i <= totalPages; i++) {
      promises.push(fetchData(url, i));
    }
    const responses = await Promise.all(promises);

    return [
      firstPage,
      ...responses.filter((result) => result.data).map((i) => i.data),
    ].flat();
  }

  async function fetchData(url, pageNumber) {
    const response = await fetch(`${url}&page=${pageNumber}`);

    if (!response.ok) {
      return {
        totalPages: pageNumber,
        data: [],
      };
    }

    return {
      totalPages: response.headers.get("X-Pages"),
      data: await response.json(),
    };
  }

  const fetchCharacterSkills = async (userObj) => {
    try {
      const skillsMap = {};
      const response = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/skills/?datasource=tranquility&token=${userObj.aToken}`
      );

      if (!response.ok) return skillsMap;

      const responseData = await response.json();

      Object.values(skillsReference).forEach((ref) => {
        const skill = responseData.skills.find((s) => s.skill_id === ref.id);

        if (skill) {
          const { active_skill_level = 0, trained_skill_level = 0 } = skill;
          skillsMap[ref.id] = {
            id: ref.id,
            activeLevel: active_skill_level,
            trainedLevel: trained_skill_level,
          };
        } else {
          skillsMap[ref.id] = {
            id: ref.id,
            activeLevel: 0,
            trainedLevel: 0,
          };
        }
      });

      return skillsMap;
    } catch (err) {
      console.error(`Error fetching character skills: ${err}`);
      return {};
    }
  };

  const fetchCharacterIndustryJobs = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`
      );

      if (!request.ok) return [];

      const data = await request.json();

      return data
        .filter(
          (job) =>
            !job.completed_date ||
            new Date() - Date.parse(job.completed_date) <=
              ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
        )
        .map((a) => ({ ...a, isCorp: false }));
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

      if (!request.ok) return [];

      const data = await request.json();

      return data
        .filter((item) => !item.is_buy_order)
        .map((a) => ({ ...a, CharacterHash: userObj.CharacterHash }));
    } catch (err) {
      console.error(`Error fetching character orders: ${err}`);
      return [];
    }
  };

  const fetchCharacterHistMarketOrders = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/orders/history/?datasource=tranquility&token=${userObj.aToken}`;
    const currentDate = Date.now();

    const orders = await fetchAllPages(endpointURL);

    return orders
      .filter(
        (item) =>
          !item.is_buy_order &&
          currentDate - Date.parse(item.issued) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((a) => ({
        ...a,
        CharacterHash: userObj.CharacterHash,
      }));
  };

  const fetchCharacterBlueprints = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&token=${userObj.aToken}`;
    const blueprints = await fetchAllPages(endpointURL);

    return blueprints.map((a) => ({
      ...a,
      CharacterHash: userObj.CharacterHash,
      isCorp: false,
    }));
  };

  const fetchCharacterTransactions = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/transactions/?datasource=tranquility&token=${userObj.aToken}`;
    const currentDate = new Date();

    const transactions = await fetchAllPages(endpointURL);

    return transactions.filter(
      (i) =>
        !i.is_buy &&
        currentDate - Date.parse(i.date) <=
          ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
    );
  };

  const fetchCharacterJournal = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/journal/?datasource=tranquility&token=${userObj.aToken}`;
    const currentDate = new Date();

    const journal = await fetchAllPages(endpointURL);

    return journal.filter(
      (item) =>
        currentDate - Date.parse(item.date) <=
        ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
    );
  };

  async function fetchUniverseNames(inputIDArray, userObj) {
    const chunkSize = 1000;
    const promises = [];
    const locationSplit = inputIDArray.reduce(
      (result, id) => {
        if (id >= STATIONID_RANGE.low && id <= STATIONID_RANGE.high) {
          result.standard.push(id);
        } else {
          result.citadels.push(id);
        }
        return result;
      },
      { citadels: [], standard: [] }
    );

    for (let i = 0; i < locationSplit.standard.length; i += chunkSize) {
      const chunk = locationSplit.standard.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      promises.push(getUniverseNames(chunk));
    }

    for (let id of locationSplit.citadels) {
      promises.push(getCitadelData(id, userObj));
    }

    const responses = (await Promise.all(promises)).flat();

    let retrunObject = {};

    responses.forEach((obj) => {
      if (!obj) return;
      retrunObject[obj.id] = obj;
    });
    return retrunObject;

    async function getUniverseNames(requestedLocationIDS) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
          {
            method: "POST",
            body: JSON.stringify(requestedLocationIDS),
          }
        );

        if (!request.ok) return {};

        return await request.json();
      } catch (err) {
        console.error(`Error retrieving universe data: ${err}`);
        return {};
      }
    }

    async function getCitadelData(citadelID, userObj) {
      try {
        const request = await fetch(
          `https://esi.evetech.net/latest/universe/structures/${citadelID}/?datasource=tranquility&token=${userObj.aToken}`
        );
        if (request.ok) {
          const json = await request.json();
          json.id = citadelID;
          return json;
        } else {
          return {
            id: citadelID,
            name: `No Access To Location - ${citadelID}`,
            unResolvedLocation: true,
          };
        }
      } catch (err) {
        console.error(`Error retrieving citadel data: ${err}`);
        return {};
      }
    }
  }

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

  async function fetchCharacterAssets(userObj) {
    const endpointURL = `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/assets/?datasource=tranquility&token=${userObj.aToken}`;

    const returnedData = await fetchAllPages(endpointURL);

    return returnedData;
  }

  async function fetchAssetLocationNames(userObj, locaionIDs, scope) {
    const chunkSize = 1000;
    const namesMap = new Map();
    const selectedURLDestination =
      scope === "character"
        ? `characters/${userObj.CharacterID}`
        : `corporations/${userObj.corporation_id}`;

    try {
      for (let i = 0; i < locaionIDs.length; i += chunkSize) {
        const chunk = locaionIDs.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const request = await fetch(
          `https://esi.evetech.net/latest/${selectedURLDestination}/assets/names/?datasource=tranquility&token=${userObj.aToken}`,
          {
            method: "POST",
            body: JSON.stringify(chunk),
          }
        );

        if (!request.ok) continue;

        const response = await request.json();

        for (let a of response) {
          if (a.name !== "None") {
            namesMap.set(a.item_id, a);
          }
        }
      }
      return namesMap;
    } catch (err) {
      console.error(`Error retrieving character asset location names: ${err}`);
      return new Map();
    }
  }

  const fetchCharacterStandings = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/standings/?datasource=tranquility&token=${userObj.aToken}`
      );
      if (!request.ok) return [];

      return await request.json();
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

      if (!stationDataPromise.ok) return null;

      return await stationDataPromise.json();
    } catch (err) {
      return null;
    }
  };

  const fetchCharacterData = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/legacy/characters/${userObj.CharacterID}/?datasource=tranquility`
      );

      if (!request.ok) return {};

      return await request.json();
    } catch (err) {
      console.error(`Error fetching character data: ${err}`);
      return {};
    }
  };

  const fetchCorpIndustryJobs = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/industry/jobs/?include_completed=true&token=${userObj.aToken}`;
    const indyJobs = await fetchAllPages(endpointURL);

    return indyJobs
      .filter(
        (job) =>
          !job.completed_date ||
          (new Date() - Date.parse(job.completed_date) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 &&
            job.installer_id === userObj.CharacterID)
      )
      .map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpMarketOrdersJobs = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/orders?token=${userObj.aToken}`;
    const orders = await fetchAllPages(endpointURL);

    return orders
      .filter(
        (item) => !item.is_buy_order && item.issued_by === userObj.CharacterID
      )
      .map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpHistMarketOrders = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/orders/history?token=${userObj.aToken}`;
    const currentDate = Date.now();

    const orders = await fetchAllPages(endpointURL);

    return orders
      .filter(
        (item) =>
          !item.is_buy_order &&
          item.issued_by === userObj.CharacterID &&
          currentDate - Date.parse(item.issued) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((bp) => ({ ...bp, isCorp: true }));
  };

  const fetchCorpBlueprintLibrary = async (userObj) => {
    const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/blueprints?token=${userObj.aToken}`;
    const blueprints = await fetchAllPages(endpointURL);

    return blueprints.map((bp) => ({
      ...bp,
      isCorp: true,
      corporation_id: userObj.corporation_id,
    }));
  };

  const fetchCorpPublicInfo = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/`
      );

      if (!request.ok) return null;

      const data = await request.json();

      data.corporation_id = userObj.corporation_id;
      return data;
    } catch (err) {
      console.error(`Error fetching public corporation data: ${err}`);
      return null;
    }
  };

  const fetchCorpDivisions = async (userObj) => {
    try {
      const request = await fetch(
        `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/divisions?token=${userObj.aToken}`
      );
      if (!request.ok) return null;

      let data = await request.json();

      data.corporation_id = userObj.corporation_id;
      return data;
    } catch (err) {
      console.error(`Error fetching corporation divisions: ${err}`);
      return null;
    }
  };

  const fetchCorpJournal = async (userObj) => {
    let journal = [];
    const maxDivisions = 7;
    const currentDate = Date.now();
    const refTypes = new Set([
      "brokers_fee",
      "market_escrow",
      "market_transaction",
      "transaction_tax",
    ]);

    try {
      for (let division = 1; division <= maxDivisions; division++) {
        const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/wallets/${division}/journal?token=${userObj.aToken}`;

        const divisionArray = await fetchAllPages(endpointURL);

        const filteredDivisionArray = divisionArray.filter(
          (item) =>
            currentDate - Date.parse(item.date) <=
              ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 &&
            refTypes.has(item.ref_type)
        );
        journal.push({
          division,
          data: filteredDivisionArray,
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
    const maxDivisions = 7;
    const currentDate = Date.now();

    try {
      for (let division = 1; division <= maxDivisions; division++) {
        const endpointURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/wallets/${division}/transactions?token=${userObj.aToken}`;
        const divisionArray = await fetchAllPages(endpointURL);

        const filteredDivisionArray = divisionArray.filter(
          (item) =>
            currentDate - Date.parse(item.date) <=
              ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 && !item.is_buy
        );
        transactions.push({
          division,
          data: filteredDivisionArray,
        });
      }
      return transactions;
    } catch (err) {
      console.error(`Error fetching corporation transactions: ${err}`);
      return [];
    }
  };

  const fetchCorpAssets = async (userObj) => {
    const endpoingURL = `https://esi.evetech.net/latest/corporations/${userObj.corporation_id}/assets/?datasource=tranquility&token=${userObj.aToken}`;
    const assets = await fetchAllPages(endpoingURL);

    return assets.map((a) => ({
      ...a,
      corporation_id: userObj.corporation_id,
    }));
  };

  return {
    fetchCharacterBlueprints,
    fetchCharacterData,
    fetchCharacterSkills,
    fetchCharacterAssets,
    fetchAssetLocationNames,
    fetchCharacterHistMarketOrders,
    fetchCharacterStandings,
    fetchCharacterIndustryJobs,
    fetchCharacterMarketOrders,
    fetchCharacterTransactions,
    fetchCharacterJournal,
    serverStatus,
    stationData,
    fetchCorpPublicInfo,
    fetchCorpDivisions,
    fetchCorpIndustryJobs,
    fetchCorpJournal,
    fetchCorpTransactions,
    fetchCorpMarketOrdersJobs,
    fetchCorpHistMarketOrders,
    fetchCorpBlueprintLibrary,
    fetchCorpAssets,
    fetchUniverseNames,
  };
}
