import React, { createContext, useState } from "react";
import {
  defaultEsiBlueprints,
  defaultEsiHistOrders,
  defaultEsiJobs,
  defaultEsiJournal,
  defaultEsiOrders,
  defaultEsiSkills,
  defaultEsiStandings,
  defaultEsiTransactions,
  eveIDsDefault,
} from "./defaultValues";

export const EveIDsContext = createContext();

export const EveIDs = (props) => {
  const [eveIDs, updateEveIDs] = useState(eveIDsDefault);

  return (
    <EveIDsContext.Provider value={{ eveIDs, updateEveIDs }}>
      {props.children}
    </EveIDsContext.Provider>
  );
};

export const PersonalESIDataContext = createContext();
export const PersonalEsiData = (props) => {
  const [esiIndJobs, updateEsiIndJobs] = useState(defaultEsiJobs);
  const [esiSkills, updateEsiSkills] = useState(defaultEsiSkills);
  const [esiOrders, updateEsiOrders] = useState(defaultEsiOrders);
  const [esiHistOrders, updateEsiHistOrders] = useState(defaultEsiHistOrders);
  const [esiBlueprints, updateEsiBlueprints] = useState(defaultEsiBlueprints);
  const [esiJournal, updateEsiJournal] = useState(defaultEsiJournal);
  const [esiTransactions, updateEsiTransactions] = useState(
    defaultEsiTransactions
  );
  const [esiStandings, updateEsiStandings] = useState(defaultEsiStandings);
  return (
    <PersonalESIDataContext.Provider
      value={{
        esiIndJobs,
        updateEsiIndJobs,
        esiSkills,
        updateEsiSkills,
        esiOrders,
        updateEsiOrders,
        esiHistOrders,
        updateEsiHistOrders,
        esiBlueprints,
        updateEsiBlueprints,
        esiJournal,
        updateEsiJournal,
        esiTransactions,
        updateEsiTransactions,
        esiStandings,
        updateEsiStandings,
      }}
    >
      {props.children}
    </PersonalESIDataContext.Provider>
  );
};

export const CorpEsiDataContext = createContext();

export const CorpEsiData = (props) => {
  const [corpEsiIndJobs, updateCorpEsiIndJobs] = useState([]);
  return (
    <CorpEsiDataContext.Provider
      value={{ corpEsiIndJobs, updateCorpEsiIndJobs }}
    >
      {props.children}
    </CorpEsiDataContext.Provider>
  );
};

export const EveESIStatusContext = createContext();

export const EveESIStatus = (props) => {
  const [eveESIStatus, updateEveESIStatus] = useState({
    serverStatus: {
      online: false,
      playerCount: 0,
      attempts: [],
    },
    charSkills: {
      attempts: [],
    },
    indyJobs: {
      attempts: [],
    },
    marketOrders: {
      attempts: [],
    },
    histMarketOrders: {
      attempts: [],
    },
    blueprintLib: {
      attempts: [],
    },
    walletTrans: {
      attempts: [],
    },
    walletJourn: {
      attempts: [],
    },
    idToName: {
      attempts: [],
    },
  });

  return (
    <EveESIStatusContext.Provider value={{ eveESIStatus, updateEveESIStatus }}>
      {props.children}
    </EveESIStatusContext.Provider>
  );
};

export const EvePricesContext = createContext();

export const EvePrices = (props) => {
  const [evePrices, updateEvePrices] = useState([]);

  return (
    <EvePricesContext.Provider value={{ evePrices, updateEvePrices }}>
      {props.children}
    </EvePricesContext.Provider>
  );
};

export const SisiDataFilesContext = createContext();

export const SisiDataFiles = (props) => {
  const [sisiDataFiles, updateSisiDataFiles] = useState(false);
  return (
    <SisiDataFilesContext.Provider
      value={{ sisiDataFiles, updateSisiDataFiles }}
    >
      {props.children}
    </SisiDataFilesContext.Provider>
  );
};
