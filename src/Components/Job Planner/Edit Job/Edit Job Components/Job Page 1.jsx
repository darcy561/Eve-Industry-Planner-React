import React, { useContext, useEffect, useState } from 'react';
import Select from 'react-select';
import { ActiveJobContext } from '../../../../Context/JobContext';
import { blueprintVariables } from '../..';
import { jobTypes } from '../..';
import { CalculateTotals } from '../blueprintCalcs';

export function EditPage1() {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [RunCalcultions, ChangeRunCalculations] = useState(true);

  useEffect(() => {
    if (RunCalcultions === true) {
      CalculateTotals(activeJob);
      console.log("done");
    }
  },[RunCalcultions]);
  
    return (
      <>
        <div className="settingsOptionsWrapper">
          {/* Job Totals Figures */}
          <div className="jobTotalsBox">
            <div>
              <div>Items Produced Per Run</div>
              <div>TBC</div>
            </div>
            <div>
              <div>Total Items Per Job</div>
              <div>TBC</div>
            </div>
            <div>
              <div>Total Items Being Produced</div>
              <div>TBC</div>
            </div>
          </div>
          {/* // Runs & Jobs Dropdown */}
          <div className="jobCalculations">
            <div>
              <div>
                <div>Runs</div>
                <div>
                  <input
                    type="Number"
                    min="1"
                    max={activeJob.maxProductionLimit}
                    value={activeJob.runCount}
                    onChange={(e) => {
                      ChangeRunCalculations(prev=> !prev);
                      console.log("false");
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        runCount: Number(e.target.value),
                      }))
                      ChangeRunCalculations(prev=> !prev);

                    }}
                  />
                </div>
              </div>
              <div>
                <div>Jobs</div>
                <div>
                  <input
                    type="Number"
                    min="1"
                    value={activeJob.jobCount}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        jobCount: Number(e.target.value),
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
            {/* Blueprint Data Dropdown */}
            {activeJob.jobType === jobTypes.manufacturing ? (
              <>
                <div>
                  <div>Blueprint Material Efficentcy</div>
                  <div>
                    <Select
                      value={blueprintVariables.me.find(
                        (x) => x.value === activeJob.bpME
                      )}
                      options={blueprintVariables.me}
                      onChange={(e) => {
                        updateActiveJob((prevState) => ({
                          ...prevState,
                          bpME: Number(e.value),
                        }));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div>Blueprint Time Efficentcy</div>
                  <div>
                    <Select
                      value={blueprintVariables.te.find(
                        (x) => x.value === activeJob.bpTE
                      )}
                      options={blueprintVariables.te}
                      onChange={(e) => {
                        updateActiveJob((prevState) => ({
                          ...prevState,
                          bpTE: Number(e.value),
                        }));
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}
            {/* Structure Dropdown */}
            <div>
              <div>Structure Type</div>
              <div>
              {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                    value={blueprintVariables.manStructure.find(
                      (x) => x.value === activeJob.structureTypeDisplay
                    )}
                    options={blueprintVariables.manStructure}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        structureTypeDisplay: e.value
                      }));
                    }}
                  />
                ) : activeJob.jobType === jobTypes.reaction ? (
                  <Select
                    value={blueprintVariables.reactionStructure.find(
                      (x) => x.value === activeJob.structureTypeDisplay
                    )}
                    options={blueprintVariables.reactionStructure}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        structureTypeDisplay: e.value
                      }));
                    }}
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>
            {/* Rig Dropdown */}
            <div>
              <div>Rig Type</div>
              <div>
                {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                    value={blueprintVariables.manRigs.find(
                      (x) => x.value === activeJob.rigType
                    )}
                    options={blueprintVariables.manRigs}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        rigType: Number(e.value),
                      }));
                    }}
                  />
                ) : activeJob.jobType === jobTypes.reaction ? (
                  <Select
                    value={blueprintVariables.reactionRigs.find(
                      (x) => x.value === activeJob.rigType
                    )}
                    options={blueprintVariables.reactionRigs}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        rigType: Number(e.value),
                      }));
                    }}
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>
            {/* System Dropdown */}
            <div>
              <div>System Type</div>
              <div>
              {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                    value={blueprintVariables.manSystem.find(
                      (x) => x.value === activeJob.systemType
                    )}
                    options={blueprintVariables.manSystem}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        systemType: Number(e.value),
                      }));
                    }}
                  />
                ) : activeJob.jobType === jobTypes.reaction ? (
                  <Select
                    value={blueprintVariables.reactionSystem.find(
                      (x) => x.value === activeJob.systemType
                    )}
                    options={blueprintVariables.reactionSystem}
                    onChange={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        systemType: Number(e.value),
                      }));
                    }}
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Raw Resources List */}
        <div className="settingsRawResourceWrapper">
          <div className="settingsRawResourceRow">
            <div>
              <h3>Raw Resource</h3>
            </div>
            <div>
              <h3>Amount</h3>
            </div>
          </div>
          {RunCalcultions ?
            activeJob.job.materials.map((material) => {
            return (
              <div key={material.itemID} className="settingsRawResourceRow">
                <div>
                  <div onClick={() => {}}>+</div>
                  <div>{material.name}</div>
                </div>
                <div>{Number(material.quantity).toLocaleString()}</div>
              </div>
            );
          }):<></>}
        </div>
      </>
    );
    
};