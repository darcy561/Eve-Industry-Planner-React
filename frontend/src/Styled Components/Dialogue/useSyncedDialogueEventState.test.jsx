import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSyncedDialogueEventState } from "./useSyncedDialogueEventState";
import { eventEmitter } from "../../utils/EventSystem";

const EVENT = "syncedTestDialogue";

function initial() {
  return { isOpen: false, jobIDs: [] };
}

const serialize = (data) =>
  JSON.stringify({ isOpen: Boolean(data.isOpen), jobIDs: data.jobIDs ?? [] });

function emit(payload) {
  act(() => {
    eventEmitter.emit(EVENT, payload);
  });
}

function mount({ applyPayload, enabled = true, serializeWith = serialize }) {
  return renderHook(
    (props) =>
      useSyncedDialogueEventState(
        EVENT,
        initial,
        props?.serialize ?? serializeWith,
        props?.applyPayload ?? applyPayload,
        { enabled: props?.enabled ?? enabled },
      ),
    { initialProps: {} },
  );
}

afterEach(() => {
  eventEmitter.removeAllListeners();
});

describe("useSyncedDialogueEventState", () => {
  it("does not apply the snapshot it starts with", () => {
    const applyPayload = vi.fn();
    mount({ applyPayload });

    expect(applyPayload).not.toHaveBeenCalled();
  });

  it("applies a snapshot once it changes", () => {
    const applyPayload = vi.fn();
    mount({ applyPayload });

    emit({ isOpen: true, jobIDs: ["job-1"] });

    expect(applyPayload).toHaveBeenCalledTimes(1);
    expect(applyPayload.mock.calls[0][0]).toMatchObject({
      isOpen: true,
      jobIDs: ["job-1"],
    });
  });

  it("says nothing when an event leaves the snapshot the same", () => {
    const applyPayload = vi.fn();
    mount({ applyPayload });

    emit({ isOpen: true });
    emit({ isOpen: true });

    expect(applyPayload).toHaveBeenCalledTimes(1);
  });

  it("keeps quiet while it is switched off", () => {
    const applyPayload = vi.fn();
    mount({ applyPayload, enabled: false });

    emit({ isOpen: true });

    expect(applyPayload).not.toHaveBeenCalled();
  });

  it("hands back the state the dialogue reads", () => {
    const { result } = mount({ applyPayload: vi.fn() });

    emit({ isOpen: true, jobIDs: ["job-2"] });

    expect(result.current[0]).toMatchObject({
      isOpen: true,
      jobIDs: ["job-2"],
    });
  });

  // The callers build these two afresh every render, closing over the state
  // they are reading. Re-running the sync on a new identity would apply the
  // same snapshot again; reading a stale one would apply against state that has
  // since moved on.
  it("calls the version of applyPayload from the latest render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = mount({ applyPayload: first });

    rerender({ applyPayload: second });
    emit({ isOpen: true });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not apply anything merely because the callbacks were rebuilt", () => {
    const applyPayload = vi.fn();
    const { rerender } = mount({ applyPayload });

    emit({ isOpen: true });
    expect(applyPayload).toHaveBeenCalledTimes(1);

    rerender({ applyPayload, serialize: (data) => serialize(data) });
    rerender({ applyPayload, serialize: (data) => serialize(data) });

    expect(applyPayload).toHaveBeenCalledTimes(1);
  });
});
