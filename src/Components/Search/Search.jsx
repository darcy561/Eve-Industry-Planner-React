import React, { useContext, useState } from 'react';
import Fuse from 'fuse.js';
import itemList from './object_recipe_names.json'
import { createJob } from '../Job Planner/JobBuild';
import { JobArrayContext } from '../../Context/JobContext';


function SearchPlanner() {

    const [jobArray, updateJobArray] = useContext(JobArrayContext);
    const [query, setQuery] = useState('');

    const fuse = new Fuse(itemList, {
        keys: [
            'name'
        ],
        threshold: 0.1
    });

    const results = fuse.search(query);
    const itemResults = results.map(results => results.item);

    function handleOnSeach({ currentTarget = {} }) {
        document.getElementById('searchResults').style.display = "block";
        const { value } = currentTarget;
        setQuery(value);
    };

    async function createJobProcess(itemID) {
        document.getElementById('searchResults').style.display = "none";
        document.getElementById('searchBar').value = "";
        const outputObject = await createJob(itemID);
        updateJobArray(prevArray => [...prevArray, outputObject]);
    };

    return (
        <>
            <section id="searchbox" className="block-section">
                <div className="searchBoxWrapper">
                    <input
                        id="searchBar"
                        className="searchBar"
                        placeholder="Search..."
                        value={query}
                        onChange={handleOnSeach}
                    />
                    <div id="searchResults" className="searchResults">
                        {itemResults.map(item => {
                            return (
                                <div key={item.itemID} className="resultItem" onClick={() => createJobProcess(item.itemID)}>{item.name}</div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </>
    );
};

function SearchTree() {

    const [query, setQuery] = useState('');

    const fuse = new Fuse(itemList, {
        keys: [
            'name'
        ],
        threshold: 0.1
    });

    const results = fuse.search(query);
    const itemResults = results.map(results => results.item);

    function handleOnSeach({ currentTarget = {} }) {
        const { value } = currentTarget;
        setQuery(value);
    };

    return (
        <>
            <section id="searchbox" className="block-section">
                <div className="searchBoxWrapper">
                    <input
                        className="searchBar"
                        placeholder="Search..."
                        value={query}
                        onChange={handleOnSeach}
                    />
                    <div id="searchResults" className="searchResults">
                        {itemResults.map(item => {
                            return (
                                <div key={item.itemID} className="resultItem">{item.name}</div>
                            )
                        })}
                    </div>
                </div>

            </section>
        </>
    );
};

export { SearchPlanner, SearchTree };