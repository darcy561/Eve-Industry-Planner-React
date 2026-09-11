import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProportionBar } from "./ProportionBar";

describe("ProportionBar", () => {
  const parts = [
    { id: "materials", label: "Materials", value: 750 },
    { id: "install", label: "Install", value: 250 },
  ];

  it("sizes each part by its share of the total", () => {
    render(<ProportionBar parts={parts} />);

    expect(screen.getByTestId("proportion-materials")).toHaveStyle({
      width: "75%",
    });
    expect(screen.getByTestId("proportion-install")).toHaveStyle({
      width: "25%",
    });
  });

  it("leaves out a part that is nothing", () => {
    render(
      <ProportionBar
        parts={[...parts, { id: "extras", label: "Extras", value: 0 }]}
      />,
    );

    expect(screen.queryByTestId("proportion-extras")).toBeNull();
  });

  it("draws nothing at all when the total is nothing", () => {
    const { container } = render(
      <ProportionBar parts={[{ id: "a", label: "A", value: 0 }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("colours a part the way a chart series of the same meaning is coloured", () => {
    render(
      <ProportionBar
        parts={[{ id: "a", label: "A", value: 1, colour: "rgb(4, 5, 6)" }]}
      />,
    );

    expect(screen.getByTestId("proportion-a")).toHaveStyle({
      backgroundColor: "rgb(4, 5, 6)",
    });
  });

  it("names the parts where a panel asks it to", () => {
    render(<ProportionBar parts={parts} showLegend />);

    expect(screen.getByText("Materials")).toBeInTheDocument();
    expect(screen.getByText("Install")).toBeInTheDocument();
  });

  it("stays a bar alone by default", () => {
    render(<ProportionBar parts={parts} />);

    expect(screen.queryByText("Materials")).toBeNull();
  });
});
