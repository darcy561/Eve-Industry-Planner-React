import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const { built } = vi.hoisted(() => ({
  built: { addItem: 0, addGroup: 0, groupSettings: 0 },
}));

/** Stands in for the watchlist itself, which is tested separately; it only has
 * to offer the two ways of opening a dialogue from a row. */
vi.mock("./itemWatchContainer", () => ({
  WatchlistContainer: ({ onEditWatchlistItem, onOpenGroupSettings }) => (
    <>
      <button onClick={() => onEditWatchlistItem(3)}>
        edit the third item
      </button>
      <button onClick={() => onOpenGroupSettings({ id: 7, name: "Minerals" })}>
        open group settings
      </button>
    </>
  ),
}));

/** Each stand-in counts its renders, so a dialogue that is merely hidden is not
 * mistaken for one that was never built. */
vi.mock("./AddItemDialogue/dialogueFrame", () => ({
  AddWatchItemDialogue: ({ watchlistItemToEdit, onClose }) => {
    built.addItem += 1;
    return (
      <button onClick={onClose}>
        watch item dialogue for {String(watchlistItemToEdit)}
      </button>
    );
  },
}));

vi.mock("./addGroupDialogue", () => ({
  AddGroupDialogue: ({ onClose }) => {
    built.addGroup += 1;
    return <button onClick={onClose}>add group dialogue</button>;
  },
}));

vi.mock("./groupSettings", () => ({
  GroupSettingsDialogue: ({ groupSettingsContent, onClose }) => {
    built.groupSettings += 1;
    return (
      <button onClick={onClose}>
        group settings for {groupSettingsContent.name}
      </button>
    );
  },
}));

const { ItemWatchPanel } = await import("./ItemWatchPanel.jsx");

const theme = createTheme();

function show() {
  return render(
    <ThemeProvider theme={theme}>
      <ItemWatchPanel />
    </ThemeProvider>,
  );
}

function press(name) {
  fireEvent.click(screen.getByRole("button", { name }));
}

/** The two header controls carry icons rather than names. */
function headerButton(icon) {
  return screen.getByTestId(icon).closest("button");
}

beforeEach(() => {
  built.addItem = 0;
  built.addGroup = 0;
  built.groupSettings = 0;
});

describe("the item watchlist panel's dialogues", () => {
  it("builds none of them until one is asked for", () => {
    show();

    expect(built).toEqual({ addItem: 0, addGroup: 0, groupSettings: 0 });
  });

  it("opens an empty watch item dialogue from the header", () => {
    show();

    fireEvent.click(headerButton("AddIcon"));

    expect(
      screen.getByText(/watch item dialogue for null/),
    ).toBeInTheDocument();
  });

  it("opens the new group dialogue from the header", () => {
    show();

    fireEvent.click(headerButton("PlaylistAddIcon"));

    expect(screen.getByText("add group dialogue")).toBeInTheDocument();
  });

  it("opens the watch item dialogue on the item that was chosen", () => {
    show();

    press("edit the third item");

    expect(screen.getByText(/watch item dialogue for 3/)).toBeInTheDocument();
  });

  it("opens group settings on the group that was chosen", () => {
    show();

    press("open group settings");

    expect(screen.getByText(/group settings for Minerals/)).toBeInTheDocument();
  });

  it("takes a dialogue away again when it closes", () => {
    show();
    press("edit the third item");

    press(/watch item dialogue for 3/);

    expect(screen.queryByText(/watch item dialogue/)).toBeNull();
  });

  // A second edit must start from the item chosen that time, which is what
  // mounting it afresh gives.
  it("forgets the last item once it has been closed", () => {
    show();
    press("edit the third item");
    press(/watch item dialogue for 3/);

    fireEvent.click(headerButton("AddIcon"));

    expect(
      screen.getByText(/watch item dialogue for null/),
    ).toBeInTheDocument();
  });
});
