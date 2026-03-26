import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useGameState, TOTAL_LEVELS } from "./gameState";
import { THEME } from "./theme";
import { getThemeForLevel, LEVEL_THEMES } from "./levelThemes";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; rotation: number; rotSpeed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.4 - 0.1,
        size: 16 + Math.random() * 24,
        alpha: Math.random() * 0.5 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(14,8,4,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < -p.size * 2) {
          p.y = canvas.height + p.size * 2;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -p.size * 2) p.x = canvas.width + p.size * 2;
        if (p.x > canvas.width + p.size * 2) p.x = -p.size * 2;

        const flickerAlpha = p.alpha * (0.6 + Math.sin(Date.now() * 0.001 + p.x) * 0.4);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = flickerAlpha;

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size / 2);
        grad.addColorStop(0, "#ffcc44");
        grad.addColorStop(0.5, "#ff8c00");
        grad.addColorStop(1, "rgba(255,140,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}

function ScanlineOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)",
        pointerEvents: "none",
      }}
    />
  );
}

function FadeInItem({ children, delay, style }: { children: ReactNode; delay: number; style?: CSSProperties }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.7s cubic-bezier(0.2,0.8,0.2,1), transform 0.7s cubic-bezier(0.2,0.8,0.2,1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const overlayBase: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
  fontFamily: THEME.fonts.body,
  color: THEME.colors.text,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
};

const screenCSS = `
@keyframes btnShine {
  0% { left: -100%; }
  100% { left: 200%; }
}
@keyframes statCountUp {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
`;

function GameButton({ onClick, color, glowColor, children, small, variant = "default" }: {
  onClick: () => void;
  color: string;
  glowColor: string;
  children: React.ReactNode;
  small?: boolean;
  variant?: "default" | "primary" | "danger" | "ghost";
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";

  const bgIdle = isGhost
    ? "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
    : isPrimary
      ? `linear-gradient(160deg, ${color}, ${color}cc, ${color}88)`
      : isDanger
        ? "linear-gradient(160deg, rgba(180,30,40,0.28), rgba(120,15,25,0.18), rgba(80,10,15,0.12))"
        : "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";

  const bgHover = isGhost
    ? "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
    : isPrimary
      ? `linear-gradient(160deg, ${color}, ${color}ee, ${color}aa)`
      : isDanger
        ? "linear-gradient(160deg, rgba(210,40,55,0.45), rgba(170,30,40,0.3), rgba(130,20,30,0.2))"
        : `linear-gradient(160deg, ${color}50, ${color}25)`;

  const borderIdle = isGhost
    ? "1px solid rgba(255,255,255,0.1)"
    : isPrimary
      ? `1px solid ${glowColor}70`
      : isDanger
        ? "1px solid rgba(204,34,51,0.35)"
        : "1px solid rgba(255,255,255,0.12)";

  const borderHover = isGhost
    ? "1px solid rgba(255,255,255,0.22)"
    : isPrimary
      ? `1px solid ${glowColor}`
      : isDanger
        ? "1px solid rgba(230,50,65,0.6)"
        : `1px solid ${glowColor}60`;

  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: small ? "clamp(10px, 1.5vh, 14px) clamp(22px, 4vw, 32px)" : "clamp(14px, 2.2vh, 18px) clamp(36px, 7vw, 56px)",
        fontSize: small ? "clamp(11px, 1.6vw, 13px)" : "clamp(13px, 2.2vw, 16px)",
        fontWeight: 800,
        fontFamily: THEME.fonts.heading,
        border: hovered ? borderHover : borderIdle,
        borderRadius: 10,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: small ? 2.5 : 3.5,
        background: hovered ? bgHover : bgIdle,
        color: hovered ? "#fff" : isGhost ? THEME.colors.textDim : THEME.colors.text,
        boxShadow: hovered
          ? (isDanger
            ? "0 0 28px rgba(204,34,51,0.35), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)"
            : `0 0 28px ${glowColor}50, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)`)
          : `0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)`,
        transform: pressed ? "scale(0.96)" : hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.2,0.8,0.2,1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {!isGhost && (
        <span style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: isDanger
            ? "linear-gradient(90deg, transparent 10%, rgba(255,120,120,0.3) 50%, transparent 90%)"
            : `linear-gradient(90deg, transparent 10%, ${glowColor}50 50%, transparent 90%)`,
          pointerEvents: "none",
        }} />
      )}
      {hovered && (
        <span style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "60%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          animation: "btnShine 0.6s ease forwards",
          pointerEvents: "none",
        }} />
      )}
      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        {children}
      </span>
    </button>
  );
}

