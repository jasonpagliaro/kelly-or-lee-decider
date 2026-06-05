"use client";

import { useEffect, useRef } from "react";

import { getRevealModeConfig, type RevealMode } from "@/lib/decider";

export type RevealPhase = "idle" | "revealing" | "revealed";

type RevealCanvasProps = {
  mode: RevealMode;
  phase: RevealPhase;
  optionLabels: readonly [string, string];
  winnerLabel: string | null;
  revealKey: number;
  reducedMotion: boolean;
};

type DrawArgs = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  mode: RevealMode;
  phase: RevealPhase;
  progress: number;
  optionLabels: readonly [string, string];
  winnerLabel: string | null;
};

export function RevealCanvas({
  mode,
  phase,
  optionLabels,
  winnerLabel,
  revealKey,
  reducedMotion,
}: RevealCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    let disposed = false;
    const startedAt = performance.now();
    const configuredDuration = getRevealModeConfig(mode).durationMs;
    const duration = reducedMotion ? 1 : configuredDuration;

    const draw = (now: number) => {
      const width = Math.max(320, canvas.clientWidth || 720);
      const height = Math.max(280, canvas.clientHeight || 420);
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const progress =
        phase === "revealing"
          ? Math.min(1, (now - startedAt) / duration)
          : phase === "revealed"
            ? 1
            : 0;

      drawScene({
        context,
        width,
        height,
        mode,
        phase,
        progress,
        optionLabels,
        winnerLabel,
      });

      if (!disposed && phase === "revealing" && progress < 1) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    draw(performance.now());

    const resizeObserver = new ResizeObserver(() => draw(performance.now()));
    resizeObserver.observe(canvas);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [mode, optionLabels, phase, reducedMotion, revealKey, winnerLabel]);

  return <canvas ref={canvasRef} className="reveal-canvas" aria-label="Decision reveal" />;
}

