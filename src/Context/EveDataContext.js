import React, { createContext, useState } from 'react';

export const EveIDsContext = createContext();

export const EveIDs = (props) => {
    const [eveIDs, updateEveIDs] = useState([]);

    return (
        <EveIDsContext.Provider value={{ eveIDs, updateEveIDs }}>
            {props.children}
        </EveIDsContext.Provider>
    );
};