import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "@mui/material";

import { ColumnHeaderRow } from "./tableParts";

const renderHeader = (columns) =>
  render(
    <Table>
      <ColumnHeaderRow columns={columns} />
    </Table>,
  );

describe("ColumnHeaderRow", () => {
  it("names the columns it is given, in order", () => {
    renderHeader([
      { id: "a", label: "Component" },
      { id: "b", label: "Total", align: "right" },
    ]);

    expect(
      screen.getAllByRole("columnheader").map((cell) => cell.textContent),
    ).toEqual(["Component", "Total"]);
  });

  it("takes the columns rather than fixing them", () => {
    // A panel shows a column only when it has something to put in it — the cost
    // table's comparison against a previous build appears only with history.
    renderHeader([{ id: "a", label: "Component" }]);

    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
  });

  it("aligns a column the way it asks to be aligned", () => {
    renderHeader([{ id: "a", label: "Total", align: "right" }]);

    expect(screen.getByRole("columnheader")).toHaveStyle({
      textAlign: "right",
    });
  });
});
