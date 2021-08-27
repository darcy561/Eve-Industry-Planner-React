import React, { useContext } from 'react';
import { JobStatusContext } from '../../../Context/JobContext';
import { makeStyles } from '@material-ui/styles';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Container,
    Divider,
    Grid,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
  import { JobCard } from '../Job Card';

const useStyles = makeStyles((theme) => ({
    Accordion: {
      flexGrow: 1,
      background: "none",
      marginBottom: "16px",
    },
  }));

export function PlannerAccordion() {
    const { jobStatus, setJobStatus } = useContext(JobStatusContext);
    const classes = useStyles();
    return (
      <Container maxWidth={false} disableGutters={true}>
        {/* Builds each status accordion on the job planner main page */}
        {jobStatus.map((s) => {
          return (
            <>
              <Grid key={s.id} container item xs={12}>
                <Accordion
                  className={classes.Accordion}
                  defaultExpanded={true}
                  square={true}
                  spacing={1}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon style={{ color: "#E0E0E0" }} />}
                    aria-label="Expand"
                  >
                    <Typography variant="h4">{s.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container direction="row" item xs={12} spacing={1}>
                      <JobCard id={s.id} />
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                <Divider />
              </Grid>
            </>
          );
        })}
      </Container>
    );
  }