import { Container, Grid, Table, TableRow, Typography } from '@material-ui/core';
import React, { useContext } from 'react';
import { ActiveJobContext } from "../../../../Context/JobContext";

export function EditPage2() {
    const { activeJob, UpdateActiveJob } = useContext(ActiveJobContext);
    console.log(activeJob) 
    return (
      <Container>
        <Grid container direction="row">
          <Grid item sm={12}>
            <Table>
              {activeJob.job.materials.map((material) => {
                console.log(material);
                <TableRow>
                  <Typography variant="body2">{material.name}</Typography>
                  <Typography variant="body2">{material.quantity}</Typography>
                </TableRow>
              })}
            </Table>
          </Grid>
        </Grid>
      </Container>
    );  
};