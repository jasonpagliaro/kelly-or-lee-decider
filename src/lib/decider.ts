export type DecisionOptionId = "option-one" | "option-two";

export type DecisionOption = {
  id: DecisionOptionId;
  label: string;
  fallbackLabel: string;
};

export type RevealMode =
  | "coin-flip"
  | "card-deal"
  | "cloche"
  | "prize-wheel"
  | "dice-roll"
  | "sealed-envelope"
  | "drawing-straws"
  | "slot-machine"
  | "plinko"
  | "fortune-cookie";

export type RevealModeConfig = {
  id: RevealMode;
  label: string;
  durationMs: number;
};

export type DecisionResult = {
  id: string;
  winnerLabel: string;
  mode: RevealMode;
  modeLabel: string;
  decidedAt: string;
};

export const OPTION_STORAGE_KEY = "kelly-or-lee-decider.option-labels.v1";

export const REVEAL_MODES: readonly RevealModeConfig[] = [
  { id: "coin-flip", label: "Coin flip", durationMs: 1800 },
  { id: "card-deal", label: "Card deal", durationMs: 1800 },
  { id: "cloche", label: "Cloche", durationMs: 1700 },
  { id: "prize-wheel", label: "Prize wheel", durationMs: 2200 },
  { id: "dice-roll", label: "Dice roll", durationMs: 1700 },
  { id: "sealed-envelope", label: "Envelope", durationMs: 1800 },
  { id: "drawing-straws", label: "Straws", durationMs: 1700 },
  { id: "slot-machine", label: "Slot reels", durationMs: 2100 },
  { id: "plinko", label: "Plinko", durationMs: 2100 },
  { id: "fortune-cookie", label: "Fortune cookie", durationMs: 1900 },
];

export function createDefaultOptions(): [DecisionOption, DecisionOption] {
  return [
    { id: "option-one", label: "Kelly", fallbackLabel: "Kelly" },
    { id: "option-two", label: "Lee", fallbackLabel: "Lee" },
  ];
}

export function normalizeLabel(label: string, fallbackLabel: string): string {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : fallbackLabel;
}

export function getActiveOptions(
  options: readonly [DecisionOption, DecisionOption],
): [DecisionOption, DecisionOption] {
  return [
    {
      ...options[0],
      label: normalizeLabel(options[0].label, options[0].fallbackLabel),
    },
    {
      ...options[1],
      label: normalizeLabel(options[1].label, options[1].fallbackLabel),
    },
  ];
}

export function serializeOptionLabels(
  options: readonly [DecisionOption, DecisionOption],
): string {
  return JSON.stringify([options[0].label, options[1].label]);
}

export function parseStoredOptionLabels(rawValue: string | null): [string, string] | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string"
    ) {
      return [parsed[0], parsed[1]];
    }
  } catch {
    return null;
  }

  return null;
}

export function applyStoredOptionLabels(
  options: readonly [DecisionOption, DecisionOption],
  labels: readonly [string, string],
): [DecisionOption, DecisionOption] {
  return [
    { ...options[0], label: labels[0] },
    { ...options[1], label: labels[1] },
  ];
}

export function secureRandomUint32(): number {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure browser randomness is unavailable.");
  }

  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] ?? 0;
}

export function pickRandomOption<T>(
  options: readonly [T, T],
  nextUint32: () => number = secureRandomUint32,
): T {
  return options[nextUint32() & 1];
}

export function getRevealModeConfig(mode: RevealMode): RevealModeConfig {
  const config = REVEAL_MODES.find((item) => item.id === mode);

  if (!config) {
    throw new Error(`Unknown reveal mode: ${mode}`);
  }

  return config;
}

export function createDecisionResult({
  id,
  winnerLabel,
  mode,
  decidedAt = new Date(),
}: {
  id: string;
  winnerLabel: string;
  mode: RevealMode;
  decidedAt?: Date;
}): DecisionResult {
  return {
    id,
    winnerLabel,
    mode,
    modeLabel: getRevealModeConfig(mode).label,
    decidedAt: decidedAt.toISOString(),
  };
}
