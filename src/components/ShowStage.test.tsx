import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShowStage } from "@/components/ShowStage";
import { REVEAL_MODES, type RevealMode } from "@/lib/decider";

const optionLabels = ["Kelly", "Lee"] as const;

function renderStage(mode: RevealMode, winnerLabel: string | null = null) {
  return render(
    <ShowStage
      mode={mode}
      phase={winnerLabel ? "revealed" : "idle"}
      optionLabels={optionLabels}
      winnerLabel={winnerLabel}
      revealKey={0}
      reducedMotion={false}
    />,
  );
}

describe("ShowStage", () => {
  it("renders both option labels for every curated reveal mode", () => {
    for (const mode of REVEAL_MODES) {
      const { unmount } = renderStage(mode.id);

      expect(screen.getByTestId("show-stage")).toHaveAttribute("data-mode", mode.id);
      expect(screen.getAllByText("Kelly").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Lee").length).toBeGreaterThan(0);

      unmount();
    }
  });

  it("changes the visible stage treatment when the mode changes", () => {
    const { rerender } = render(
      <ShowStage
        mode="prize-wheel"
        phase="idle"
        optionLabels={optionLabels}
        winnerLabel={null}
        revealKey={0}
        reducedMotion={false}
      />,
    );

    expect(screen.getByText("Prize Wheel")).toBeInTheDocument();

    rerender(
      <ShowStage
        mode="slot-machine"
        phase="idle"
        optionLabels={optionLabels}
        winnerLabel={null}
        revealKey={1}
        reducedMotion={false}
      />,
    );

    expect(screen.getByTestId("show-stage")).toHaveAttribute("data-mode", "slot-machine");
    expect(screen.getByText("Slot Reels")).toBeInTheDocument();
  });

  it("shows the winner in the revealed state", () => {
    renderStage("spotlight-reveal", "Lee");

    expect(screen.getByTestId("show-stage")).toHaveAttribute("data-phase", "revealed");
    expect(screen.getAllByText("Lee").length).toBeGreaterThan(0);
  });
});