function StatCard({ label, value, color, delay, icon }: { label: string; value: string | number; color: string; delay: number; icon?: string }) {
  return (
    <FadeInItem delay={delay}>
      <div style={{
        background: "linear-gradient(160deg, rgba(32,20,12,0.92), rgba(18,10,6,0.88))",
        border: `1px solid rgba(210,140,60,0.12)`,
        borderRadius: 14,
        padding: "clamp(14px, 2.5vh, 20px) clamp(18px, 3.5vw, 28px)",
        textAlign: "center",
        minWidth: "clamp(80px, 18vw, 120px)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.15)",
        position: "relative" as const,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
          borderRadius: "0 0 2px 2px",
        }} />
        <div style={{
          position: "absolute",
          top: 0,
          left: "25%",
          right: "25%",
          height: 12,
          background: `radial-gradient(ellipse at top, ${color}15, transparent)`,
          pointerEvents: "none",
        }} />
        {icon && (
          <div style={{
            fontSize: 22,
            marginBottom: 8,
            animation: "iconFloat 3s ease-in-out infinite",
            filter: `drop-shadow(0 0 8px ${color}50)`,
            lineHeight: 1,
          }}>
            {icon}
          </div>
        )}
        <div style={{
          fontSize: 10,
          fontFamily: THEME.fonts.heading,
          color: THEME.colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 3.5,
          marginBottom: 10,
          fontWeight: 600,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "clamp(26px, 5.5vw, 38px)",
          fontFamily: THEME.fonts.heading,
          fontWeight: 900,
          color,
          textShadow: `0 0 24px ${color}35, 0 2px 4px rgba(0,0,0,0.3)`,
          animation: "statCountUp 0.5s ease-out forwards",
          letterSpacing: 1.5,
          lineHeight: 1,
        }}>
          {value}
        </div>
      </div>
    </FadeInItem>
  );
}

function ScreenDivider({ color, delay }: { color: string; delay: number }) {
  return (
    <FadeInItem delay={delay}>
      <div style={{
        width: "clamp(80px, 30vw, 120px)",
        height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        margin: "clamp(12px, 2.5vh, 20px) auto clamp(16px, 3.5vh, 32px)",
        borderRadius: 1,
        boxShadow: `0 0 12px ${color}40`,
      }} />
    </FadeInItem>
  );
}

function MazeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const cellSize = 40;
    let cols = 0;
    let rows = 0;
    type Wall = { x1: number; y1: number; x2: number; y2: number; age: number; pulse: number };
    let walls: Wall[] = [];
    let revealProgress = 0;
    let panX = 0;
    let panY = 0;

    type MCell = { visited: boolean; walls: [boolean, boolean, boolean, boolean] };
    let grid: MCell[][] = [];

    function generateMazeBg(c: number, r: number) {
      grid = [];
      for (let y = 0; y < r; y++) {
        grid[y] = [];
        for (let x = 0; x < c; x++) {
          grid[y][x] = { visited: false, walls: [true, true, true, true] };
        }
      }
      const stack: [number, number][] = [];
      const startX = Math.floor(Math.random() * c);
      const startY = Math.floor(Math.random() * r);
      grid[startY][startX].visited = true;
      stack.push([startX, startY]);

      while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors: [number, number, number, number][] = [];
        if (cy > 0 && !grid[cy - 1][cx].visited) neighbors.push([cx, cy - 1, 0, 2]);
        if (cx < c - 1 && !grid[cy][cx + 1].visited) neighbors.push([cx + 1, cy, 1, 3]);
        if (cy < r - 1 && !grid[cy + 1][cx].visited) neighbors.push([cx, cy + 1, 2, 0]);
        if (cx > 0 && !grid[cy][cx - 1].visited) neighbors.push([cx - 1, cy, 3, 1]);

        if (neighbors.length === 0) {
          stack.pop();
        } else {
          const [nx, ny, wallIdx, oppIdx] = neighbors[Math.floor(Math.random() * neighbors.length)];
          grid[cy][cx].walls[wallIdx] = false;
          grid[ny][nx].walls[oppIdx] = false;
          grid[ny][nx].visited = true;
          stack.push([nx, ny]);
        }
      }
    }

    function buildWalls() {
      walls = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y]?.[x];
          if (!cell) continue;
          const px = x * cellSize;
          const py = y * cellSize;
          if (cell.walls[0]) walls.push({ x1: px, y1: py, x2: px + cellSize, y2: py, age: 0, pulse: Math.random() * Math.PI * 2 });
          if (cell.walls[1]) walls.push({ x1: px + cellSize, y1: py, x2: px + cellSize, y2: py + cellSize, age: 0, pulse: Math.random() * Math.PI * 2 });
          if (y === rows - 1 && cell.walls[2]) walls.push({ x1: px, y1: py + cellSize, x2: px + cellSize, y2: py + cellSize, age: 0, pulse: Math.random() * Math.PI * 2 });
          if (x === 0 && cell.walls[3]) walls.push({ x1: px, y1: py, x2: px, y2: py + cellSize, age: 0, pulse: Math.random() * Math.PI * 2 });
        }
      }
    }

    let lastRegenTime = 0;
    let revealStartTime = 0;
    const regenInterval = 25000;
    const revealDuration = 8000;
    let maxDist = 0;
    let halfW = 0;
    let halfH = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / cellSize) + 4;
      rows = Math.ceil(canvas.height / cellSize) + 4;
      halfW = canvas.width / 2;
      halfH = canvas.height / 2;
      maxDist = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
      generateMazeBg(cols, rows);
      buildWalls();
      revealProgress = 0;
    };
    window.addEventListener("resize", resize);
    resize();

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; life: number; maxLife: number; opacity: number; pulseRate: number; pulseOffset: number }[] = [];
    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() * -1.5) - 0.5,
      life: 0,
      maxLife: Math.random() * 300 + 150,
      opacity: Math.random() * 0.4 + 0.1,
      pulseRate: Math.random() * 0.05 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2,
    });
    for (let i = 0; i < 20; i++) particles.push({ ...createParticle(), y: Math.random() * canvas.height });

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (lastRegenTime === 0) { lastRegenTime = time; revealStartTime = time; }
      if (time - lastRegenTime > regenInterval) {
        lastRegenTime = time;
        revealStartTime = time;
        generateMazeBg(cols, rows);
        buildWalls();
      }

      revealProgress = Math.min((time - revealStartTime) / revealDuration, 1);
      panX = Math.sin(time * 0.00005) * 20;
      panY = Math.cos(time * 0.00007) * 15;

      ctx.save();
      ctx.translate(panX - cellSize * 2, panY - cellSize * 2);

      const totalWalls = walls.length;
      const visibleCount = Math.floor(totalWalls * revealProgress);
      const invMaxDist = maxDist > 0 ? 0.7 / maxDist : 0;

      const alphaBuckets: Map<number, Path2D> = new Map();
      const glowBuckets: Map<number, Path2D> = new Map();

      for (let i = 0; i < visibleCount; i++) {
        const w = walls[i];
        if (w.age < 1) w.age = Math.min(w.age + 0.03, 1);

        const pulseBrightness = 0.5 + Math.sin(time * 0.001 + w.pulse) * 0.2;
        const cx = (w.x1 + w.x2) * 0.5;
        const cy = (w.y1 + w.y2) * 0.5;
        const dx = cx - halfW;
        const dy = cy - halfH;
        const distFade = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * invMaxDist);
        const alpha = w.age * pulseBrightness * distFade * 0.18;

        const bucketKey = Math.round(alpha * 100);
        let path = alphaBuckets.get(bucketKey);
        if (!path) { path = new Path2D(); alphaBuckets.set(bucketKey, path); }
        path.moveTo(w.x1, w.y1);
        path.lineTo(w.x2, w.y2);

        if (alpha > 0.04) {
          let glowPath = glowBuckets.get(bucketKey);
          if (!glowPath) { glowPath = new Path2D(); glowBuckets.set(bucketKey, glowPath); }
          glowPath.moveTo(w.x1, w.y1);
          glowPath.lineTo(w.x2, w.y2);
        }
      }

      ctx.lineWidth = 1.5;
      for (const [key, path] of alphaBuckets) {
        ctx.strokeStyle = `rgba(210,136,42,${key / 100})`;
        ctx.stroke(path);
      }
      ctx.lineWidth = 5;
      for (const [key, path] of glowBuckets) {
        ctx.strokeStyle = `rgba(255,200,100,${(key / 100) * 0.4})`;
        ctx.stroke(path);
      }

      ctx.restore();

      if (particles.length < 35 && Math.random() < 0.05) particles.push(createParticle());
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.speedX + Math.sin(time * 0.0005 + p.pulseOffset) * 0.3;
        p.y += p.speedY;

        const lifeRatio = p.life / p.maxLife;
        let a = p.opacity;
        if (lifeRatio < 0.2) a *= lifeRatio / 0.2;
        else if (lifeRatio > 0.8) a *= (1 - (lifeRatio - 0.8) / 0.2);
        a *= 0.5 + ((Math.sin(time * p.pulseRate + p.pulseOffset) + 1) / 2) * 0.5;

        if (lifeRatio >= 1 || p.y < -20) { particles.splice(i, 1); continue; }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(255,200,100,${a})`);
        grad.addColorStop(0.4, `rgba(210,136,42,${a * 0.6})`);
        grad.addColorStop(1, "rgba(210,136,42,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };
    render(0);

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} />;
}

const cinematicCSS = `
@keyframes mazeAmbientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes mazeTitleGlow {
  0%, 100% { text-shadow: 0 0 30px rgba(210,136,42,0.3), 0 0 60px rgba(210,136,42,0.1); }
  50% { text-shadow: 0 0 50px rgba(210,136,42,0.6), 0 0 90px rgba(210,136,42,0.3), 0 0 10px rgba(255,255,255,0.2); }
}
@keyframes mazeTyping {
  from { width: 0; opacity: 0; }
  1% { opacity: 1; }
  to { width: 100%; opacity: 1; }
}
@keyframes mazeBlinkCursor {
  from, to { border-color: transparent }
  50% { border-color: ${THEME.colors.primary}; }
}
@keyframes mazeCtaPulse {
  0% { box-shadow: 0 0 15px rgba(210,136,42,0.2), 0 0 40px rgba(210,136,42,0.05), inset 0 0 10px rgba(210,136,42,0.1); }
  50% { box-shadow: 0 0 35px rgba(210,136,42,0.5), 0 0 80px rgba(210,136,42,0.15), inset 0 0 20px rgba(210,136,42,0.3); }
  100% { box-shadow: 0 0 15px rgba(210,136,42,0.2), 0 0 40px rgba(210,136,42,0.05), inset 0 0 10px rgba(210,136,42,0.1); }
}
@keyframes mazeCtaBorderRotate {
  0% { --cta-angle: 0deg; }
  100% { --cta-angle: 360deg; }
}
@keyframes mazeCtaShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@property --cta-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.maze-cta-btn {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.maze-cta-btn::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -2;
  background: conic-gradient(
    from var(--cta-angle, 0deg),
    rgba(210,136,42,0.1),
    rgba(210,136,42,0.8),
    rgba(255,200,100,1),
    rgba(210,136,42,0.8),
    rgba(210,136,42,0.1),
    rgba(210,136,42,0.05),
    rgba(210,136,42,0.1)
  );
  border-radius: 10px;
  animation: mazeCtaBorderRotate 4s linear infinite;
}
.maze-cta-btn::after {
  content: "";
  position: absolute;
  inset: 2px;
  z-index: -1;
  background: linear-gradient(160deg, rgba(28,18,10,0.95), rgba(14,8,4,0.98));
  border-radius: 8px;
}
.maze-cta-btn:hover::before {
  animation-duration: 2s;
  background: conic-gradient(
    from var(--cta-angle, 0deg),
    rgba(210,136,42,0.3),
    rgba(255,180,60,1),
    rgba(255,220,120,1),
    rgba(255,180,60,1),
    rgba(210,136,42,0.3),
    rgba(210,136,42,0.1),
    rgba(210,136,42,0.3)
  );
}
.maze-cta-btn:hover::after {
  background: linear-gradient(160deg, rgba(40,25,12,0.95), rgba(20,12,6,0.98));
}
.maze-cta-shimmer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(210,136,42,0.06) 35%,
    rgba(210,136,42,0.15) 50%,
    rgba(210,136,42,0.06) 65%,
    transparent 80%
  );
  background-size: 200% 100%;
  animation: mazeCtaShimmer 3s ease-in-out infinite;
  pointer-events: none;
}
.maze-cta-btn:hover .maze-cta-shimmer {
  animation-duration: 1.5s;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(210,136,42,0.1) 35%,
    rgba(210,136,42,0.25) 50%,
    rgba(210,136,42,0.1) 65%,
    transparent 80%
  );
  background-size: 200% 100%;
}
@keyframes mazeCinematicFadeIn {
  from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.maze-ambient-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 30%, rgba(210,136,42,0.08) 0%, rgba(14,8,4,1) 70%),
              linear-gradient(120deg, rgba(14,8,4,0.9) 0%, rgba(28,18,10,0.4) 50%, rgba(14,8,4,0.9) 100%);
  background-size: 200% 200%;
  animation: mazeAmbientShift 20s ease-in-out infinite;
  z-index: 1;
}
.maze-fog-layer {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(14,8,4,1) 0%, rgba(14,8,4,0) 50%);
  z-index: 3; pointer-events: none;
}
.maze-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%);
  z-index: 10; pointer-events: none;
}
.maze-typewriter-text {
  overflow: hidden; white-space: nowrap;
  border-right: 2px solid ${THEME.colors.primary};
  animation: mazeTyping 3s steps(40, end) 1.5s forwards,
             mazeBlinkCursor 0.75s step-end infinite;
  opacity: 0; display: inline-block; margin: 0 auto;
}
`;

export function StartScreen() {
  const screen = useGameState((s) => s.screen);
  const startGame = useGameState((s) => s.startGame);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (screen === "start") {
      const t = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(t);
    }
    setShowContent(false);
    return undefined;
  }, [screen]);

  if (screen !== "start") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      background: THEME.colors.bgDark,
      overflowY: "auto",
      overflowX: "hidden",
      color: THEME.colors.text,
      fontFamily: THEME.fonts.body,
      zIndex: 200,
    }}>
      <style>{cinematicCSS}</style>

      <div className="maze-ambient-bg" />
      <MazeBackground />
      <div className="maze-fog-layer" />
      <div className="maze-vignette" />

      <div style={{
        position: "relative",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1,
        minHeight: "100%",
        padding: "clamp(40px, 10vh, 80px) 20px clamp(20px, 5vh, 40px)",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 auto",
          width: "100%",
        }}>
          <h1 style={{
            fontFamily: THEME.fonts.heading,
            fontSize: "clamp(40px, 8vw, 100px)",
            fontWeight: 900,
            letterSpacing: "clamp(4px, 1.5vw, 12px)",
            color: "#fff",
            margin: "0 0 clamp(10px, 2vh, 20px) 0",
            textAlign: "center",
            lineHeight: 1.1,
            animation: "mazeCinematicFadeIn 2s cubic-bezier(0.2,0.8,0.2,1) 0.5s both, mazeTitleGlow 4s ease-in-out infinite alternate",
          }}>
            MAZE RUNNER
          </h1>

          <div style={{
            fontFamily: THEME.fonts.mono,
            fontSize: "clamp(11px, 2vw, 18px)",
            color: THEME.colors.textDim,
            letterSpacing: "clamp(2px, 0.8vw, 6px)",
            textTransform: "uppercase",
            maxWidth: "100%",
          }}>
            <span className="maze-typewriter-text">
              Navigate the Darkness. Survive the Maze.
            </span>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px, 2.5vh, 20px)",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(20px)",
          transition: "all 1.5s cubic-bezier(0.2,0.8,0.2,1) 3.5s",
          marginBottom: "clamp(10px, 2vh, 20px)",
          flexShrink: 0,
        }}>
          <button
            className="maze-cta-btn"
            onClick={startGame}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              background: "transparent",
              border: "none",
              color: ctaHovered ? "#fff" : THEME.colors.primary,
              padding: "clamp(14px, 3vh, 22px) clamp(36px, 8vw, 64px)",
              fontFamily: THEME.fonts.heading,
              fontSize: "clamp(14px, 2.5vw, 22px)",
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase" as const,
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
              animation: ctaHovered ? "none" : "mazeCtaPulse 3s infinite",
              transform: ctaHovered ? "scale(1.05)" : "scale(1)",
              borderRadius: 8,
              textShadow: ctaHovered
                ? "0 0 20px rgba(210,136,42,0.8), 0 0 40px rgba(210,136,42,0.4)"
                : "0 0 10px rgba(210,136,42,0.3)",
            }}
          >
            <span className="maze-cta-shimmer" />
            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                display: "inline-block",
                width: 20,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${THEME.colors.primary})`,
                opacity: ctaHovered ? 1 : 0.4,
                transition: "opacity 0.4s ease",
              }} />
              Enter the Maze
              <span style={{
                display: "inline-block",
                width: 20,
                height: 1,
                background: `linear-gradient(90deg, ${THEME.colors.primary}, transparent)`,
                opacity: ctaHovered ? 1 : 0.4,
                transition: "opacity 0.4s ease",
              }} />
            </span>
          </button>

          <div style={{
            fontFamily: THEME.fonts.mono,
            fontSize: 12,
            color: THEME.colors.textMuted,
            letterSpacing: 2,
            opacity: 0.4,
          }}>
            WASD TO MOVE &bull; MOUSE TO LOOK
          </div>
        </div>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const level = useGameState((s) => s.level);
  const collectiblesGathered = useGameState((s) => s.collectiblesGathered);
  const totalCollectibles = useGameState((s) => s.totalCollectibles);
  const startGame = useGameState((s) => s.startGame);
  const backToStart = useGameState((s) => s.backToStart);

  if (screen !== "gameOver") return null;

  const theme = getThemeForLevel(level);


  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(50,12,8,0.96) 0%, rgba(15,4,2,0.99) 100%)",
    }}>
      <style>{`
        ${screenCSS}
        @keyframes gameOverBarFill {
          from { width: 0%; }
        }
      `}</style>
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "clamp(20px, 5vh, 40px) 24px", maxWidth: 520, margin: "auto 0" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 11,
            fontFamily: THEME.fonts.heading,
            color: "rgba(204,34,51,0.6)",
            textTransform: "uppercase",
            letterSpacing: 8,
            marginBottom: 12,
          }}>
            Mission Failed
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: "clamp(42px, 8vw, 60px)",
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.danger,
            margin: 0,
            marginBottom: 4,
            textShadow: `0 0 40px rgba(204,34,51,0.5), 0 0 80px rgba(204,34,51,0.2)`,
            letterSpacing: 6,
          }}>
            GAME OVER
          </h1>
        </FadeInItem>

        <FadeInItem delay={450}>
          <div style={{
            fontSize: "clamp(11px, 1.4vw, 13px)",
            color: "rgba(200,160,140,0.45)",
            fontFamily: THEME.fonts.body,
            fontStyle: "italic",
            marginTop: 4,
            marginBottom: 4,
            letterSpacing: 0.5,
          }}>
            Time ran out better luck next time traveller
          </div>
        </FadeInItem>

        <ScreenDivider color={THEME.colors.danger} delay={550} />

        <div style={{ display: "flex", gap: "clamp(10px, 2vw, 16px)", marginBottom: "clamp(12px, 2.5vh, 20px)", justifyContent: "center", flexWrap: "wrap" }}>
          <StatCard label="Level" value={level} color={THEME.colors.text} delay={600} />
          <StatCard label="Score" value={score.toLocaleString()} color={THEME.colors.gold} delay={700} icon={"\u{2B50}"} />
          <StatCard label="Oranges" value={`${collectiblesGathered}/${totalCollectibles}`} color={THEME.colors.primary} delay={800} icon={"\u{1F34A}"} />
        </div>


        <FadeInItem delay={1000}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
            <GameButton onClick={startGame} color="rgba(204,34,51,0.35)" glowColor={THEME.colors.dangerGlow} variant="danger">
              Try Again
            </GameButton>
            <GameButton onClick={backToStart} color="rgba(255,165,0,0.15)" glowColor={THEME.colors.goldGlow} variant="ghost">
              Menu
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

