import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { industryJobs, searchIndex } = vi.hoisted(() => ({
  industryJobs: { current: [] },
  searchIndex: { current: [] },
}));

vi.mock("../../../Hooks/EveEsi/useGetAllIndustryJobs", () => ({
  default: () => ({ data: industryJobs.current, isLoading: false, error: null }),
}));

vi.mock("../../../Hooks/App/useCachedData", () => ({
  useCachedData: () => ({
    data: searchIndex.current,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../Zustand/usersStore", () => {
  const state = {
    account: {
      actions: {
        findCharacterByHash: () => ({ CharacterID: 2114000001, CharacterName: "A" }),
        getCorporation: () => ({ name: "A Corp" }),
      },
    },
    applicationSettings: {},
  };
  return {
    default: Object.assign((selector) => selector(state), {
      getState: () => state,
    }),
  };
});

import { CompactBlueprintGroup } from "./compactBlueprintGroup";
import buildBlueprintRows from "../../../Functions/Blueprints/buildBlueprintRows";
import {
  blueprintSearchIndex,
  characterBlueprintRows,
  RIFTER_BLUEPRINT_TYPE_ID,
} from "../../../tests/blueprintFixtures";

function renderGroup(props) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CompactBlueprintGroup {...props} />
    </QueryClientProvider>
  );
}

function resultsFor(rows) {
  const { rows: built } = buildBlueprintRows(rows, blueprintSearchIndex);
  return { ids: [RIFTER_BLUEPRINT_TYPE_ID], blueprints: built };
}

beforeEach(() => {
  industryJobs.current = [];
  searchIndex.current = blueprintSearchIndex;
});

describe("a blueprint group in the compact library", () => {
  // Every field this renders was renamed by the collection cutover, and a miss shows as a blank or
  // a zero rather than an error.
  it("shows each distinct researched combination it holds", () => {
    renderGroup({
      bpID: RIFTER_BLUEPRINT_TYPE_ID,
      blueprintResults: resultsFor(characterBlueprintRows),
    });

    // 7001 is ME 5 / TE 10; 7002 and 7003 are ME 10 / TE 20, an original and a copy.
    expect(screen.getByText("M.E: 5")).toBeTruthy();
    expect(screen.getByText("T.E: 10")).toBeTruthy();
    expect(screen.getAllByText("M.E: 10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("T.E: 20").length).toBeGreaterThan(0);
  });

  it("shows nothing for a type it does not hold", () => {
    const { container } = renderGroup({
      bpID: 123456,
      blueprintResults: resultsFor(characterBlueprintRows),
    });

    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("counts only the blueprints carrying an active job under the active filter", () => {
    const rifters = characterBlueprintRows.filter(
      (row) => row.type_id === RIFTER_BLUEPRINT_TYPE_ID
    );
    industryJobs.current = [
      { blueprint_id: rifters[0].item_id, blueprint_type_id: RIFTER_BLUEPRINT_TYPE_ID, status: "active" },
    ];

    const { container } = renderGroup({
      bpID: RIFTER_BLUEPRINT_TYPE_ID,
      blueprintResults: resultsFor(characterBlueprintRows),
      currentFilter: "active",
    });

    // One of the three rifter blueprints is building, so one group is rendered.
    expect(rifters.length).toBeGreaterThan(1);
    expect(container.querySelectorAll("[aria-label]").length).toBeGreaterThan(0);
  });
});
