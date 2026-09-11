import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FirstLoginSetupSection } from "./FirstLoginSetupSection";

describe("FirstLoginSetupSection", () => {
  it("titles the section and holds its content", () => {
    render(
      <FirstLoginSetupSection title="Your characters" subtitle="Add more later">
        <p>content</p>
      </FirstLoginSetupSection>,
    );

    expect(screen.getByText("Your characters")).toBeInTheDocument();
    expect(screen.getByText("Add more later")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("titles it the way every other app-shell panel does", () => {
    // Onboarding used a primary-coloured h6 here, so the first screens a player
    // saw looked unlike the app they were being set up for.
    render(
      <FirstLoginSetupSection title="Your characters">
        x
      </FirstLoginSetupSection>,
    );

    const title = screen.getByText("Your characters");
    expect(title.tagName).not.toBe("H6");
    expect(title.className).toMatch(/colorTextSecondary|MuiTypography/);
  });

  it("does without a subtitle", () => {
    render(
      <FirstLoginSetupSection title="Your characters">
        x
      </FirstLoginSetupSection>,
    );

    expect(screen.getByText("x")).toBeInTheDocument();
  });
});

describe("spacing between a step's children", () => {
  it("spaces the several siblings a step passes it", () => {
    // Every step passes more than one child and relied on the section to space
    // them; rendering one child cannot see that.
    const { container } = render(
      <FirstLoginSetupSection title="Your characters">
        <p>first</p>
        <p>second</p>
        <p>third</p>
      </FirstLoginSetupSection>,
    );

    const stack = container.querySelector(".MuiStack-root");
    expect(stack).not.toBeNull();
    expect(stack.children).toHaveLength(3);
  });

  it("spaces the subtitle from the content below it", () => {
    const { container } = render(
      <FirstLoginSetupSection title="Your characters" subtitle="Add more later">
        <p>content</p>
      </FirstLoginSetupSection>,
    );

    expect(container.querySelector(".MuiStack-root").children).toHaveLength(2);
  });
});
