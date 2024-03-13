import { useContext, useEffect, useMemo, useState } from "react";
import { Grid, Pagination } from "@mui/material";
import { ESIOffline } from "../offlineNotification";
import { LibrarySearch } from "./LibrarySearch";
import { ClassicBlueprintGroup } from "./Classic/classicBlueprintGroup";
import { CompactBlueprintGroup } from "./Compact/compactBlueprintGroup";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../Context/EveDataContext";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export default function BlueprintLibrary() {
  const { esiBlueprints } = useContext(PersonalESIDataContext);
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();
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
    const tempArray = [
      ...esiBlueprints.flatMap((entry) => entry.data),
      ...Array.from(corpEsiBlueprints.values())
        .filter((obj) => Object.keys(obj).length > 0)
        .map(Object.values)
        .reduce((acc, val) => acc.concat(val), []),
    ];
    const idArray = [...new Set(tempArray.map((bp) => bp.type_id))];

    tempArray.sort(
      (a, b) =>
        a.quantity.toString().localeCompare(b.quantity.toString()) ||
        b.material_efficiency - a.material_efficiency ||
        b.time_efficiency - a.time_efficiency
    );

    updateBlueprintData({
      ids: [...idArray],
      blueprints: tempArray,
    });
  }, [esiBlueprints, corpEsiBlueprints]);

  useEffect(() => {
    const returnIDs = blueprintData.ids.slice(pagination.from, pagination.to);
    const returnBps = blueprintData.blueprints.filter((i) =>
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
            if (parentUser.settings.layout.enableCompactView) {
              return (
                <CompactBlueprintGroup
                  key={bpID}
                  bpID={bpID}
                  blueprintResults={blueprintResults}
                />
              );
            } else {
              return (
                <ClassicBlueprintGroup
                  key={bpID}
                  bpID={bpID}
                  blueprintResults={blueprintResults}
                />
              );
            }
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
