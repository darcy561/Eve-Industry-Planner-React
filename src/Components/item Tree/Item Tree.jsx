import React from "react";
import { SearchTree } from "../Search";

function ItemTree(){
    return (
      <>
      <SearchTree />
      <section className="block-section">
        <div id="jobWrapper" className="jobsWrapper"></div>
        <a>Item Tree</a>
      </section>
      </>
  );
};
export { ItemTree };
