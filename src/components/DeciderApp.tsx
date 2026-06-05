"use client";

import { Play, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RevealCanvas, type RevealPhase } from "@/components/RevealCanvas";
import {
  OPTION_STORAGE_KEY,
  REVEAL_MODES,
  applyStoredOptionLabels,
  createDecisionResult,
  createDefaultOptions,
  getActiveOptions,
  getRevealModeConfig,
  parseStoredOptionLabels,
  pickRandomOption,
  serializeOptionLabels,
  type DecisionOption,
  type DecisionOptionId,
  type DecisionResult,
  type RevealMode,
} from "@/lib/decider";

const MAX_HISTORY_ITEMS = 25;

export function DeciderApp() {
  const [options, setOptions] = useState<[DecisionOption, DecisionOption]>(() =>
    createDefaultOptions(),
  );
  const [storageReady, setStorageReady] = useState(false);
  const [selectedMode, setSelectedMode] = useState<RevealMode>("coin-flip");
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [winnerLabel, setWinnerLabel] = useState<string | null>(null);
  const [history, setHistory] = useState<DecisionResult[]>([]);
  const [revealKey, setRevealKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const revealTimerRef = useRef<number | null>(null);

  const activeOptions = useMemo(() => getActiveOptions(options), [options]);
  const activeLabels = useMemo(
    () => [activeOptions[0].label, activeOptions[1].label] as [string, string],
    [activeOptions],
  );
  const selectedModeConfig = getRevealModeConfig(selectedMode);

  useEffect(() => {
    const loadStoredLabels = () => {
      const storedLabels = parseStoredOptionLabels(
        window.localStorage.getItem(OPTION_STORAGE_KEY),
      );

      if (storedLabels) {
        setOptions(applyStoredOptionLabels(createDefaultOptions(), storedLabels));
      }

      setStorageReady(true);
    };

    const timer = window.setTimeout(loadStoredLabels, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(OPTION_STORAGE_KEY, serializeOptionLabels(options));
  }, [options, storageReady]);

  useEffect(() => {
    return () => clearRevealTimer(revealTimerRef);
  }, []);

  const updateOptionLabel = (id: DecisionOptionId, label: string) => {
    if (phase === "revealing") {
      return;
    }

    setOptions(([first, second]) => [
      first.id === id ? { ...first, label } : first,
      second.id === id ? { ...second, label } : second,
    ]);
  };

  const resetNames = () => {
    if (phase === "revealing") {
      return;
    }

    setOptions(createDefaultOptions());
  };

  const resetRound = () => {
    clearRevealTimer(revealTimerRef);
    setWinnerLabel(null);
    setPhase("idle");
    setRevealKey((current) => current + 1);
  };

  const startReveal = () => {
    if (phase === "revealing") {
      return;
    }

    clearRevealTimer(revealTimerRef);
    const winner = pickRandomOption(activeLabels);
    const result = createDecisionResult({
      id: createRoundId(),
      winnerLabel: winner,
      mode: selectedMode,
      decidedAt: new Date(),
    });
    const duration = reducedMotion ? 250 : selectedModeConfig.durationMs;

    setWinnerLabel(winner);
    setPhase("revealing");
    setRevealKey((current) => current + 1);

    revealTimerRef.current = window.setTimeout(() => {
      setPhase("revealed");
      setHistory((items) => [result, ...items].slice(0, MAX_HISTORY_ITEMS));
      revealTimerRef.current = null;
    }, duration);
  };

  const handlePrimaryAction = () => {
    if (phase === "revealed") {
      resetRound();
      return;
    }

    startReveal();
  };

  const primaryLabel =
    phase === "revealing" ? "Revealing" : phase === "revealed" ? "Next round" : "Reveal";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Two names enter. One name leaves.</p>
          <h1>Kelly or Lee Decider</h1>
        </div>
        <div className="status-pill" aria-live="polite">
          <Sparkles aria-hidden="true" size={18} />
          <span>{selectedModeConfig.label}</span>
        </div>
      </header>

      <div className="workspace">
        <section className="control-panel" aria-labelledby="options-heading">
          <div className="section-heading">
            <h2 id="options-heading">Options</h2>
            <button
              className="icon-text-button"
              type="button"
              onClick={resetNames}
              disabled={phase === "revealing"}
            >
              <RotateCcw aria-hidden="true" size={17} />
              <span>Defaults</span>
            </button>
          </div>

          <div className="name-grid">
            {options.map((option, index) => (
              <label className="name-field" key={option.id}>
                <span>Option {index + 1}</span>
                <input
                  type="text"
                  value={option.label}
                  placeholder={option.fallbackLabel}
                  onChange={(event) => updateOptionLabel(option.id, event.target.value)}
                  disabled={phase === "revealing"}
                  maxLength={36}
                />
                <small>Blank uses {option.fallbackLabel}</small>
              </label>
            ))}
          </div>

          <div className="section-heading mode-heading">
            <h2>Reveal</h2>
          </div>

          <div className="mode-grid" role="radiogroup" aria-label="Reveal style">
            {REVEAL_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selectedMode === mode.id}
                className="mode-button"
                data-selected={selectedMode === mode.id}
                onClick={() => setSelectedMode(mode.id)}
                disabled={phase === "revealing"}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        <section className="stage-panel" aria-labelledby="stage-heading">
          <div className="section-heading">
            <h2 id="stage-heading">Decision Table</h2>
            <span className="name-matchup">
              {activeLabels[0]} <span>vs</span> {activeLabels[1]}
            </span>
          </div>

          <div className="canvas-frame">
            <RevealCanvas
              mode={selectedMode}
              phase={phase}
              optionLabels={activeLabels}
              winnerLabel={winnerLabel}
              revealKey={revealKey}
              reducedMotion={reducedMotion}
            />
          </div>

          <div className="result-row" aria-live="polite">
            <div>
              <span className="result-label">
                {phase === "idle" ? "Ready" : phase === "revealing" ? "In play" : "Result"}
              </span>
              <strong>
                {phase === "revealed" && winnerLabel
                  ? winnerLabel
                  : `${activeLabels[0]} or ${activeLabels[1]}`}
              </strong>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={handlePrimaryAction}
              disabled={phase === "revealing"}
            >
              {phase === "revealed" ? (
                <RotateCcw aria-hidden="true" size={20} />
              ) : (
                <Play aria-hidden="true" size={20} />
              )}
              <span>{primaryLabel}</span>
            </button>
          </div>
        </section>

        <section className="history-panel" aria-labelledby="history-heading">
          <div className="section-heading">
            <h2 id="history-heading">History</h2>
            <button
              className="icon-button"
              type="button"
              onClick={() => setHistory([])}
              disabled={history.length === 0}
              aria-label="Clear history"
              title="Clear history"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>

          {history.length === 0 ? (
            <p className="empty-history">No decisions yet.</p>
          ) : (
            <ol className="history-list">
              {history.map((item) => (
                <li key={item.id} className="history-item">
                  <strong>{item.winnerLabel}</strong>
                  <span>{item.modeLabel}</span>
                  <time dateTime={item.decidedAt}>{formatResultTime(item.decidedAt)}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

function clearRevealTimer(timerRef: React.MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function createRoundId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const values = new Uint32Array(2);
  globalThis.crypto?.getRandomValues(values);
  return `${Date.now()}-${values[0] ?? 0}-${values[1] ?? 0}`;
}

function formatResultTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}
