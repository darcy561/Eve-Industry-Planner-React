import { useContext } from "react";
import skillsReference from "../RawData/bpSkills.json";
import { EveESIStatusContext } from "../Context/EveDataContext";

export function useEveApi() {
  const { eveESIStatus, updateEveESIStatus } = useContext(EveESIStatusContext);

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
      } else return [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const IndustryJobs = async (userObj, parentInfo) => {
    try {
      const indyPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${userObj.aToken}`
      );

      const indyJSON = await indyPromise.json();

      if (indyPromise.status === 200) {
        indyJSON.forEach((job) => {
          if (job.activity_id === 1 || job.activity_id === 9) {
            if (userObj.ParentUser) {
              if (userObj.linkedJobs.includes(job.job_id)) {
                job.linked = true;
              } else {
                job.linked = false;
              }
            } else {
              if (parentInfo.linkedJobs.includes(job.job_id)) {
                job.linked = true;
              } else {
                job.linked = false;
              }
            }
          }
        });

        let filterOld = indyJSON.filter(
          (job) =>
            job.completed_date === undefined ||
            new Date() - Date.parse(job.completed_date) <= 1209600000
          // 10 days
        );

        let filtered = filterOld.filter(
          (job) =>
            job.activity_id === 1 ||
            job.activity_id === 4 ||
            job.activity_id === 3 ||
            job.activity_id === 9 ||
            job.activity_id === 5
        );

        return filtered;
      } else return [];
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

      if (marketPromise.status === 200) {
        marketJSON.forEach((item) => {
          item.CharacterHash = userObj.CharacterHash;
        });

        let filtered = marketJSON.filter((item) => !item.is_buy_order);

        return filtered;
      }
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const HistoricMarketOrders = async (userObj) => {
    const returnArray = [];

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
      item.CharacterHash = userObj.CharacterHash;
    });

    return filtered;
  };

  const BlueprintLibrary = async (userObj) => {
    const returnArray = [];
    let pageCount = 1;
    while (pageCount < 11) {
      try {
        const blueprintPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/blueprints/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );

        const blueprintJSON = await blueprintPromise.json();
        if (blueprintPromise.status === 200) {
          blueprintJSON.forEach((item) => {
            returnArray.push(item);
          });
          if (blueprintJSON.length < 1000) {
            pageCount = 11;
          } else {
            pageCount++;
          }
        } else {
          pageCount = 11;
        }
      } catch (err) {
        pageCount = 11;
        console.log(err);
        return [];
      }
    }
    return returnArray;
  };

  const WalletTransactions = async (userObj) => {
    try {
      const transactionsPromise = await fetch(
        `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/wallet/transactions/?datasource=tranquility&token=${userObj.aToken}`
      );

      const transactionsJSON = await transactionsPromise.json();
      if (transactionsPromise.status === 200) {
        const filtered = transactionsJSON.filter(
          (i) =>
            i.is_buy === false && new Date() - Date.parse(i.date) <= 1209600000
        );
        return filtered;
      } else return [];
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
          let currentDate = new Date();
          journalJSON.forEach((item) => {
            if (currentDate - Date.parse(item.date) <= 1209600000) {
              returnArray.push(item);
            }
          });

          if (journalJSON.length < 1000) {
            pageCount = 11;
          } else {
            pageCount++;
          }
        } else {
          pageCount = 11;
        }
      } catch (err) {
        pageCount = 11;
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
      const idPromise = await fetch(
        `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
        {
          method: "POST",
          body: JSON.stringify(standardIDs),
        }
      );
      if (idPromise.status === 200) {
        const idJSON = await idPromise.json();

        idJSON.forEach((item) => {
          newArray.push(item);
        });
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

  const fullAssetsList = async (userObj) => {
    let pageCount = 1;
    let returnArray = [];

    while (pageCount < 21) {
      try {
        const assetPromise = await fetch(
          `https://esi.evetech.net/latest/characters/${userObj.CharacterID}/assets/?datasource=tranquility&page=${pageCount}&token=${userObj.aToken}`
        );
        const assetJSON = await assetPromise.json();

        if (assetPromise.status === 200) {
          assetJSON.forEach((item) => {
            item.CharacterHash = userObj.CharacterHash;
            returnArray.push(item);
          });

          if (assetJSON.length < 1000) {
            pageCount = 21;
          } else {
            pageCount++;
          }
        } else {
          pageCount = 21;
        }
      } catch (err) {
        pageCount = 21;
        console.log(err);
        return [];
      }
    }
    return returnArray;
  };

  return {
    BlueprintLibrary,
    CharacterSkills,
    fullAssetsList,
    HistoricMarketOrders,
    IDtoName,
    IndustryJobs,
    MarketOrders,
    serverStatus,
    WalletTransactions,
    WalletJournal,
  };
}
