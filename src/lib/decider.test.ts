import { describe, expect, it } from "vitest";

import {
  applyStoredOptionLabels,
  createDecisionResult,
  createDefaultOptions,
  getActiveOptions,
  parseStoredOptionLabels,
  pickRandomOption,
  serializeOptionLabels,
} from "@/lib/decider";

describe("decider helpers", () => {
  it("falls back to Kelly and Lee when labels are blank", () => {
    const options = applyStoredOptionLabels(createDefaultOptions(), ["   ", ""]);
    const activeOptions = getActiveOptions(options);

    expect(activeOptions[0].label).toBe("Kelly");
    expect(activeOptions[1].label).toBe("Lee");
  });

  it("round-trips custom labels for localStorage", () => {
    const options = applyStoredOptionLabels(createDefaultOptions(), ["Laundry", "Dishes"]);
    const stored = serializeOptionLabels(options);

    expect(parseStoredOptionLabels(stored)).toEqual(["Laundry", "Dishes"]);
  });

  it("ignores malformed stored labels", () => {
    expect(parseStoredOptionLabels(null)).toBeNull();
    expect(parseStoredOptionLabels("not json")).toBeNull();
    expect(parseStoredOptionLabels(JSON.stringify(["Only one"]))).toBeNull();
    expect(parseStoredOptionLabels(JSON.stringify(["One", 2]))).toBeNull();
  });

  it("uses secure random bits to pick only one of the two options", () => {
    expect(pickRandomOption(["Kelly", "Lee"], () => 0)).toBe("Kelly");
    expect(pickRandomOption(["Kelly", "Lee"], () => 1)).toBe("Lee");
    expect(pickRandomOption(["Kelly", "Lee"], () => 42)).toBe("Kelly");
    expect(pickRandomOption(["Kelly", "Lee"], () => 43)).toBe("Lee");
  });

  it("snapshots the winner label used for the completed round", () => {
    const result = createDecisionResult({
      id: "round-1",
      winnerLabel: "Trash duty",
      mode: "coin-flip",
      decidedAt: new Date("2026-06-05T18:00:00.000Z"),
    });

    expect(result).toMatchObject({
      id: "round-1",
      winnerLabel: "Trash duty",
      mode: "coin-flip",
      modeLabel: "Coin flip",
      decidedAt: "2026-06-05T18:00:00.000Z",
    });
  });
});
