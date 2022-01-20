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