function drawScene(args: DrawArgs) {
  const { context, width, height, mode, phase, progress, optionLabels, winnerLabel } = args;
  const eased = easeOutCubic(progress);
  const winnerIndex = winnerLabel === optionLabels[1] ? 1 : 0;

  drawBackdrop(context, width, height);

  switch (mode) {
    case "coin-flip":
      drawCoinFlip(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "card-deal":
      drawCardDeal(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "cloche":
      drawCloche(context, width, height, eased, phase, optionLabels, winnerLabel);
      break;
    case "prize-wheel":
      drawPrizeWheel(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "dice-roll":
      drawDiceRoll(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "sealed-envelope":
      drawEnvelope(context, width, height, eased, phase, optionLabels, winnerLabel);
      break;
    case "drawing-straws":
      drawStraws(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "slot-machine":
      drawSlotMachine(context, width, height, eased, phase, optionLabels, winnerLabel);
      break;
    case "plinko":
      drawPlinko(context, width, height, eased, phase, optionLabels, winnerLabel, winnerIndex);
      break;
    case "fortune-cookie":
      drawFortuneCookie(context, width, height, eased, phase, optionLabels, winnerLabel);
      break;
  }

  if (phase === "revealed" && winnerLabel) {
    drawWinnerBanner(context, width, height, winnerLabel);
  } else if (phase === "idle") {
    drawReadyBanner(context, width, height, optionLabels);
  }
}

function drawBackdrop(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#0f4b3b";
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = "#f8f2d8";
  context.lineWidth = 1;

  for (let x = -height; x < width; x += 38) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + height, height);
    context.stroke();
  }

  context.globalAlpha = 0.08;
  context.strokeStyle = "#ffb347";

  for (let x = 0; x < width + height; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - height, height);
    context.stroke();
  }

  context.restore();
}

function drawCoinFlip(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
  winnerIndex: number,
) {
  const centerX = width / 2;
  const centerY = height / 2 - 8;
  const radius = Math.min(width, height) * 0.2;
  const wobble = phase === "revealing" ? Math.sin(progress * Math.PI * 10) : 0;
  const flipScale = phase === "revealing" ? Math.max(0.1, Math.abs(Math.cos(progress * Math.PI * 9))) : 1;
  const visibleLabel =
    phase === "revealed" && winnerLabel
      ? winnerLabel
      : optionLabels[Math.abs(Math.floor(progress * 10)) % 2];

  context.save();
  context.translate(centerX, centerY - Math.sin(progress * Math.PI) * 72);
  context.scale(flipScale, 1 + wobble * 0.04);
  context.fillStyle = winnerIndex === 0 ? "#ffce57" : "#ff8a65";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(255,255,255,0.32)";
  context.beginPath();
  context.arc(-radius * 0.28, -radius * 0.28, radius * 0.36, 0, Math.PI * 2);
  context.fill();
  drawFittedText(context, visibleLabel, 0, 7, radius * 1.35, 28, "#1a1f1b", "800");
  context.restore();

  drawTableShadow(context, centerX, centerY + radius + 70, radius * 1.6, 18);
}

function drawCardDeal(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
  winnerIndex: number,
) {
  const cardWidth = Math.min(190, width * 0.28);
  const cardHeight = cardWidth * 1.32;
  const centerX = width / 2;
  const centerY = height / 2 + 8;

  drawCard(context, centerX - cardWidth * 0.78, centerY + 12, cardWidth, cardHeight, optionLabels[0], "#fff8dc", "#2a8c7b", false);
  drawCard(context, centerX + cardWidth * 0.78, centerY + 12, cardWidth, cardHeight, optionLabels[1], "#fff8dc", "#f06449", false);

  const travelX = (winnerIndex === 0 ? -1 : 1) * cardWidth * 0.78 * (1 - progress);
  const lift = Math.sin(progress * Math.PI) * 70;
  const scaleX = phase === "revealing" ? Math.max(0.12, Math.abs(Math.cos(progress * Math.PI * 2))) : 1;
  const label = phase === "revealed" && winnerLabel ? winnerLabel : optionLabels[winnerIndex];

  context.save();
  context.translate(centerX + travelX, centerY - lift);
  context.rotate((winnerIndex === 0 ? -1 : 1) * (1 - progress) * 0.28);
  context.scale(scaleX, 1);
  drawCard(context, 0, 0, cardWidth * 1.06, cardHeight * 1.06, label, "#fffdf4", "#ffce57", true);
  context.restore();
}

function drawCloche(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
) {
  const centerX = width / 2;
  const centerY = height / 2 + 70;
  const plateWidth = Math.min(width * 0.52, 360);

  drawTableShadow(context, centerX, centerY + 30, plateWidth * 0.7, 16);
  context.fillStyle = "#f9f0c7";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(centerX, centerY, plateWidth / 2, 34, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (winnerLabel && progress > 0.3) {
    drawFittedText(context, winnerLabel, centerX, centerY + 10, plateWidth * 0.72, 34, "#1a1f1b", "900");
  } else {
    drawFittedText(context, `${optionLabels[0]} / ${optionLabels[1]}`, centerX, centerY + 10, plateWidth * 0.72, 24, "#1a1f1b", "800");
  }

  const coverLift = phase === "idle" ? 0 : progress * 145;
  const coverY = centerY - 74 - coverLift;

  context.fillStyle = "#d8e5e0";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(centerX - plateWidth * 0.42, coverY + 70);
  context.quadraticCurveTo(centerX, coverY - 92, centerX + plateWidth * 0.42, coverY + 70);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#ffce57";
  context.strokeStyle = "#1a1f1b";
  context.beginPath();
  context.arc(centerX, coverY - 16, 20, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawPrizeWheel(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  _winnerLabel: string | null,
  winnerIndex: number,
) {
  const centerX = width / 2;
  const centerY = height / 2 + 18;
  const radius = Math.min(width, height) * 0.28;
  const finalAngle = winnerIndex === 0 ? Math.PI * 0.5 : Math.PI * 1.5;
  const angle = phase === "revealing" ? progress * Math.PI * 10 + finalAngle * progress : finalAngle;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  drawWheelSegment(context, radius, 0, Math.PI, "#ffce57", optionLabels[0]);
  drawWheelSegment(context, radius, Math.PI, Math.PI * 2, "#6bd1c6", optionLabels[1]);
  context.restore();

  context.fillStyle = "#f06449";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(centerX, centerY - radius - 8);
  context.lineTo(centerX - 18, centerY - radius - 42);
  context.lineTo(centerX + 18, centerY - radius - 42);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#1a1f1b";
  context.beginPath();
  context.arc(centerX, centerY, 18, 0, Math.PI * 2);
  context.fill();

}

function drawDiceRoll(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
  winnerIndex: number,
) {
  const size = Math.min(width, height) * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;
  const roll = phase === "revealing" ? progress * Math.PI * 5 : 0;
  const visibleIndex = phase === "revealed" ? winnerIndex : Math.abs(Math.floor(progress * 12)) % 2;
  const pips = visibleIndex === 0 ? 1 : 2;

  context.save();
  context.translate(centerX, centerY - Math.sin(progress * Math.PI) * 42);
  context.rotate(roll);
  drawRoundedRect(context, -size / 2, -size / 2, size, size, 18, "#fffdf4", "#1a1f1b", 5);
  drawPips(context, pips, size);
  context.restore();

  drawTableShadow(context, centerX, centerY + size * 0.7, size * 0.9, 14);

  const label = phase === "revealed" && winnerLabel ? winnerLabel : optionLabels[visibleIndex];
  drawFittedText(context, label, centerX, centerY + size * 0.78 + 44, width * 0.62, 26, "#fffdf4", "900");
}

function drawEnvelope(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
) {
  const centerX = width / 2;
  const centerY = height / 2 + 34;
  const envelopeWidth = Math.min(420, width * 0.62);
  const envelopeHeight = envelopeWidth * 0.54;
  const cardLift = phase === "idle" ? 0 : progress * envelopeHeight * 0.92;

  if (winnerLabel) {
    drawRoundedRect(context, centerX - envelopeWidth * 0.38, centerY - envelopeHeight * 0.46 - cardLift, envelopeWidth * 0.76, envelopeHeight * 0.54, 8, "#fffdf4", "#1a1f1b", 4);
    drawFittedText(context, winnerLabel, centerX, centerY - envelopeHeight * 0.22 - cardLift, envelopeWidth * 0.58, 30, "#1a1f1b", "900");
  } else {
    drawFittedText(context, `${optionLabels[0]} or ${optionLabels[1]}`, centerX, centerY - envelopeHeight * 0.2, envelopeWidth * 0.64, 22, "#fffdf4", "800");
  }

  context.fillStyle = "#ffce57";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 5;
  context.beginPath();
  context.rect(centerX - envelopeWidth / 2, centerY - envelopeHeight / 2, envelopeWidth, envelopeHeight);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(centerX - envelopeWidth / 2, centerY - envelopeHeight / 2);
  context.lineTo(centerX, centerY + envelopeHeight * 0.12);
  context.lineTo(centerX + envelopeWidth / 2, centerY - envelopeHeight / 2);
  context.stroke();

  context.save();
  context.translate(centerX, centerY - envelopeHeight / 2);
  context.scale(1, Math.max(0.08, 1 - progress));
  context.fillStyle = "#f06449";
  context.beginPath();
  context.moveTo(-envelopeWidth / 2, 0);
  context.lineTo(0, envelopeHeight * 0.48);
  context.lineTo(envelopeWidth / 2, 0);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawStraws(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
  winnerIndex: number,
) {
  const baseY = height / 2 + 116;
  const centerX = width / 2;
  const strawGap = Math.min(width * 0.17, 96);
  const winnerLift = phase === "idle" ? 0 : progress * 92;

  drawRoundedRect(context, centerX - 160, baseY - 18, 320, 56, 8, "#fffdf4", "#1a1f1b", 4);

  for (let index = 0; index < 2; index += 1) {
    const isWinner = index === winnerIndex;
    const x = centerX + (index === 0 ? -strawGap : strawGap);
    const lift = isWinner ? winnerLift : 0;
    const length = isWinner ? 220 : 165;

    context.save();
    context.translate(x, baseY - lift);
    context.rotate(index === 0 ? -0.12 : 0.12);
    context.strokeStyle = index === 0 ? "#6bd1c6" : "#ff8a65";
    context.lineWidth = 13;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -length);
    context.stroke();
    context.strokeStyle = "rgba(255,255,255,0.6)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(4, -12);
    context.lineTo(4, -length + 12);
    context.stroke();
    context.restore();
  }

  if (phase === "revealed" && winnerLabel) {
    drawFittedText(context, winnerLabel, centerX, baseY - 250, width * 0.6, 30, "#fffdf4", "900");
  } else {
    drawFittedText(context, `${optionLabels[0]} / ${optionLabels[1]}`, centerX, baseY - 240, width * 0.62, 24, "#fffdf4", "800");
  }
}

function drawSlotMachine(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const machineWidth = Math.min(450, width * 0.72);
  const machineHeight = 230;
  const reelWidth = machineWidth / 3 - 18;

  drawRoundedRect(context, centerX - machineWidth / 2, centerY - machineHeight / 2, machineWidth, machineHeight, 8, "#f06449", "#1a1f1b", 5);
  drawRoundedRect(context, centerX - machineWidth / 2 + 24, centerY - 58, machineWidth - 48, 116, 6, "#fffdf4", "#1a1f1b", 4);

  for (let index = 0; index < 3; index += 1) {
    const x = centerX - machineWidth / 2 + 40 + index * (reelWidth + 15);
    const spinIndex = phase === "revealed" && winnerLabel ? optionLabels.indexOf(winnerLabel) : Math.abs(Math.floor(progress * (12 + index * 4))) % 2;
    const label = phase === "revealed" && winnerLabel ? winnerLabel : optionLabels[spinIndex] ?? optionLabels[0];
    drawRoundedRect(context, x, centerY - 43, reelWidth, 86, 6, index === 1 ? "#ffce57" : "#f8f2d8", "#1a1f1b", 3);
    drawFittedText(context, label, x + reelWidth / 2, centerY + 8, reelWidth - 18, 22, "#1a1f1b", "900");
  }

  context.fillStyle = "#ffce57";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(centerX + machineWidth / 2 + 24, centerY - 58 + progress * 42, 18, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawPlinko(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
  winnerIndex: number,
) {
  const centerX = width / 2;
  const topY = 70;
  const boardWidth = Math.min(430, width * 0.72);
  const boardHeight = Math.min(320, height * 0.72);
  const left = centerX - boardWidth / 2;
  const bottomY = topY + boardHeight;

  drawRoundedRect(context, left, topY, boardWidth, boardHeight, 8, "rgba(255,253,244,0.24)", "#f8f2d8", 3);

  context.fillStyle = "#ffce57";
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const x = left + boardWidth * 0.18 + col * boardWidth * 0.13 + (row % 2) * boardWidth * 0.065;
      const y = topY + 56 + row * 44;
      context.beginPath();
      context.arc(x, y, 6, 0, Math.PI * 2);
      context.fill();
    }
  }

  const targetX = winnerIndex === 0 ? left + boardWidth * 0.26 : left + boardWidth * 0.74;
  const wobble = phase === "revealing" ? Math.sin(progress * Math.PI * 8) * boardWidth * 0.08 : 0;
  const ballX = lerp(centerX, targetX, progress) + wobble * (1 - progress);
  const ballY = lerp(topY + 24, bottomY - 52, progress);

  context.fillStyle = winnerIndex === 0 ? "#6bd1c6" : "#ff8a65";
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(ballX, ballY, 18, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  drawBucket(context, left + boardWidth * 0.25, bottomY + 28, boardWidth * 0.32, optionLabels[0]);
  drawBucket(context, left + boardWidth * 0.75, bottomY + 28, boardWidth * 0.32, optionLabels[1]);

  if (phase === "revealed" && winnerLabel) {
    drawFittedText(context, winnerLabel, centerX, bottomY + 96, width * 0.58, 28, "#fffdf4", "900");
  }
}

function drawFortuneCookie(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: RevealPhase,
  optionLabels: readonly [string, string],
  winnerLabel: string | null,
) {
  const centerX = width / 2;
  const centerY = height / 2 + 34;
  const cookieWidth = Math.min(380, width * 0.58);
  const crack = phase === "idle" ? 0 : progress;

  if (winnerLabel && crack > 0.28) {
    drawRoundedRect(context, centerX - cookieWidth * 0.36, centerY - 120 * crack, cookieWidth * 0.72, 70, 8, "#fffdf4", "#1a1f1b", 4);
    drawFittedText(context, winnerLabel, centerX, centerY - 78 * crack, cookieWidth * 0.54, 28, "#1a1f1b", "900");
  } else {
    drawFittedText(context, `${optionLabels[0]} or ${optionLabels[1]}`, centerX, centerY - 92, width * 0.58, 22, "#fffdf4", "800");
  }

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.12 - crack * 0.28);
  drawCookieHalf(context, -cookieWidth * 0.12 - crack * 34, 0, cookieWidth * 0.48, "#d88f35");
  context.restore();

  context.save();
  context.translate(centerX, centerY);
  context.rotate(0.12 + crack * 0.28);
  drawCookieHalf(context, cookieWidth * 0.12 + crack * 34, 0, cookieWidth * 0.48, "#f0b35e");
  context.restore();

  drawTableShadow(context, centerX, centerY + 88, cookieWidth * 0.55, 16);
}

function drawCard(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  label: string,
  fill: string,
  accent: string,
  front: boolean,
) {
  context.save();
  context.translate(centerX, centerY);
  drawRoundedRect(context, -width / 2, -height / 2, width, height, 8, fill, "#1a1f1b", 4);
  context.fillStyle = accent;
  context.fillRect(-width / 2 + 14, -height / 2 + 14, width - 28, 12);
  context.fillRect(-width / 2 + 14, height / 2 - 26, width - 28, 12);

  if (front) {
    drawFittedText(context, label, 0, 8, width - 36, 27, "#1a1f1b", "900");
  } else {
    context.globalAlpha = 0.75;
    drawFittedText(context, label, 0, 8, width - 34, 21, "#1a1f1b", "800");
  }

  context.restore();
}

function drawWheelSegment(
  context: CanvasRenderingContext2D,
  radius: number,
  startAngle: number,
  endAngle: number,
  fill: string,
  label: string,
) {
  context.fillStyle = fill;
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, radius, startAngle, endAngle);
  context.closePath();
  context.fill();
  context.stroke();

  context.save();
  context.rotate((startAngle + endAngle) / 2);
  drawFittedText(context, label, radius * 0.54, 8, radius * 0.72, 23, "#1a1f1b", "900");
  context.restore();
}

function drawPips(context: CanvasRenderingContext2D, count: number, size: number) {
  const positions =
    count === 1
      ? [[0, 0]]
      : [
          [-size * 0.22, -size * 0.22],
          [size * 0.22, size * 0.22],
        ];

  context.fillStyle = "#1a1f1b";
  for (const [x, y] of positions) {
    context.beginPath();
    context.arc(x, y, size * 0.08, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBucket(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  label: string,
) {
  drawRoundedRect(context, centerX - width / 2, centerY - 24, width, 48, 8, "#fffdf4", "#1a1f1b", 3);
  drawFittedText(context, label, centerX, centerY + 7, width - 14, 19, "#1a1f1b", "900");
}

function drawCookieHalf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  fill: string,
) {
  context.fillStyle = fill;
  context.strokeStyle = "#1a1f1b";
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(x, y, width / 2, width * 0.32, 0.22, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(255,255,255,0.22)";
  context.beginPath();
  context.ellipse(x - width * 0.12, y - width * 0.08, width * 0.18, width * 0.08, 0.2, 0, Math.PI * 2);
  context.fill();
}

function drawWinnerBanner(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  winnerLabel: string,
) {
  const bannerWidth = Math.min(width - 44, 460);
  const x = (width - bannerWidth) / 2;
  const y = height - 86;
  drawRoundedRect(context, x, y, bannerWidth, 58, 8, "#fffdf4", "#1a1f1b", 4);
  drawFittedText(context, winnerLabel, width / 2, y + 38, bannerWidth - 42, 28, "#1a1f1b", "900");
}

function drawReadyBanner(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  optionLabels: readonly [string, string],
) {
  const bannerWidth = Math.min(width - 44, 520);
  const x = (width - bannerWidth) / 2;
  const y = height - 82;
  drawRoundedRect(context, x, y, bannerWidth, 54, 8, "#fffdf4", "#1a1f1b", 4);
  drawFittedText(context, `${optionLabels[0]} or ${optionLabels[1]}`, width / 2, y + 35, bannerWidth - 42, 24, "#1a1f1b", "900");
}

function drawTableShadow(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
) {
  context.save();
  context.globalAlpha = 0.28;
  context.fillStyle = "#071a16";
  context.beginPath();
  context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
  lineWidth: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
  color: string,
  weight: string,
) {
  let size = initialSize;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;

  do {
    context.font = `${weight} ${size}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    if (context.measureText(text).width <= maxWidth || size <= 13) {
      break;
    }
    size -= 1;
  } while (size > 12);

  context.fillText(text, x, y);
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}
