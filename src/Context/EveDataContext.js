import React, { createContext, useState } from 'react';
import { eveIDsDefault } from "./defaultValues";

export const EveIDsContext = createContext();

export const EveIDs = (props) => {
    const [eveIDs, updateEveIDs] = useState(eveIDsDefault);

    return (
        <EveIDsContext.Provider value={{ eveIDs, updateEveIDs }}>
            {props.children}
        </EveIDsContext.Provider>
    );
};

export const EveESIStatusContext = createContext();

export const EveESIStatus = (props) => {
    const [eveESIStatus, updateEveESIStatus] = useState({
        serverStatus: {
            online: false,
            playerCount: 0,
            attempts:[]
        },
        charSkills: {
            attempts: []
        },
        indyJobs: {
            attempts:[]
        },
        marketOrders: {
            attempts:[]
        },
        histMarketOrders: {
            attempts:[]
        },
        blueprintLib: {
            attempts:[]
        },
        walletTrans: {
            attempts:[]
        },
        walletJourn: {
            attempts:[]
        },
        idToName: {
            attempts:[]
        }
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
