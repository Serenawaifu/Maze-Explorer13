import { useRef, useEffect } from "react";
import { useGameState } from "./gameState";
import type { MazeData } from "./mazeGenerator";

const CELL_SIZE = 4;
const COMPASS_REDRAW_INTERVAL = 50;
const BAR_WIDTH = 320;
const BAR_HEIGHT = 24;
const EXIT_LABEL_ZONE = 50;

interface CompassProps {
  maze: MazeData;
}

export function Compass({ maze }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screen = useGameState((s) => s.screen);
  const propsRef = useRef({ maze });
  propsRef.current = { maze };

  useEffect(() => {
    if (screen !== "playing") return;

    function tick() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const p = propsRef.current;
      const state = useGameState.getState();
      const playerPosition = state.playerPosition;
      const collectiblesGathered = state.collectiblesGathered;
      const totalCollectibles = state.totalCollectibles;
      const yaw = state.playerYaw;

      const w = BAR_WIDTH;
      const h = BAR_HEIGHT;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      ctx.clearRect(0, 0, w, h);

      const r = 10;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "rgba(24, 16, 10, 0.88)");
      bgGrad.addColorStop(1, "rgba(14, 9, 5, 0.78)");
      ctx.fillStyle = bgGrad;
      ctx.fill();

      ctx.strokeStyle = "rgba(210, 140, 60, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const directions = [
        { label: "N", angle: 0 },
        { label: "NE", angle: Math.PI / 4 },
        { label: "E", angle: Math.PI / 2 },
        { label: "SE", angle: 3 * Math.PI / 4 },
        { label: "S", angle: Math.PI },
        { label: "SW", angle: 5 * Math.PI / 4 },
        { label: "W", angle: 3 * Math.PI / 2 },
        { label: "NW", angle: 7 * Math.PI / 4 },
      ];

      const viewRange = Math.PI * 0.75;
      const centerY = h / 2;

      let normalizedYaw = (-yaw + Math.PI) % (Math.PI * 2);
      if (normalizedYaw < 0) normalizedYaw += Math.PI * 2;

      ctx.save();

      const compassAreaW = w - EXIT_LABEL_ZONE;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, compassAreaW, h);
      ctx.clip();

      directions.forEach(({ label, angle }) => {
        let diff = angle - normalizedYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) > viewRange) return;

        const x = compassAreaW / 2 + (diff / viewRange) * (compassAreaW / 2);
        const isCardinal = label.length === 1;

        ctx.fillStyle = isCardinal ? "rgba(210, 140, 60, 0.9)" : "rgba(210, 140, 60, 0.4)";
        ctx.font = isCardinal
          ? "bold 10px 'Orbitron', sans-serif"
          : "8px 'Rajdhani', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, centerY);

        ctx.strokeStyle = "rgba(210, 140, 60, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, h - 4);
        ctx.lineTo(x, h);
        ctx.stroke();
      });

      ctx.restore();

      const exitWorldX = p.maze.end.x * CELL_SIZE;
      const exitWorldZ = p.maze.end.y * CELL_SIZE;
      const dx = exitWorldX - playerPosition.x;
      const dz = exitWorldZ - playerPosition.z;
      const angleToExit = Math.atan2(dx, -dz);

      let exitAngle = angleToExit;
      if (exitAngle < 0) exitAngle += Math.PI * 2;

      let exitDiff = exitAngle - normalizedYaw;
      while (exitDiff > Math.PI) exitDiff -= Math.PI * 2;
      while (exitDiff < -Math.PI) exitDiff += Math.PI * 2;

      const mathSum = state.mathSum;
      const targetMathSum = state.targetMathSum;
      const hasMathGates = targetMathSum > 0;
      const mathSumMet = !hasMathGates || mathSum === targetMathSum;
      const mathExceeded = hasMathGates && mathSum > targetMathSum;
      const allCollected = collectiblesGathered >= totalCollectibles;
      const portalReady = allCollected && mathSumMet;
      const markerColor = mathExceeded ? "#cc3333" : portalReady ? "#44cc88" : "#d2882a";

      if (Math.abs(exitDiff) <= viewRange) {
        const exitX = compassAreaW / 2 + (exitDiff / viewRange) * (compassAreaW / 2);

        ctx.fillStyle = markerColor;
        ctx.shadowColor = markerColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(exitX, 2);
        ctx.lineTo(exitX - 4, 7);
        ctx.lineTo(exitX + 4, 7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        const edgeX = exitDiff > 0 ? compassAreaW - 8 : 8;
        ctx.fillStyle = markerColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        if (exitDiff > 0) {
          ctx.moveTo(edgeX + 4, centerY);
          ctx.lineTo(edgeX - 2, centerY - 4);
          ctx.lineTo(edgeX - 2, centerY + 4);
        } else {
          ctx.moveTo(edgeX - 4, centerY);
          ctx.lineTo(edgeX + 2, centerY - 4);
          ctx.lineTo(edgeX + 2, centerY + 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const dist = Math.sqrt(dx * dx + dz * dz);
      const maxDist = Math.sqrt(exitWorldX * exitWorldX + exitWorldZ * exitWorldZ);
      const distPct = Math.min(1, dist / maxDist);
      let distLabel: string;
      if (dist < 8) {
        distLabel = "NEAR";
      } else if (distPct < 0.3) {
        distLabel = "CLOSE";
      } else if (distPct < 0.6) {
        distLabel = "MID";
      } else {
        distLabel = "FAR";
      }

      ctx.strokeStyle = "rgba(210, 140, 60, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(compassAreaW, 0);
      ctx.lineTo(compassAreaW, h);
      ctx.stroke();

      ctx.fillStyle = mathExceeded ? "rgba(204, 51, 51, 0.8)" : (dist < 8 && portalReady) ? "rgba(68, 204, 136, 0.8)" : "rgba(210, 140, 60, 0.5)";
      ctx.font = "bold 7px 'Rajdhani', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`EXIT`, compassAreaW + EXIT_LABEL_ZONE / 2, centerY - 5);
      ctx.fillText(distLabel, compassAreaW + EXIT_LABEL_ZONE / 2, centerY + 5);

      ctx.restore();

      const compassCenter = compassAreaW / 2;
      ctx.strokeStyle = "rgba(210, 140, 60, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(compassCenter, 0);
      ctx.lineTo(compassCenter, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(compassCenter, h - 3);
      ctx.lineTo(compassCenter, h);
      ctx.stroke();

      ctx.restore();
    }

    tick();
    const id = setInterval(tick, COMPASS_REDRAW_INTERVAL);
    return () => clearInterval(id);
  }, [screen]);

  if (screen !== "playing") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 14,
          border: "1px solid rgba(210,140,60,0.08)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)",
          width: BAR_WIDTH,
          maxWidth: BAR_WIDTH,
          height: BAR_HEIGHT,
          display: "block",
        }}
      />
    </div>
  );
}
