import { useEffect, useMemo } from "react";
import { Pagination, Box, Grid } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { LibrarySearch } from "./LibrarySearch";
import { ClassicBlueprintGroup } from "./Classic/classicBlueprintGroup";
import { CompactBlueprintGroup } from "./Compact/compactBlueprintGroup";
import useUsersStore from "../../Zustand/usersStore";
import useBlueprintIndex, {
  BLUEPRINT_SCOPE,
} from "../../Hooks/EveEsi/useBlueprintIndex";
import useGetAllIndustryJobs from "../../Hooks/EveEsi/useGetAllIndustryJobs";
import { useCachedData } from "../../Hooks/App/useCachedData";
import { CACHED_DATA_FILES } from "../../Context/defaultValues";
import filterLibraryBlueprints from "../../Functions/Blueprints/filterLibraryBlueprints";
import ContentPanel from "../../Styled Components/Paper/ContentPanel";
import BlueprintArchiveDialogue from "../Dialogues/Blueprint Archive";

export default function BlueprintLibrary() {
  const enableCompactView = useUsersStore(
    (state) => state.applicationSettings.enableCompactLayoutView
  );
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) || {};

  const { data: itemList } = useCachedData(CACHED_DATA_FILES.SEARCH_INDEX);

  // Initialise URL params with defaults if they don't exist
  useEffect(() => {
    const hasParams = search && Object.keys(search).length > 0;
    if (!hasParams) {
      navigate({
        search: {
          filter: "all",
          page: 1,
          pageSize: 16,
        },
        replace: true, // Use replace to avoid adding to history
      });
    }
  }, []); // Only run on mount

  // Get URL params with defaults and validation
  const validFilters = [
    "all",
    "active",
    "manufacturing",
    "reactions",
    "bpo",
    "bpc",
  ];
  const currentFilter =
    search?.filter && validFilters.includes(search.filter)
      ? search.filter
      : "all";
  const currentPage = Math.max(1, search?.page || 1);
  const currentPageSize = Math.min(64, Math.max(4, search?.pageSize || 16));
  const searchBlueprintID = search?.search
    ? parseInt(search.search)
    : undefined;

  // Subscribed rather than read from the cache during render. A cache read hands back a new object
  // every render, so the filter and sort below re-ran every time and the page picked up new rows
  // only because a sibling query happened to re-render it.
  const { data: blueprints } = useBlueprintIndex({ scope: BLUEPRINT_SCOPE.ALL });
  const { data: apiJobs = [] } = useGetAllIndustryJobs();

  // Combine and filter blueprints based on URL params
  const filteredBlueprintData = useMemo(() => {
    const matching = searchBlueprintID
      ? blueprints.byTypeId.get(searchBlueprintID) ?? []
      : filterLibraryBlueprints(blueprints.rows, currentFilter, apiJobs);

    // Originals before copies, then the most researched — the same order the collection uses within
    // a type, applied across the whole library.
    const sorted = [...matching].sort(
      (a, b) =>
        Number(a.isCopy) - Number(b.isCopy) || b.me - a.me || b.te - a.te
    );

    let ids = [...new Set(sorted.map((row) => row.typeId))];

    // A search naming a blueprint the account does not hold still opens its frame, so the archived
    // jobs for it can be read.
    if (searchBlueprintID && ids.length === 0) {
      const known = itemList?.some(
        (item) => item.blueprintID === searchBlueprintID
      );
      if (known) ids = [searchBlueprintID];
    }

    return { ids, blueprints: sorted };
  }, [blueprints, currentFilter, searchBlueprintID, itemList, apiJobs]);

  // Calculate pagination
  const totalPages = Math.ceil(
    filteredBlueprintData.ids.length / currentPageSize
  );
  const from = (currentPage - 1) * currentPageSize;
  const to = Math.min(
    currentPage * currentPageSize,
    filteredBlueprintData.ids.length
  );

  // Get paginated results
  const blueprintResults = useMemo(() => {
    const returnIDs = Array.from(
      new Set(filteredBlueprintData.ids.slice(from, to))
    );
    const returnBps = filteredBlueprintData.blueprints.filter((row) =>
      returnIDs.includes(row.typeId)
    );

    return {
      ids: returnIDs,
      blueprints: returnBps,
    };
  }, [filteredBlueprintData, from, to]);

  // Handle page change
  const handlePageChange = (event, page) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
    });
    window.scrollTo(0, 0);
  };

  return (
    <>
      <>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <Grid container spacing={2} sx={{ width: "100%" }}>
            <Grid size={12}>
              <LibrarySearch />
            </Grid>
            <Grid size={12}>
              <ContentPanel
                componentName="Blueprint Library Results"
                paperSx={{ height: "auto", width: "100%" }}
                contentGridSx={{
                  overflow: "visible",
                  minHeight: "auto",
                  flex: "0 1 auto",
                }}
              >
                <Grid container spacing={2}>
                  {blueprintResults.ids.map((bpID) => {
                    if (enableCompactView) {
                      return (
                        <CompactBlueprintGroup
                          key={`compact-${bpID}`}
                          bpID={bpID}
                          blueprintResults={blueprintResults}
                          currentFilter={currentFilter}
                        />
                      );
                    }
                    return (
                      <ClassicBlueprintGroup
                        key={`classic-${bpID}`}
                        bpID={bpID}
                        blueprintResults={blueprintResults}
                      />
                    );
                  })}
                  <Grid
                    container
                    align="center"
                    size={12}
                    sx={{
                      justifyContent: "center",
                      marginTop: 4,
                      marginBottom: 1,
                    }}
                  >
                    <Pagination
                      color="primary"
                      size="small"
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                    />
                  </Grid>
                </Grid>
              </ContentPanel>
            </Grid>
          </Grid>
        </Box>
      </>
      <BlueprintArchiveDialogue />
    </>
  );
}
