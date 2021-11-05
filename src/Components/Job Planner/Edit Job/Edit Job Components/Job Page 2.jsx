import { Container, Divider,  Grid, IconButton, TextField, Typography } from '@material-ui/core';
import React, { useContext, useState } from 'react';
import { ActiveJobContext } from "../../../../Context/JobContext";
import { MdAdd } from "react-icons/md";
import { BiMinus } from "react-icons/bi";

export function EditPage2() {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [inputs, setInputs] = useState({ itemCost: 0, itemCount: 0 })
  console.log(activeJob);
  return (
      <Container>
        <Grid container direction="row">
          <Grid item xs={12}>
          {activeJob.job.materials.map((material) => {
                return (
                  <Grid container direction="row">
                    <Grid xs={6}>
                    <Typography variant="h5">{material.name}</Typography>
                    </Grid>
                    <Grid xs={3}>
                      <Typography variant="h5">{material.quantityPurchased.toLocaleString()}/{material.quantity.toLocaleString()}</Typography>
                    <Typography variant="h5"></Typography>
                    </Grid>
                    <Divider />
                    <Grid container direction="column">
                    {material.purchasing.map((record) => {
                      return (
                          <Grid container direction="row">
                        <Grid xs={2} sm={2} md={1}>
                          <Typography variant="body2">{record.itemCount}</Typography>
                        </Grid>
                        <Grid xs={2} sm={2} md={1}>
                          <Typography variant="body2">{record.itemCost}</Typography>
                          </Grid>
                          <Grid xs={2} sm={2} md={1}>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                const materialIndex = activeJob.job.materials.findIndex(x => x.typeID === material.typeID);
                                const purchasingIndex = material.purchasing.findIndex(i => i.id === record.id);
                                const newArray = activeJob.job.materials
                                newArray[materialIndex].quantityPurchased -= newArray[materialIndex].purchasing[purchasingIndex].itemCount;
                                newArray[materialIndex].purchasedCost -= newArray[materialIndex].purchasing[purchasingIndex].itemCost;
                                newArray[materialIndex].purchasing.splice(purchasingIndex, 1);
                                updateActiveJob(prevObj => ({
                                  ...prevObj, job: { ...prevObj.job, materials: newArray }
                                }));
                            }}>
                            <BiMinus/>
                          </IconButton>
                          </Grid>
                            </Grid>
                      )
                    })}
                    </Grid>
                    <Grid xs={12}>
                      <Typography variant="body2">Add material cost and quantity purchased</Typography>
                    </Grid>

                    <Grid xs={5} sm={2} md={1}>
                      <TextField
                        defaultValue={inputs.itemCount}
                        variant="outlined"
                        helperText="Number of Items"
                        type="number"
                        onBlur={(e) => {
                          setInputs((prevState) => ({
                            ...prevState,
                              itemCount: Number(e.target.value),
                          }));                          
                        }}
                      />
                      
                    </Grid>
                    <Grid xs={2} sm={2} md={2}>
                    </Grid>
                    <Grid xs={5} sm={2} md={1}>
                      <TextField
                        defaultValue={inputs.itemCost}
                        variant="outlined"
                        helperText="Total Cost"
                        type="number"
                        onBlur={(e) => {
                          setInputs((prevState) => ({
                            ...prevState,
                              itemCost: Number(e.target.value),
                          }));                          
                        }}
                      />  
                      </Grid>

                    <Grid xs={2} sm={2} md={1}>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          const materialIndex = activeJob.job.materials.findIndex(x => x.typeID === material.typeID);
                          const newArray = activeJob.job.materials
                          newArray[materialIndex].purchasing.push({ "id": Date.now(), "itemCount": inputs.itemCount, "itemCost": inputs.itemCost })
                          newArray[materialIndex].quantityPurchased += inputs.itemCount;
                          newArray[materialIndex].purchasedCost += inputs.itemCost;
                          updateActiveJob((prevObj) => ({
                            ...prevObj, job: {...prevObj.job, materials: newArray}
                          }))
                          setInputs({ itemCost: 0, itemCount: 0 });
                        }}
                      >
                      <MdAdd/>
                      </IconButton>
                      </Grid>
                    <Divider/>
                    </Grid>
                );  
              })}
          </Grid>
        </Grid>
      </Container>
    );  
};