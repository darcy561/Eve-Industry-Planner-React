import React, { useContext } from 'react';
import Select from 'react-select';
import { ActiveJobContext, JobArrayContext } from '../../../../Context/JobContext';
import { blueprintVariables } from '../..';
import { jobTypes } from '../..';
import { createJob } from '../../JobBuild';

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    color: `black`
  }),
  container: (provided, state) => ({
    ...provided,
    // width: `50%`,
  }),
  control: (provided, state) => ({
    ...provided,
    width: `50%`,
    backgroundColor: `#4e4a4a`,
    boxShadow: state.isSelected ? `none`: ``,
    border: `none`,
    "&:hover": {
      borderColor: `rgba(219,160,45)`,
    } 
  }),
  placeholder: (provided, state) => ({
    ...provided,
    color: `#E0E0E0`,
    fontWeight: `normal`,
  }),
  menu: (provided, state) => ({
    ...provided,
    width: `50%`,
    backgroundColor: `#4e4a4a`,
  }),
  option: (provided, state) => ({
    ...provided,
    color: state.isFocused ? `rgba(219,160,45)` : ``,
    backgroundColor: state.isFocused ? `rgba(224,224,224,0.25)` : ``,
    fontWeight: state.isFocused ? `bold` : ``,
  }),
  singleValue: () => ({
    color: `#E0E0E0`,
  }),
  indicatorSeparator: () => ({
    display: `none`,
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? `rgba(219,160,45)`:``,
    "&:hover": {
      color: `rgba(219,160,45)`,
    } 
  }),
}

export function EditPage1() {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [jobArray, updateJobArray] = useContext(JobArrayContext);

  async function createJobFromEdit(itemID, itemQty) {
    try {
      const newJob = await createJob(itemID);
      switch (newJob.jobType) {
        case 1:
          newJob.jobCount = Math.ceil(itemQty / (newJob.maxProductionLimit * newJob.manufacturing.products[0].quantity));
          newJob.runCount = Math.ceil(itemQty / newJob.manufacturing.products[0].quantity / newJob.jobCount);
          break;
        case 2:
          newJob.jobCount = Math.ceil(itemQty / (newJob.maxProductionLimit * newJob.reaction.products[0].quantity));
          newJob.runCount = Math.ceil(itemQty / newJob.reaction.products[0].quantity / newJob.jobCount);
          break;
      };
      updateJobArray(prevArray => [...prevArray, newJob]);
    } catch (err) {
      
    }
  };

    return (
      <>
        <div className="settingsOptionsWrapper">
          {/* Job Totals Figures */}
          <div className="jobTotalsBox">
            <div>
              <div>Items Produced Per Run</div>
              <div>{
                activeJob.jobType === jobTypes.manufacturing ? (
                  Number(activeJob.manufacturing.products[0].quantity).toLocaleString()
                ) : activeJob.jobType === jobTypes.reaction ? (
                  Number(activeJob.reaction.products[0].quantity).toLocaleString()
                ) : (<></>)
              }</div>
            </div>
            <div>
              <div>Total Items Per Job</div>
              <div>{activeJob.job.products.quantityPerJob}</div>
            </div>
            <div>
              <div>Total Items Being Produced</div>
              <div>{activeJob.job.products.totalQuantity }</div>
            </div>
          </div>
          {/* // Runs & Jobs Dropdown */}
          <div className="jobCalculations">
            <div className="jobInputBox">
              <div>
                <div><h3>Runs:</h3></div>
                <div>
                  <input
                    className="settingsTextBox"
                    type="Number"
                    min="0"
                    max={activeJob.maxProductionLimit}
                    defaultValue={activeJob.runCount}
                    onBlur={(e) => {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        runCount: Number(e.target.value),
                      }))
                    }}
                  />
                </div>
              </div>
              <div>
                <div><h3>Jobs:</h3></div>
                <div>
                  <input
                    className="settingsTextBox"
                    type="Number"
                    min="0"
                    defaultValue={activeJob.jobCount}
                    onBlur={(e) => {
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
                  <div><h3>Material Efficiency</h3></div>
                  <div>
                    <Select
                      styles={customStyles}
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
                  <div><h3>Time Efficiency</h3></div>
                  <div>
                    <Select
                      styles={customStyles}
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
              <div><h3>Structure Type</h3></div>
              <div>
              {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                  styles={customStyles}
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
                    styles={customStyles}
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
              <div><h3>Rig Type</h3></div>
              <div>
                {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                  styles={customStyles}
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
                    styles={customStyles}
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
              <div><h3>System Type</h3></div>
              <div>
              {activeJob.jobType === jobTypes.manufacturing ? (
                  <Select
                    styles={customStyles}
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
                    styles={customStyles}
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
          <div className="settingsRawResourceRowHeader">
            <div>
              <h3>Raw Resource</h3>
            </div>
            <div>
              <h3>Amount</h3>
            </div>
          </div>
          {activeJob.job.materials.map((material) => {
            return (
              <div key={material.typeID} className="settingsRawResourceRow" onClick={() => {
                createJobFromEdit(material.typeID, material.quantity)
              }}>
                <div>
                  <div >+</div>
                  <div>{material.name}</div>
                </div>
                <div>{Number(material.quantity).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </>
    );
    
};