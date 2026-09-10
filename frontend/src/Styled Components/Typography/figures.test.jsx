import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  BandCaption,
  FIGURE_TONE,
  Figure,
  FigureCaption,
  FigureRow,
  HeadlineStat,
  PanelFooterMeta,
  SignedPercent,
  StatTile,
  figureToneColour,
  totalRowSx,
} from "./figures";

describe("Figure", () => {
  it("shows the value it was given", () => {
    render(<Figure>1,234</Figure>);

    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("says there is nothing rather than showing a gap", () => {
    // A blank cell reads as a missing render; a dash reads as a known absence.
    for (const absent of [null, undefined, ""]) {
      const { unmount } = render(<Figure>{absent}</Figure>);
      expect(screen.getByText("—")).toBeInTheDocument();
      unmount();
    }
  });

  it("does not treat a zero as absent", () => {
    render(<Figure>{0}</Figure>);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("lines its digits up with the figures around it", () => {
    render(<Figure>12</Figure>);

    expect(screen.getByText("12")).toHaveStyle({
      fontVariantNumeric: "tabular-nums",
    });
  });
});

describe("SignedPercent", () => {
  it("takes a fraction and states a percentage", () => {
    render(<SignedPercent value={-0.083} />);

    expect(screen.getByText("−8.3%")).toBeInTheDocument();
  });

  it("signs a rise", () => {
    render(<SignedPercent value={0.104} />);

    expect(screen.getByText("+10.4%")).toBeInTheDocument();
  });

  it("has nothing to say without a value", () => {
    render(<SignedPercent value={null} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("has nothing to say about a value that is not a number", () => {
    render(<SignedPercent value={Number.NaN} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("rounds to the places asked for", () => {
    render(<SignedPercent value={-0.08349} places={2} />);

    expect(screen.getByText("−8.35%")).toBeInTheDocument();
  });
});

describe("FigureRow", () => {
  it("states a label and its figure", () => {
    render(<FigureRow label="Materials" value="468,200,000" />);

    expect(screen.getByText("Materials")).toBeInTheDocument();
    expect(screen.getByText("468,200,000")).toBeInTheDocument();
  });

  it("carries a sub-label under the label", () => {
    render(<FigureRow label="Materials" sublabel="16 items" value="1" />);

    expect(screen.getByText("16 items")).toBeInTheDocument();
  });

  it("shows a dash for a row with no figure yet", () => {
    render(<FigureRow label="Sales tax" value={null} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("PanelFooterMeta", () => {
  it("states what a panel holds and its total", () => {
    render(<PanelFooterMeta value="214,800 m³">16 materials</PanelFooterMeta>);

    expect(screen.getByText("16 materials")).toBeInTheDocument();
    expect(screen.getByText("214,800 m³")).toBeInTheDocument();
  });

  it("omits the total side when there is none", () => {
    const { container } = render(<PanelFooterMeta>16 materials</PanelFooterMeta>);

    expect(container.querySelectorAll("span, p")).toHaveLength(1);
  });
});

describe("FigureRow, the shapes a breakdown is made of", () => {
  it("colours the value by the tone it is given", () => {
    render(<FigureRow label="Saving" value="12,000" tone={FIGURE_TONE.GOOD} />);

    expect(screen.getByText("12,000")).toHaveStyle({
      color: "rgb(46, 125, 50)",
    });
  });

  it("rules a total above rather than below, so it closes a block", () => {
    const total = render(<FigureRow label="Total" value="1" isTotal />);
    expect(total.container.firstChild).toHaveStyle({ borderTopStyle: "solid" });
    total.unmount();

    const ordinary = render(<FigureRow label="Materials" value="1" />);
    expect(ordinary.container.firstChild).toHaveStyle({
      borderBottomStyle: "solid",
    });
  });

  it("carries a marker before the label", () => {
    render(
      <FigureRow label="Materials" value="1" marker={<span>swatch</span>} />
    );

    expect(screen.getByText("swatch")).toBeInTheDocument();
  });
});

describe("FigureCaption", () => {
  it("names a figure quietly and in caps", () => {
    render(<FigureCaption>Cost per unit</FigureCaption>);

    expect(screen.getByText("Cost per unit")).toHaveStyle({
      textTransform: "uppercase",
    });
  });
});

describe("HeadlineStat", () => {
  it("states what the figure is, then the figure", () => {
    render(<HeadlineStat caption="Net return" value="143,400,000" />);

    expect(screen.getByText("Net return")).toBeInTheDocument();
    expect(screen.getByText("143,400,000")).toBeInTheDocument();
  });

  it("shows a dash when the figure is not known yet", () => {
    render(<HeadlineStat caption="Net return" value={null} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("carries context under the figure", () => {
    render(
      <HeadlineStat caption="Net return" value="1">
        <span>per unit</span>
      </HeadlineStat>
    );

    expect(screen.getByText("per unit")).toBeInTheDocument();
  });
});

describe("StatTile", () => {
  it("states a measure, its figure and what it was before", () => {
    render(
      <StatTile
        label="Amount Spent"
        value="1,160.00"
        change="+12.4%"
        comparison="Last month: 1,080.00"
      />
    );

    expect(screen.getByText("Amount Spent")).toBeInTheDocument();
    expect(screen.getByText("1,160.00")).toBeInTheDocument();
    expect(screen.getByText("+12.4%")).toBeInTheDocument();
    expect(screen.getByText("Last month: 1,080.00")).toBeInTheDocument();
  });

  it("shows its shape rather than zeroes while the figures load", () => {
    // A tile of zeroes reads as a real month with no activity.
    const { container } = render(
      <StatTile label="Amount Spent" value="0.00" isLoading />
    );

    expect(screen.queryByText("0.00")).toBeNull();
    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBe(3);
  });

  it("leaves out a change and a comparison it was not given", () => {
    render(<StatTile label="Amount Spent" value="1,160.00" />);

    expect(screen.getByText("1,160.00")).toBeInTheDocument();
    expect(screen.queryByText(/Last month/)).toBeNull();
  });
});

describe("figureToneColour", () => {
  it("gives a tone's colour to things that are not figures", () => {
    expect(figureToneColour(FIGURE_TONE.GOOD)).toBe("success.main");
    expect(figureToneColour(FIGURE_TONE.BAD)).toBe("error.main");
  });

  it("falls back rather than returning nothing for an unknown tone", () => {
    expect(figureToneColour("nonsense")).toBe("text.primary");
  });
});

describe("BandCaption", () => {
  it("names a group of rows", () => {
    render(<BandCaption>Cost to sell</BandCaption>);

    expect(screen.getByText("Cost to sell")).toBeInTheDocument();
  });

  it("does without a table, so a stacked panel uses the same one", () => {
    // BandRow wraps this for its table; nothing here requires one.
    const { container } = render(<BandCaption>Required to build</BandCaption>);

    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByText("Required to build")).toBeInTheDocument();
  });
});

describe("totalRowSx", () => {
  it("rules a total above rather than below", () => {
    // One decision about what a total looks like, read by a flex row and a
    // table cell alike.
    expect(totalRowSx).toMatchObject({ borderTop: 1, borderColor: "divider" });
    expect(totalRowSx).not.toHaveProperty("borderBottom");
  });
});
