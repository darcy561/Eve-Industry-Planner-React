import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDialogueEventState } from "./useDialogueEventState";
import { eventEmitter } from "../../utils/EventSystem";

const EVENT = "testDialogue";

function initial() {
  return { isOpen: false, jobIDs: [], note: null };
}

function emit(payload, eventName = EVENT) {
  act(() => {
    eventEmitter.emit(eventName, payload);
  });
}

afterEach(() => {
  eventEmitter.removeAllListeners();
});

describe("useDialogueEventState", () => {
  it("starts at whatever the factory says", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    expect(result.current[0]).toEqual(initial());
  });

  it("merges what an event carries into the state it holds", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ isOpen: true, jobIDs: ["job-1"] });

    expect(result.current[0]).toEqual({
      isOpen: true,
      jobIDs: ["job-1"],
      note: null,
    });
  });

  it("leaves a field alone when the event says nothing about it", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ isOpen: true, jobIDs: ["job-1"] });
    emit({ isOpen: false });

    expect(result.current[0].jobIDs).toEqual(["job-1"]);
  });

  it("takes an explicit null as something to clear", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ note: "hello" });
    emit({ note: null });

    expect(result.current[0].note).toBeNull();
  });

  it("ignores an event carrying nothing", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ isOpen: true });
    emit(undefined);

    expect(result.current[0].isOpen).toBe(true);
  });

  it("goes back to the factory's answer when reset", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ isOpen: true, jobIDs: ["job-1"], note: "hello" });
    act(() => result.current[2]());

    expect(result.current[0]).toEqual(initial());
  });

  it("hands back a fresh object each reset, not the one it started with", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    act(() => result.current[2]());
    const first = result.current[0];
    act(() => result.current[2]());

    expect(result.current[0]).not.toBe(first);
    expect(result.current[0]).toEqual(initial());
  });

  it("stops listening once it goes", () => {
    const { unmount } = renderHook(() => useDialogueEventState(EVENT, initial));

    expect(eventEmitter.listenerCount(EVENT)).toBe(1);
    unmount();

    expect(eventEmitter.listenerCount(EVENT)).toBe(0);
  });

  it("asks the factory once however often it renders", () => {
    const factory = vi.fn(initial);
    const { rerender } = renderHook(() =>
      useDialogueEventState(EVENT, factory),
    );

    rerender();
    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("hears the event it was given rather than another", () => {
    const { result } = renderHook(() => useDialogueEventState(EVENT, initial));

    emit({ isOpen: true }, "someOtherDialogue");

    expect(result.current[0].isOpen).toBe(false);
  });
});
