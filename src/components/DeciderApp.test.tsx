import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeciderApp } from "@/components/DeciderApp";

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("DeciderApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("switches the selected show mode", () => {
    render(<DeciderApp />);

    expect(screen.getByTestId("show-stage")).toHaveAttribute("data-mode", "prize-wheel");

    fireEvent.click(screen.getByRole("radio", { name: "Slot reels" }));

    expect(screen.getByTestId("show-stage")).toHaveAttribute("data-mode", "slot-machine");
  });

  it("completes a reduced-motion reveal using the short duration", () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    render(<DeciderApp />);

    act(() => {
      vi.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getAllByText("In play").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByRole("button", { name: "Next round" })).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