export function LevelCompleteScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const level = useGameState((s) => s.level);
  const levelsCompleted = useGameState((s) => s.levelsCompleted);
  const nextLevel = useGameState((s) => s.nextLevel);
  const timeRemaining = useGameState((s) => s.timeRemaining);

  if (screen !== "levelComplete") return null;

  const currentTheme = getThemeForLevel(level);
  const timeBonus = Math.floor(timeRemaining * 5);
  const isLastLevel = (levelsCompleted + 1) >= TOTAL_LEVELS;

  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(15,35,20,0.96) 0%, rgba(5,12,6,0.99) 100%)",
    }}>
      <style>{screenCSS}</style>
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "clamp(20px, 5vh, 40px) 24px", maxWidth: 520, margin: "auto 0" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 11,
            fontFamily: THEME.fonts.heading,
            color: "rgba(68,204,136,0.6)",
            textTransform: "uppercase",
            letterSpacing: 8,
            marginBottom: 12,
          }}>
            Stage Clear
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: "clamp(36px, 7vw, 52px)",
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.accent,
            margin: 0,
            marginBottom: 4,
            textShadow: `0 0 40px rgba(68,204,136,0.5), 0 0 80px rgba(68,204,136,0.2)`,
            letterSpacing: 4,
          }}>
            {currentTheme.name.toUpperCase()} CLEARED
          </h1>
        </FadeInItem>

        <ScreenDivider color={THEME.colors.accent} delay={500} />

        <div style={{ display: "flex", gap: "clamp(10px, 2vw, 16px)", marginBottom: "clamp(16px, 3vh, 24px)", justifyContent: "center", flexWrap: "wrap" }}>
          <StatCard label="Progress" value={`${levelsCompleted + 1}/${TOTAL_LEVELS}`} color={THEME.colors.accent} delay={600} icon="\u{2705}" />
          <StatCard label="Score" value={score.toLocaleString()} color={THEME.colors.gold} delay={700} icon="\u{2B50}" />
          <StatCard label="Time Bonus" value={`+${timeBonus}`} color="#66bbff" delay={800} icon="\u{23F1}\u{FE0F}" />
        </div>

        {!isLastLevel && (
          <FadeInItem delay={850}>
            <div style={{
              background: "linear-gradient(135deg, rgba(28,18,10,0.9), rgba(20,12,8,0.85))",
              border: `1px solid rgba(210,140,60,0.2)`,
              borderRadius: 12,
              padding: "clamp(10px, 2vh, 16px) clamp(16px, 4vw, 28px)",
              marginBottom: "clamp(16px, 3vh, 28px)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative" as const,
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}40, transparent)`,
              }} />
              <div style={{
                fontSize: 9,
                fontFamily: THEME.fonts.heading,
                color: THEME.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 3,
                marginBottom: 8,
              }}>
                Next Environment
              </div>
              <div style={{
                fontSize: 20,
                fontFamily: THEME.fonts.heading,
                fontWeight: 700,
                color: THEME.colors.primary,
                textShadow: `0 0 16px ${THEME.colors.primaryGlow}`,
                letterSpacing: 2,
              }}>
                ???
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: THEME.fonts.mono,
                color: THEME.colors.textMuted,
                marginTop: 4,
                letterSpacing: 1,
              }}>
                Stage {levelsCompleted + 2} of {TOTAL_LEVELS}
              </div>
            </div>
          </FadeInItem>
        )}

        <FadeInItem delay={950}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <GameButton onClick={nextLevel} color="rgba(68,204,136,0.3)" glowColor={THEME.colors.accentGlow} variant="primary">
              {isLastLevel ? "Finish" : "Next Level"}
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

export function VictoryScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const startGame = useGameState((s) => s.startGame);
  const backToStart = useGameState((s) => s.backToStart);

  if (screen !== "victory") return null;

  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(35,28,5,0.96) 0%, rgba(10,6,0,0.99) 100%)",
    }}>
      <style>{screenCSS}</style>
      <ParticleBackground />
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "clamp(20px, 5vh, 40px) 24px", maxWidth: 520, margin: "auto 0" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 11,
            fontFamily: THEME.fonts.heading,
            color: "rgba(255,165,0,0.6)",
            textTransform: "uppercase",
            letterSpacing: 8,
            marginBottom: 12,
          }}>
            All Mazes Conquered
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: "clamp(48px, 9vw, 68px)",
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            margin: 0,
            marginBottom: 4,
            background: `linear-gradient(135deg, ${THEME.colors.gold}, #ffdd66, ${THEME.colors.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 6,
            filter: "drop-shadow(0 0 30px rgba(255,165,0,0.3))",
          }}>
            VICTORY
          </h1>
        </FadeInItem>

        <ScreenDivider color={THEME.colors.gold} delay={500} />

        <FadeInItem delay={600}>
          <p style={{
            color: THEME.colors.textDim,
            fontSize: 15,
            marginBottom: 28,
            lineHeight: 1.8,
            maxWidth: 360,
            margin: "0 auto 28px",
          }}>
            You've conquered all {TOTAL_LEVELS} terrains — from the Stone Dungeon to Candy World. A true Maze Runner.
          </p>
        </FadeInItem>

        <div style={{ display: "flex", gap: "clamp(10px, 2vw, 16px)", marginBottom: "clamp(20px, 4vh, 32px)", justifyContent: "center", flexWrap: "wrap" }}>
          <StatCard label="Levels" value={`${TOTAL_LEVELS}/${TOTAL_LEVELS}`} color={THEME.colors.accent} delay={700} icon="\u{1F3C6}" />
          <StatCard label="Final Score" value={score.toLocaleString()} color={THEME.colors.gold} delay={800} icon="\u{2B50}" />
        </div>

        <FadeInItem delay={1100}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <GameButton onClick={startGame} color="rgba(255,165,0,0.3)" glowColor={THEME.colors.goldGlow} variant="primary">
              Play Again
            </GameButton>
            <GameButton onClick={backToStart} color="rgba(255,165,0,0.15)" glowColor={THEME.colors.goldGlow} variant="ghost">
              Menu
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

const LOADING_TIPS = [
  "Collect all gems before heading to the exit portal",
  "Watch out for decoy math gates off the main path",
  "Dead ends reset your streak multiplier",
  "Bonus oranges are hidden in dead ends",
  "Time pickups add 15 seconds to your clock",
  "The compass points toward the exit portal",
  "Your streak multiplier increases with each pickup",
  "Path sum gates are mandatory to unlock the portal",
];

export function LoadingScreen() {
  const screen = useGameState((s) => s.screen);
  const level = useGameState((s) => s.level);
  const [progress, setProgress] = useState(0);

  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const tip = useMemo(() => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)], [level]);

  useEffect(() => {
    if (screen !== "loading") {
      setProgress(0);
      return;
    }
    let raf: number;
    let start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / 2000, 0.92);
      setProgress(t);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  if (screen !== "loading") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(28,18,10,0.98), #080a14 70%)",
      fontFamily: THEME.fonts.body,
      color: THEME.colors.text,
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 40%, rgba(210,136,42,0.06) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        animation: "mazeCinematicFadeIn 0.6s ease-out forwards",
      }}>
        <div style={{
          fontFamily: THEME.fonts.heading,
          fontSize: "clamp(14px, 3vw, 18px)",
          fontWeight: 700,
          color: THEME.colors.primary,
          letterSpacing: 6,
          textTransform: "uppercase",
          textShadow: `0 0 30px ${THEME.colors.primaryGlow}`,
        }}>
          Entering
        </div>

        <div style={{
          fontFamily: THEME.fonts.heading,
          fontSize: "clamp(28px, 6vw, 48px)",
          fontWeight: 900,
          color: THEME.colors.text,
          letterSpacing: 4,
          textTransform: "uppercase",
          textShadow: `0 0 40px ${THEME.colors.primaryGlow}, 0 2px 20px rgba(0,0,0,0.8)`,
          textAlign: "center",
        }}>
          {theme.name}
        </div>

        <div style={{
          width: 80,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
          borderRadius: 1,
          boxShadow: `0 0 12px ${THEME.colors.primaryGlow}`,
        }} />

        <div style={{
          width: "clamp(200px, 50vw, 320px)",
          height: 4,
          background: "rgba(210,136,42,0.1)",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${THEME.colors.primary}, ${THEME.colors.gold})`,
            borderRadius: 2,
            boxShadow: `0 0 12px ${THEME.colors.primaryGlow}`,
            transition: "width 0.1s linear",
          }} />
        </div>

        <div style={{
          fontFamily: THEME.fonts.body,
          fontSize: "clamp(12px, 2.5vw, 15px)",
          color: THEME.colors.textDim,
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Generating Maze...
        </div>

        <div style={{
          marginTop: 16,
          padding: "12px 24px",
          background: "rgba(210,136,42,0.06)",
          border: `1px solid rgba(210,136,42,0.12)`,
          borderRadius: 8,
          maxWidth: 360,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 11,
            color: THEME.colors.primary,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: THEME.fonts.heading,
          }}>
            Tip
          </div>
          <div style={{
            fontSize: "clamp(13px, 2.5vw, 15px)",
            color: THEME.colors.textDim,
            lineHeight: 1.5,
            fontWeight: 400,
          }}>
            {tip}
          </div>
        </div>
      </div>
    </div>
  );
}
