import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import InsetSurface from "./InsetSurface";

describe("InsetSurface", () => {
  it("holds what it is given", () => {
    render(<InsetSurface>An expanded row</InsetSurface>);

    expect(screen.getByText("An expanded row")).toBeInTheDocument();
  });

  it("recesses it, so a panel does not repeat the border and radius", () => {
    const { container } = render(<InsetSurface>x</InsetSurface>);

    expect(container.firstChild).toHaveStyle({ borderStyle: "solid" });
  });

  it("takes an sx override without losing its own", () => {
    const { container } = render(
      <InsetSurface sx={{ padding: "40px" }}>x</InsetSurface>,
    );

    expect(container.firstChild).toHaveStyle({ padding: "40px" });
    expect(container.firstChild).toHaveStyle({ borderStyle: "solid" });
  });
});
