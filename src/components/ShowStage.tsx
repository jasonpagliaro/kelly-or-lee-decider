"use client";

import type { CSSProperties, ReactNode } from "react";

import { getRevealModeConfig, type RevealMode } from "@/lib/decider";

export type RevealPhase = "idle" | "revealing" | "revealed";

type ShowStageProps = {
  mode: RevealMode;
  phase: RevealPhase;
  optionLabels: readonly [string, string];
  winnerLabel: string | null;
  revealKey: number;
  reducedMotion: boolean;
};

type SceneProps = {
  optionLabels: readonly [string, string];
  winnerIndex: number;
  winnerLabel: string | null;
};

const SCENE_COPY: Record<RevealMode, { eyebrow: string; title: string }> = {
  "prize-wheel": { eyebrow: "Spin", title: "Prize Wheel" },
  "slot-machine": { eyebrow: "Jackpot", title: "Slot Reels" },
  "card-deal": { eyebrow: "Draw", title: "Card Draw" },
  "spotlight-reveal": { eyebrow: "Final cue", title: "Spotlight Reveal" },
};

export function ShowStage({
  mode,
  phase,
  optionLabels,
  winnerLabel,
  revealKey,
  reducedMotion,
}: ShowStageProps) {
  const modeConfig = getRevealModeConfig(mode);
  const winnerIndex = winnerLabel === optionLabels[1] ? 1 : 0;
  const sceneCopy = SCENE_COPY[mode];
  const stageStyle = {
    "--winner-index": winnerIndex,
    "--wheel-final": winnerIndex === 0 ? "0deg" : "180deg",
  } as CSSProperties;

  return (
    <div
      className="show-stage"
      data-mode={mode}
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-testid="show-stage"
      style={stageStyle}
      aria-label={`${modeConfig.label} decision reveal`}
    >
      <div className="show-stage__marquee" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="show-stage__screen" key={`${mode}-${revealKey}`}>
        <div className="show-stage__scene-heading">
          <span>{sceneCopy.eyebrow}</span>
          <strong>{sceneCopy.title}</strong>
        </div>
        {renderScene(mode, { optionLabels, winnerIndex, winnerLabel })}
      </div>
    </div>
  );
}

function renderScene(mode: RevealMode, props: SceneProps): ReactNode {
  switch (mode) {
    case "prize-wheel":
      return <PrizeWheelScene {...props} />;
    case "slot-machine":
      return <SlotReelsScene {...props} />;
    case "card-deal":
      return <CardDrawScene {...props} />;
    case "spotlight-reveal":
      return <SpotlightRevealScene {...props} />;
  }
}

function PrizeWheelScene({ optionLabels, winnerIndex }: SceneProps) {
  return (
    <div className="scene scene--wheel" data-winner-index={winnerIndex}>
      <div className="wheel-rig" aria-hidden="true">
        <div className="wheel-pointer" />
        <div className="wheel-disc">
          <svg viewBox="0 0 320 320" role="img" aria-label="Two section prize wheel">
            <defs>
              <linearGradient id="wheelGold" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffe8a5" />
                <stop offset="58%" stopColor="#f8bd42" />
                <stop offset="100%" stopColor="#d68a1f" />
              </linearGradient>
              <linearGradient id="wheelTeal" x1="1" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#9ce7de" />
                <stop offset="64%" stopColor="#39b5aa" />
                <stop offset="100%" stopColor="#127b76" />
              </linearGradient>
              <radialGradient id="wheelGlass" cx="35%" cy="25%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
                <stop offset="58%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <circle cx="160" cy="160" r="146" className="wheel-rim" />
            <path d="M160 160 L160 14 A146 146 0 0 1 160 306 Z" fill="url(#wheelGold)" />
            <path d="M160 160 L160 306 A146 146 0 0 1 160 14 Z" fill="url(#wheelTeal)" />
            <circle cx="160" cy="160" r="146" fill="url(#wheelGlass)" />
            <circle cx="160" cy="160" r="42" className="wheel-hub" />
            <circle cx="160" cy="160" r="12" className="wheel-hub-core" />
          </svg>
        </div>
        <span className="wheel-label wheel-label--one">{optionLabels[0]}</span>
        <span className="wheel-label wheel-label--two">{optionLabels[1]}</span>
      </div>
      <OptionRail optionLabels={optionLabels} winnerIndex={winnerIndex} />
    </div>
  );
}

function SlotReelsScene({ optionLabels, winnerIndex, winnerLabel }: SceneProps) {
  const finalLabel = winnerLabel ?? optionLabels[winnerIndex];
  const reelLabels = [optionLabels[0], optionLabels[1], optionLabels[0], optionLabels[1], finalLabel];

  return (
    <div className="scene scene--slots" data-winner-index={winnerIndex}>
      <div className="slot-cabinet" aria-hidden="true">
        <div className="slot-cabinet__top">
          <span>JACKPOT</span>
          <strong>DECIDER</strong>
        </div>
        <div className="slot-window">
          {Array.from({ length: 3 }, (_, reelIndex) => (
            <div className="slot-reel" key={reelIndex}>
              <div className="slot-strip" style={{ "--reel-delay": `${reelIndex * 120}ms` } as CSSProperties}>
                {reelLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="slot-lever">
          <span />
        </div>
      </div>
      <OptionRail optionLabels={optionLabels} winnerIndex={winnerIndex} />
    </div>
  );
}

function CardDrawScene({ optionLabels, winnerIndex }: SceneProps) {
  return (
    <div className="scene scene--cards" data-winner-index={winnerIndex}>
      <div className="card-table" aria-hidden="true">
        {optionLabels.map((label, index) => (
          <div
            className={[
              "show-card",
              index === 0 ? "show-card--left" : "show-card--right",
              index === winnerIndex ? "is-winner" : "is-runner-up",
            ].join(" ")}
            key={`${label}-${index}`}
          >
            <div className="show-card__shine" />
            <span className="show-card__corner">{index + 1}</span>
            <strong>{label}</strong>
            <span className="show-card__suit">{index === 0 ? "K" : "L"}</span>
          </div>
        ))}
      </div>
      <OptionRail optionLabels={optionLabels} winnerIndex={winnerIndex} />
    </div>
  );
}

function SpotlightRevealScene({ optionLabels, winnerIndex, winnerLabel }: SceneProps) {
  return (
    <div className="scene scene--spotlight" data-winner-index={winnerIndex}>
      <div className="spotlight-set" aria-hidden="true">
        <div className="spotlight-beam spotlight-beam--left" />
        <div className="spotlight-beam spotlight-beam--right" />
        <div className="spotlight-curtain spotlight-curtain--left" />
        <div className="spotlight-curtain spotlight-curtain--right" />
        <div className="spotlight-nameplate">
          <span>Tonight&apos;s pick</span>
          <strong>{winnerLabel ?? "Awaiting cue"}</strong>
        </div>
        <div className="podium-row">
          {optionLabels.map((label, index) => (
            <div
              className={["podium", index === winnerIndex ? "is-winner" : "is-runner-up"].join(" ")}
              key={`${label}-${index}`}
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </div>
      <OptionRail optionLabels={optionLabels} winnerIndex={winnerIndex} />
    </div>
  );
}

function OptionRail({
  optionLabels,
  winnerIndex,
}: {
  optionLabels: readonly [string, string];
  winnerIndex: number;
}) {
  return (
    <div className="option-rail">
      {optionLabels.map((label, index) => (
        <span
          className={["option-chip", index === winnerIndex ? "is-winner" : "is-runner-up"].join(" ")}
          key={`${label}-${index}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
