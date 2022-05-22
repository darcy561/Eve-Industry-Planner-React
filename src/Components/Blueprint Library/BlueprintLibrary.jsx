import { useContext, useEffect, useState } from "react";
import { Grid, Icon, Pagination, Paper, Typography } from "@mui/material";
import { UsersContext } from "../../Context/AuthContext";
import blueprintIDs from "../../RawData/searchIndex.json";
import InfoIcon from "@mui/icons-material/Info";
import { ESIOffline } from "../offlineNotification";
import { ApiJobsContext } from "../../Context/JobContext";
import { makeStyles } from "@mui/styles";
import { jobTypes } from "../../Context/defaultValues";
import { LibrarySearch } from "./LibrarySearch";

const pageSize = 16;

const useStyles = makeStyles((theme) => ({
  inUse: {
    backgroundColor: "#ffc107",
    color: "black",
  },
  expiring: {
    backgroundColor: "#d32f2f",
    color: "black",
  },
}));

export function BlueprintLibrary() {
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const classes = useStyles();

  const [pagination, setPagination] = useState({
    count: 0,
    from: 0,
    to: pageSize,
  });

  const [blueprintData, updateBlueprintData] = useState({
    ids: [],
    blueprints: [],
  });

  const [blueprintResults, updateBlueprintResults] = useState({
    ids: [],
    blueprints: [],
  });

  useEffect(() => {
    let tempArray = [];
    let idArray = new Set();
    for (let user of users) {
      tempArray = tempArray.concat(user.apiBlueprints);
    }
    tempArray.forEach((bp) => {
      idArray.add(bp.type_id);
    });

    updateBlueprintData({
      ids: [...idArray],
      blueprints: tempArray,
    });
  }, [users]);

  useEffect(() => {
    let returnIDs = blueprintData.ids.slice(pagination.from, pagination.to);
    let returnBps = blueprintData.blueprints.filter((i) =>
      returnIDs.includes(i.type_id)
    );

    updateBlueprintResults({ ids: returnIDs, blueprints: returnBps });
  }, [blueprintData, pagination.from, pagination.to]);

  const handlePageChange = (event, page) => {
    const from = (page - 1) * pageSize;
    const to = (page - 1) * pageSize + pageSize;
    setPagination({ ...pagination, from: from, to: to });
  };

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <ESIOffline />
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <LibrarySearch updateBlueprintData={updateBlueprintData} />
      </Grid>
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <Grid container item spacing={2}>
          {blueprintResults.ids.map((bpID) => {
            const esiJobs = apiJobs.filter((i) => i.product_type_id === bpID);
            let bpData = blueprintIDs.find((i) => i.blueprintID === bpID);
            let output = blueprintResults.blueprints.filter(
              (bp) => bp.type_id === bpID
            );

            if (bpData !== undefined) {
              return (
                <Grid key={bpID} container item xs={12} sm={6}>
                  <Paper
                    square={true}
                    elevation={2}
                    sx={{ width: "100%", padding: "20px" }}
                  >
                    <Grid
                      container
                      item
                      xs={12}
                      sx={{
                        paddingBottom: "10px",
                      }}
                    >
                      <Grid item xs={12} sx={{ marginBottom: "20px" }}>
                        <Typography
                          color="primary"
                          sx={{ typography: { xs: "h5", sm: "h5" } }}
                        >
                          {bpData.name}
                        </Typography>
                      </Grid>
                      {output.map((blueprint) => {
                        let blueprintType = "bp";
                        if (blueprint.quantity === -2) {
                          blueprintType = "bpc";
                        }
                        const esiJob = esiJobs.find(
                          (i) =>
                            i.blueprint_id === blueprint.item_id &&
                            i.status === "active"
                        );
                        return (
                          <Grid
                            key={blueprint.item_id}
                            container
                            item
                            xs={3}
                            sm={3}
                            md={2}
                            align="center"
                            sx={{ marginBottom: "10px" }}
                          >
                            <Grid item xs={12}>
                              <picture>
                                {/* <source
                                    media="(max-width:700px)"
                                    srcSet={`https://images.evetech.net/types/${blueprint.type_id}/${blueprintType}?size=32`}
                                  /> */}
                                <img
                                  src={`https://images.evetech.net/types/${blueprint.type_id}/${blueprintType}?size=64`}
                                  alt=""
                                />
                              </picture>
                            </Grid>
                            <Grid
                              className={
                                blueprintType === "bpc"
                                  ? esiJob && blueprint.runs <= esiJob.runs
                                    ? classes.expiring
                                    : esiJob
                                    ? classes.inUse
                                    : "none"
                                  : esiJob
                                  ? classes.inUse
                                  : "none"
                              }
                              item
                              xs={12}
                              sx={{ height: "3px" }}
                            />
                            {bpData.jobType === jobTypes.manufacturing ? (
                              <>
                                <Grid item xs={12}>
                                  <Typography variant="caption">
                                    M.E: {blueprint.material_efficiency}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="caption">
                                    T.E: {blueprint.time_efficiency}
                                  </Typography>
                                </Grid>
                                {blueprint.runs !== -1 ? (
                                  <Grid item xs={12}>
                                    <Typography variant="caption">
                                      Runs: {blueprint.runs}
                                    </Typography>
                                  </Grid>
                                ) : null}
                              </>
                            ) : null}
                            {esiJob ? (
                              <Grid item xs={12}>
                                <Icon aria-haspopup="true" color="primary">
                                  <InfoIcon fontSize="small" />
                                </Icon>
                              </Grid>
                            ) : null}
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>
                </Grid>
              );
            } else return null;
          })}
          <Grid
            container
            item
            justifyContent="center"
            align="center"
            xs={12}
            sx={{ marginTop: "40px" }}
          >
            <Pagination
              color="primary"
              size="small"
              count={Math.ceil(blueprintData.ids.length / pageSize)}
              onChange={handlePageChange}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
