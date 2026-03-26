import { useRef, useEffect, useState } from "react";
import type { MazeData } from "../engine/mazeGenerator";
import { THEME } from "./theme";
import { getThemeForLevel } from "../engine/levelThemes";
import { useGameState } from "../engine/gameState";

const CELL_SIZE = 4;
const MAP_SIZE = 120;
const REVEAL_RADIUS = 3;
const REDRAW_INTERVAL = 50;
const EXPAND_SCALE = 1.8;

interface MiniMapProps {
  maze: MazeData;
  level: number;
  exitPosition: { x: number; z: number };
  collectiblePositions: { x: number; z: number }[];
  collectedItems: Set<number>;
}

function worldToCell(wx: number, wz: number) {
  return { x: Math.round(wx / CELL_SIZE), y: Math.round(wz / CELL_SIZE) };
}

export function MiniMap(props: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exploredRef = useRef<Set<string>>(new Set());
  const seenPoisRef = useRef<Set<string>>(new Set());
  const propsRef = useRef(props);
  const lastLevelRef = useRef(props.level);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(expanded);

  propsRef.current = props;
  expandedRef.current = expanded;

  if (props.level !== lastLevelRef.current) {
    exploredRef.current = new Set();
    seenPoisRef.current = new Set();
    lastLevelRef.current = props.level;
  }

  const lastCellRef = useRef("");

  useEffect(() => {
    function tick() {
      const p = propsRef.current;
      const explored = exploredRef.current;
      const seen = seenPoisRef.current;

      const gameState = useGameState.getState();
      const playerPosition = gameState.playerPosition;
      const pc = worldToCell(playerPosition.x, playerPosition.z);
      const cellKey = `${pc.x},${pc.y}`;
      const cellChanged = cellKey !== lastCellRef.current;
      lastCellRef.current = cellKey;

      if (cellChanged) {
        for (let dy = -REVEAL_RADIUS; dy <= REVEAL_RADIUS; dy++) {
          for (let dx = -REVEAL_RADIUS; dx <= REVEAL_RADIUS; dx++) {
            const cx = pc.x + dx;
            const cy = pc.y + dy;
            if (cx < 0 || cy < 0 || cx >= p.maze.width || cy >= p.maze.height) continue;
            if (Math.sqrt(dx * dx + dy * dy) <= REVEAL_RADIUS) {
              explored.add(`${cx},${cy}`);
            }
          }
        }
      }

      const ec = worldToCell(p.exitPosition.x, p.exitPosition.z);
      if (explored.has(`${ec.x},${ec.y}`)) seen.add("exit");
      p.collectiblePositions.forEach((c, i) => {
        const cc = worldToCell(c.x, c.z);
        if (explored.has(`${cc.x},${cc.y}`)) seen.add(`gem-${i}`);
      });

      drawMap(canvasRef.current, p, explored, seen, expandedRef.current);
    }

    tick();
    const id = setInterval(tick, REDRAW_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const mapPx = expanded ? Math.round(MAP_SIZE * EXPAND_SCALE) : MAP_SIZE;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(8px, 1vw, 14px)",
        right: "clamp(8px, 1vw, 14px)",
        zIndex: 101,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
      onClick={() => setExpanded((e) => !e)}
      title={expanded ? "Click to shrink map" : "Click to enlarge map"}
    >
      <div style={{
        background: "linear-gradient(160deg, rgba(24,16,10,0.85), rgba(14,9,5,0.75))",
        borderRadius: 18,
        padding: 6,
        border: "1px solid rgba(210,140,60,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          paddingLeft: 4,
          paddingRight: 4,
        }}>
          <span style={{
            fontSize: 8,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.textMuted,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}>
            MAP
          </span>
          <span style={{
            fontSize: 7,
            fontFamily: THEME.fonts.mono,
            color: THEME.colors.textDim,
          }}>
            {expanded ? "▼" : "▲"}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={mapPx}
          height={mapPx}
          style={{
            width: mapPx,
            height: mapPx,
            borderRadius: 12,
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

function drawMap(
  canvas: HTMLCanvasElement | null,
  p: MiniMapProps,
  explored: Set<string>,
  seen: Set<string>,
  isExpanded: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gameState = useGameState.getState();
  const playerPosition = gameState.playerPosition;

  const mapPx = isExpanded ? Math.round(MAP_SIZE * EXPAND_SCALE) : MAP_SIZE;
  if (canvas.width !== mapPx) canvas.width = mapPx;
  if (canvas.height !== mapPx) canvas.height = mapPx;

  ctx.clearRect(0, 0, mapPx, mapPx);

  const cellPx = mapPx / Math.max(p.maze.width, p.maze.height);
  const theme = getThemeForLevel(p.level);

  ctx.fillStyle = "rgba(5, 8, 16, 0.95)";
  ctx.fillRect(0, 0, mapPx, mapPx);

  const wallColor = theme.wallBaseHex || "rgba(140, 120, 90, 0.7)";
  const wallWidth = Math.max(1, cellPx * 0.15);

  for (let cy = 0; cy < p.maze.height; cy++) {
    for (let cx = 0; cx < p.maze.width; cx++) {
      if (!explored.has(`${cx},${cy}`)) continue;

      const px = cx * cellPx;
      const py = cy * cellPx;

      ctx.fillStyle = "rgba(40, 35, 30, 0.8)";
      ctx.fillRect(px, py, cellPx, cellPx);

      const cell = p.maze.cells[cy][cx];
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = wallWidth;
      ctx.lineCap = "round";

      if (cell.walls.north) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellPx, py);
        ctx.stroke();
      }
      if (cell.walls.south) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellPx);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.stroke();
      }
      if (cell.walls.west) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + cellPx);
        ctx.stroke();
      }
      if (cell.walls.east) {
        ctx.beginPath();
        ctx.moveTo(px + cellPx, py);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.stroke();
      }
    }
  }

  const dotSize = Math.max(2.5, cellPx * 0.3);

  if (seen.has("exit")) {
    const ec = worldToCell(p.exitPosition.x, p.exitPosition.z);
    const ex = ec.x * cellPx + cellPx / 2;
    const ey = ec.y * cellPx + cellPx / 2;
    const pulse = 0.8 + Math.sin(performance.now() * 0.005) * 0.2;
    ctx.fillStyle = `rgba(68, 204, 136, ${pulse})`;
    ctx.shadowColor = "#44cc88";
    ctx.shadowBlur = 6;
    drawDiamond(ctx, ex, ey, dotSize * 1.6);
    ctx.shadowBlur = 0;
  }

  const ppx = (playerPosition.x / CELL_SIZE) * cellPx + cellPx / 2;
  const ppy = (playerPosition.z / CELL_SIZE) * cellPx + cellPx / 2;
  const arrowSize = Math.max(4, cellPx * 0.45);

  ctx.save();
  ctx.translate(ppx, ppy);
  ctx.rotate(-gameState.playerYaw);

  ctx.fillStyle = "#44ee88";
  ctx.shadowColor = "#44ee88";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, -arrowSize);
  ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.5);
  ctx.lineTo(0, arrowSize * 0.15);
  ctx.lineTo(arrowSize * 0.6, arrowSize * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();

  const borderGrad = ctx.createLinearGradient(0, 0, mapPx, mapPx);
  borderGrad.addColorStop(0, "rgba(210, 140, 60, 0.4)");
  borderGrad.addColorStop(1, "rgba(210, 140, 60, 0.15)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, mapPx, mapPx);
}


function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}
