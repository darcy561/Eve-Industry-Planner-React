import { useContext, useEffect, useState } from "react";
import { Grid, Pagination } from "@mui/material";
import { UsersContext } from "../../Context/AuthContext";
import { ESIOffline } from "../offlineNotification";
import { LibrarySearch } from "./LibrarySearch";
import { BlueprintGroup } from "./BlueprintGroup";
import { PersonalESIDataContext } from "../../Context/EveDataContext";

export default function BlueprintLibrary() {
  const { users } = useContext(UsersContext);
  const {esiBlueprints} = useContext(PersonalESIDataContext)

  const [pagination, setPagination] = useState({
    count: 0,
    from: 0,
    to: 16,
    pageSize: 16,
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
    for (let entry of esiBlueprints) {
      entry.data.forEach((bp) => {
        bp.owner = entry.user
        tempArray.push(bp)
      })
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
    window.scrollTo(0, 0);
  }, [blueprintData, pagination.from, pagination.to, pagination.pageSize]);

  const handlePageChange = (event, page) => {
    const from = (page - 1) * pagination.pageSize;
    const to = (page - 1) * pagination.pageSize + pagination.pageSize;
    setPagination({ ...pagination, from: from, to: to });
  };

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <ESIOffline />
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <LibrarySearch
          updateBlueprintData={updateBlueprintData}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Grid>
      <Grid item xs={12} sx={{ marginLeft: "10px", marginRight: "10px" }}>
        <Grid container item spacing={2}>
          {blueprintResults.ids.map((bpID) => {
            return (
              <BlueprintGroup
                key={bpID}
                bpID={bpID}
                blueprintResults={blueprintResults}
              />
            );
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
              count={Math.ceil(blueprintData.ids.length / pagination.pageSize)}
              onChange={handlePageChange}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
