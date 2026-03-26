import type { CSSProperties, ChangeEvent } from "react";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useGameState, TOTAL_LEVELS } from "./gameState";
import { THEME } from "./theme";
import { useAudioState, updateMasterVolume } from "./audioSystem";
import { getThemeForLevel } from "./levelThemes";

function VolumeControl() {
  const muted = useAudioState((s) => s.muted);
  const volume = useAudioState((s) => s.volume);
  const toggleMute = useAudioState((s) => s.toggleMute);
  const setVolume = useAudioState((s) => s.setVolume);

  const handleToggle = () => { toggleMute(); setTimeout(updateMasterVolume, 0); };
  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
    setTimeout(updateMasterVolume, 0);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      left: "clamp(8px, 1vw, 14px)",
      zIndex: 101,
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "linear-gradient(160deg, rgba(24,16,10,0.82), rgba(14,9,5,0.72))",
      borderRadius: 20,
      padding: "8px 16px",
      border: "1px solid rgba(210,140,60,0.1)",
      pointerEvents: "auto",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 6px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.2)",
    }}>
      <button
        onClick={handleToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          color: muted ? THEME.colors.danger : THEME.colors.primary,
          fontSize: 16,
          lineHeight: 1,
          fontFamily: "monospace",
          transition: "color 0.3s ease, transform 0.15s ease",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "\u{1F507}" : volume > 0.5 ? "\u{1F50A}" : "\u{1F509}"}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={handleVolumeChange}
        style={{ width: 60, height: 4, accentColor: THEME.colors.primary, cursor: "pointer" }}
      />
    </div>
  );
}

function FeedbackOverlay() {
  const lastFeedback = useGameState((s) => s.lastFeedback);
  const feedbackTimer = useGameState((s) => s.feedbackTimer);

  if (!lastFeedback || feedbackTimer <= 0) return null;

  const opacity = Math.min(1, feedbackTimer);
  const isDeadEnd = lastFeedback === "Dead End!";
  const isBonus = lastFeedback.includes("Bonus") || lastFeedback.includes("Time");
  const isDecoy = lastFeedback.includes("Decoy");
  const isPortalWarning = lastFeedback.includes("Portal") || lastFeedback.includes("Exceeded") || lastFeedback.includes("Needed");
  const isMath = lastFeedback.includes("Sum") && !isDecoy && !isPortalWarning;

  const color = isDeadEnd || isPortalWarning ? THEME.colors.danger : isDecoy ? "#cc6600" : isBonus ? THEME.colors.gold : isMath ? "#66bbff" : THEME.colors.accent;

  return (
    <div style={{
      position: "fixed",
      top: "28%",
      left: "50%",
      transform: `translate(-50%, -50%) scale(${1 + (1 - opacity) * 0.2})`,
      fontFamily: THEME.fonts.heading,
      fontSize: "clamp(20px, 3.5vw, 32px)",
      fontWeight: 800,
      color,
      textShadow: `0 0 24px ${color}, 0 0 48px ${color}80, 0 2px 4px rgba(0,0,0,0.5)`,
      opacity,
      letterSpacing: 4,
      textTransform: "uppercase",
      pointerEvents: "none",
      zIndex: 105,
      transition: "transform 0.15s ease",
    }}>
      {lastFeedback}
    </div>
  );
}

function DeadEndVignette() {
  const deadEndFlash = useGameState((s) => s.deadEndFlash);

  if (deadEndFlash <= 0) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 99,
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(200,30,30,${deadEndFlash * 0.35}) 100%)`,
      transition: "background 0.1s ease",
    }} />
  );
}

function StreakDisplay() {
  const streakCount = useGameState((s) => s.streakCount);
  const streakMultiplier = useGameState((s) => s.streakMultiplier);

  if (streakCount < 2) return null;

  return (
    <div style={{
      position: "fixed",
      top: "clamp(100px, 14vh, 140px)",
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: THEME.fonts.heading,
      fontSize: "clamp(12px, 1.4vw, 16px)",
      fontWeight: 700,
      color: THEME.colors.gold,
      textShadow: `0 0 16px rgba(255,165,0,0.5), 0 0 32px rgba(255,165,0,0.2)`,
      letterSpacing: 2,
      pointerEvents: "none",
      zIndex: 101,
      textTransform: "uppercase",
      background: "linear-gradient(160deg, rgba(24,16,10,0.85), rgba(14,9,5,0.75))",
      padding: "7px 20px",
      borderRadius: 20,
      border: "1px solid rgba(255,165,0,0.18)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 6px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,200,100,0.06) inset, inset 0 -1px 0 rgba(0,0,0,0.2)",
    }}>
      {streakCount}x Streak &bull; {streakMultiplier.toFixed(1)}x
    </div>
  );
}


function PauseButton() {
  const pauseGame = useGameState((s) => s.pauseGame);
  const screen = useGameState((s) => s.screen);
  const [hovered, setHovered] = useState(false);

  if (screen !== "playing") return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        pauseGame();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      title="Pause (Esc)"
      style={{
        position: "fixed",
        bottom: 10,
        right: "clamp(8px, 1vw, 14px)",
        zIndex: 101,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: hovered
          ? "linear-gradient(160deg, rgba(34,22,14,0.92), rgba(20,14,8,0.82))"
          : "linear-gradient(160deg, rgba(24,16,10,0.82), rgba(14,9,5,0.72))",
        borderRadius: 20,
        padding: "8px 16px",
        border: hovered
          ? "1px solid rgba(210,140,60,0.3)"
          : "1px solid rgba(210,140,60,0.1)",
        pointerEvents: "auto",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: hovered
          ? "0 6px 24px rgba(0,0,0,0.55), 0 0 16px rgba(210,136,42,0.15), 0 1px 0 rgba(255,255,255,0.06) inset"
          : "0 6px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.2)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        color: THEME.colors.primary,
        fontSize: 13,
        fontFamily: THEME.fonts.heading,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase" as const,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1" width="3.5" height="12" rx="1" fill={THEME.colors.primary} />
        <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill={THEME.colors.primary} />
      </svg>
      Pause
    </button>
  );
}

function AnimatedBorderCanvas({ width, height, accentColor, glowColor, hovered, borderRadius }: {
  width: number; height: number; accentColor: string; glowColor: string; hovered: boolean; borderRadius: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pad = 6;
    const cw = width + pad * 2;
    const ch = height + pad * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;

    const draw = (time: number) => {
      const isHov = hoveredRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const speed = isHov ? 0.002 : 0.001;
      const angle = time * speed;
      const ox = pad;
      const oy = pad;

      const grad = ctx.createConicGradient(angle, cw / 2, ch / 2);
      const alpha = isHov ? "ff" : "aa";
      const alphaDim = isHov ? "40" : "15";
      grad.addColorStop(0, accentColor + alphaDim);
      grad.addColorStop(0.15, accentColor + alpha);
      grad.addColorStop(0.25, glowColor + "ff");
      grad.addColorStop(0.35, accentColor + alpha);
      grad.addColorStop(0.5, accentColor + alphaDim);
      grad.addColorStop(0.65, accentColor + "08");
      grad.addColorStop(0.8, accentColor + alphaDim);
      grad.addColorStop(1, accentColor + alphaDim);

      ctx.beginPath();
      const bw = 2.5;
      ctx.roundRect(ox - bw, oy - bw, width + bw * 2, height + bw * 2, borderRadius + 2);
      ctx.roundRect(ox, oy, width, height, borderRadius);
      ctx.fillStyle = grad;
      ctx.fill("evenodd");

      if (isHov) {
        const glowGrad = ctx.createConicGradient(angle + Math.PI, cw / 2, ch / 2);
        glowGrad.addColorStop(0, accentColor + "00");
        glowGrad.addColorStop(0.2, accentColor + "18");
        glowGrad.addColorStop(0.3, glowColor + "30");
        glowGrad.addColorStop(0.4, accentColor + "18");
        glowGrad.addColorStop(0.5, accentColor + "00");
        glowGrad.addColorStop(1, accentColor + "00");

        ctx.beginPath();
        ctx.roundRect(ox - pad, oy - pad, width + pad * 2, height + pad * 2, borderRadius + 4);
        ctx.roundRect(ox - bw, oy - bw, width + bw * 2, height + bw * 2, borderRadius + 2);
        ctx.fillStyle = glowGrad;
        ctx.fill("evenodd");
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, accentColor, glowColor, borderRadius]);

  const pad = 6;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: -pad,
        left: -pad,
        width: width + pad * 2,
        height: height + pad * 2,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function PauseMenuButton({ onClick, onMouseOver, onMouseOut, hovered, pressed, accentColor, glowColor, children }: {
  onClick: () => void;
  onMouseOver: () => void;
  onMouseOut: () => void;
  hovered: boolean;
  pressed: boolean;
  accentColor: string;
  glowColor: string;
  children: React.ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dims, setDims] = useState({ w: 280, h: 56 });

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setDims((prev) => {
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (prev.w === w && prev.h === h) return prev;
        return { w, h };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={{
        position: "relative",
        overflow: "visible",
        width: "clamp(240px, 42vw, 320px)",
        padding: "clamp(16px, 2.5vh, 22px) clamp(36px, 6vw, 56px)",
        fontSize: "clamp(14px, 1.8vw, 17px)",
        fontWeight: 800,
        fontFamily: THEME.fonts.heading,
        borderRadius: 10,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: 4,
        border: "none",
        background: hovered
          ? `linear-gradient(160deg, rgba(38,24,14,0.98), rgba(20,12,6,0.99))`
          : `linear-gradient(160deg, rgba(26,16,10,0.97), rgba(12,7,3,0.98))`,
        color: hovered ? "#fff" : THEME.colors.text,
        transform: pressed ? "scale(0.96)" : hovered ? "translateY(-3px) scale(1.02)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.2,0.8,0.2,1)",
        outline: "none",
        boxShadow: hovered
          ? `0 0 40px ${accentColor}25, 0 14px 44px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)`
          : `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.2)`,
      }}
    >
      <AnimatedBorderCanvas
        width={dims.w}
        height={dims.h}
        accentColor={accentColor}
        glowColor={glowColor}
        hovered={hovered}
        borderRadius={10}
      />

      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: hovered
          ? `linear-gradient(90deg, transparent 5%, ${glowColor}60 30%, ${glowColor}90 50%, ${glowColor}60 70%, transparent 95%)`
          : `linear-gradient(90deg, transparent 10%, ${accentColor}30 35%, ${accentColor}50 50%, ${accentColor}30 65%, transparent 90%)`,
        borderRadius: "10px 10px 0 0",
        transition: "background 0.3s ease",
      }} />

      {hovered && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
          borderRadius: "10px 10px 0 0",
          background: `radial-gradient(ellipse at top center, ${accentColor}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 10,
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "60%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${accentColor}0a, ${accentColor}14, ${accentColor}0a, transparent)`,
          animation: hovered ? "pauseShine 1.5s ease-in-out infinite" : "pauseShine 4s ease-in-out infinite",
        }} />
      </div>

      <span style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        filter: hovered ? `drop-shadow(0 0 10px ${accentColor}70)` : "none",
        transition: "filter 0.3s ease",
      }}>
        {children}
      </span>
    </button>
  );
}

function PauseOverlay() {
  const screen = useGameState((s) => s.screen);
  const resumeGame = useGameState((s) => s.resumeGame);
  const exitGame = useGameState((s) => s.exitGame);
  const [exitHovered, setExitHovered] = useState(false);
  const [resumeHovered, setResumeHovered] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [resumePressed, setResumePressed] = useState(false);
  const [exitPressed, setExitPressed] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (screen === "paused") {
      requestAnimationFrame(() => setFadeIn(true));
    } else {
      setFadeIn(false);
    }
  }, [screen]);

  const handleResume = useCallback(() => {
    resumeGame();
    setTimeout(() => {
      const canvas = document.querySelector("canvas");
      if (canvas && !document.pointerLockElement) {
        try {
          canvas.requestPointerLock();
        } catch (_) {}
      }
    }, 100);
  }, [resumeGame]);

  const handleExit = useCallback(() => {
    if (!exitConfirm) {
      setExitConfirm(true);
      return;
    }
    exitGame();
  }, [exitConfirm, exitGame]);

  useEffect(() => {
    if (screen !== "paused") {
      setExitConfirm(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        resumeGame();
        setTimeout(() => {
          const canvas = document.querySelector("canvas");
          if (canvas && !document.pointerLockElement) {
            try {
              canvas.requestPointerLock();
            } catch (_) {}
          }
        }, 100);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, resumeGame]);

  if (screen !== "paused") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 150,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: fadeIn ? "rgba(6,4,2,0.88)" : "rgba(6,4,2,0)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transition: "background 0.4s ease",
      pointerEvents: "auto",
    }}>
      <style>{`
        @keyframes pauseShine {
          0% { transform: translateX(0); }
          100% { transform: translateX(500%); }
        }
        @keyframes pauseTitleGlow {
          0%, 100% { text-shadow: 0 0 30px rgba(210,136,42,0.3), 0 0 60px rgba(210,136,42,0.1), 0 4px 12px rgba(0,0,0,0.5); }
          50% { text-shadow: 0 0 50px rgba(210,136,42,0.6), 0 0 100px rgba(210,136,42,0.25), 0 0 8px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.5); }
        }
        @keyframes pauseIconPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes pauseFadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        animation: "pauseFadeSlideIn 0.4s ease forwards",
      }}>
        <div style={{
          fontSize: "clamp(32px, 4vw, 42px)",
          marginBottom: "clamp(8px, 1.5vh, 14px)",
          animation: "pauseIconPulse 3s ease-in-out infinite",
          filter: `drop-shadow(0 0 12px ${THEME.colors.primary}60)`,
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke={THEME.colors.primary} strokeWidth="2" strokeOpacity="0.3" fill="none" />
            <rect x="13" y="12" width="5" height="16" rx="1.5" fill={THEME.colors.primary} fillOpacity="0.8" />
            <rect x="22" y="12" width="5" height="16" rx="1.5" fill={THEME.colors.primary} fillOpacity="0.8" />
          </svg>
        </div>

        <div style={{
          fontFamily: THEME.fonts.heading,
          fontSize: "clamp(32px, 6vw, 52px)",
          fontWeight: 900,
          color: THEME.colors.primary,
          animation: "pauseTitleGlow 4s ease-in-out infinite",
          letterSpacing: 8,
          textTransform: "uppercase",
          marginBottom: "clamp(6px, 1vh, 10px)",
        }}>
          Paused
        </div>

        <div style={{
          width: "clamp(100px, 35vw, 200px)",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}80, ${THEME.colors.primary}, ${THEME.colors.primary}80, transparent)`,
          borderRadius: 1,
          boxShadow: `0 0 16px ${THEME.colors.primary}30, 0 0 4px ${THEME.colors.primary}50`,
          marginBottom: "clamp(28px, 5vh, 48px)",
        }} />

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(14px, 2.2vh, 20px)",
          alignItems: "center",
          marginBottom: "clamp(20px, 3.5vh, 36px)",
        }}>
          <PauseMenuButton
            onClick={handleResume}
            onMouseOver={() => setResumeHovered(true)}
            onMouseOut={() => { setResumeHovered(false); setResumePressed(false); }}
            hovered={resumeHovered}
            pressed={resumePressed}
            accentColor="#44cc88"
            glowColor="#88ffcc"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 2.5L15 9L4 15.5V2.5Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
            Resume
          </PauseMenuButton>

          <PauseMenuButton
            onClick={handleExit}
            onMouseOver={() => setExitHovered(true)}
            onMouseOut={() => { setExitHovered(false); setExitPressed(false); setExitConfirm(false); }}
            hovered={exitHovered}
            pressed={exitPressed}
            accentColor="#cc2233"
            glowColor="#ff4466"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 3H14.5C15.05 3 15.5 3.45 15.5 4V14C15.5 14.55 15.05 15 14.5 15H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M2.5 9H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M8.5 5.5L12 9L8.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            {exitConfirm ? "Confirm Exit?" : "Exit Game"}
          </PauseMenuButton>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: THEME.fonts.body,
          fontSize: "clamp(11px, 1.3vw, 13px)",
          color: THEME.colors.textDim,
          letterSpacing: 2,
        }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3px 8px",
            borderRadius: 5,
            border: `1px solid ${THEME.colors.textDim}40`,
            background: "rgba(255,255,255,0.03)",
            fontFamily: THEME.fonts.heading,
            fontSize: "clamp(9px, 1vw, 11px)",
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            ESC
          </span>
          to resume
        </div>
      </div>
    </div>
  );
}

export function HUD() {
  const score = useGameState((s) => s.score);
  const level = useGameState((s) => s.level);
  const timeRemaining = useGameState((s) => s.timeRemaining);
  const setTimeRemaining = useGameState((s) => s.setTimeRemaining);
  const collectiblesGathered = useGameState((s) => s.collectiblesGathered);
  const totalCollectibles = useGameState((s) => s.totalCollectibles);
  const screen = useGameState((s) => s.screen);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTheme = useMemo(() => getThemeForLevel(level), [level]);

  useEffect(() => {
    if (screen !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const currentTime = useGameState.getState().timeRemaining;
      setTimeRemaining(currentTime - 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, setTimeRemaining]);

  if (screen !== "playing" && screen !== "paused") return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeWarning = timeRemaining <= 30;
  const timeCritical = timeRemaining <= 10;
  const allCollected = collectiblesGathered >= totalCollectibles;

  const panelStyle: CSSProperties = {
    background: "linear-gradient(160deg, rgba(24,16,10,0.85), rgba(14,9,5,0.75))",
    borderRadius: 18,
    padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.6vw, 20px)",
    border: "1px solid rgba(210,140,60,0.1)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)",
    position: "relative" as const,
    overflow: "hidden",
    transition: "border-color 0.4s ease, box-shadow 0.4s ease",
  };

  const labelStyle: CSSProperties = {
    fontSize: "clamp(7px, 0.7vw, 9px)",
    color: THEME.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 3,
    fontFamily: THEME.fonts.heading,
    marginBottom: 5,
  };

  const valueStyle: CSSProperties = {
    fontFamily: THEME.fonts.heading,
    fontWeight: 700,
    color: THEME.colors.text,
    letterSpacing: 0.5,
  };

  const accentLine = (color: string): CSSProperties => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: `linear-gradient(90deg, transparent 5%, ${color} 35%, ${color} 65%, transparent 95%)`,
    borderRadius: "18px 18px 0 0",
    opacity: 0.7,
  });

  const innerGlow = (color: string): CSSProperties => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    background: `radial-gradient(ellipse at top center, ${color}08 0%, transparent 70%)`,
    pointerEvents: "none" as const,
    borderRadius: "18px 18px 0 0",
  });

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      zIndex: 100,
      fontFamily: THEME.fonts.body,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "clamp(8px, 1.4vw, 18px) clamp(8px, 1.6vw, 24px)",
        gap: "clamp(6px, 1.2vw, 16px)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 0.7vw, 10px)", flexShrink: 1, minWidth: 0 }}>
          <div style={panelStyle}>
            <div style={accentLine(THEME.colors.primary)} />
            <div style={innerGlow(THEME.colors.primary)} />
            <div style={labelStyle}>Level</div>
            <div style={{ ...valueStyle, fontSize: "clamp(20px, 2.4vw, 26px)", color: THEME.colors.primary }}>
              {level}
              <span style={{ fontSize: "clamp(9px, 1vw, 11px)", color: THEME.colors.textDim, fontWeight: 400, marginLeft: 3 }}>/{TOTAL_LEVELS}</span>
            </div>
            <div style={{
              fontSize: "clamp(8px, 0.8vw, 9px)",
              fontFamily: THEME.fonts.heading,
              color: THEME.colors.textMuted,
              letterSpacing: 1.5,
              marginTop: 4,
            }}>
              {levelTheme.name}
            </div>
          </div>
          <div style={panelStyle}>
            <div style={accentLine(THEME.colors.gold)} />
            <div style={innerGlow(THEME.colors.gold)} />
            <div style={labelStyle}>Score</div>
            <div style={{
              ...valueStyle,
              fontSize: "clamp(18px, 2.2vw, 24px)",
              color: THEME.colors.gold,
              textShadow: `0 0 16px rgba(255,165,0,0.2)`,
            }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(6px, 0.7vw, 10px)", flexShrink: 1 }}>
          <div style={{
            ...panelStyle,
            borderColor: timeCritical ? "rgba(255,34,68,0.3)" : timeWarning ? "rgba(255,34,68,0.15)" : "rgba(210,140,60,0.1)",
            boxShadow: timeCritical
              ? "0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(255,34,68,0.12), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)"
              : "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)",
            textAlign: "center",
            minWidth: "clamp(90px, 10vw, 120px)",
          }}>
            <div style={accentLine(
              timeCritical ? THEME.colors.danger : timeWarning ? "#ff8844" : "rgba(210,140,60,0.5)"
            )} />
            <div style={innerGlow(
              timeCritical ? THEME.colors.danger : timeWarning ? "#ff8844" : "rgba(210,140,60,0.3)"
            )} />
            <div style={labelStyle}>Time</div>
            <div style={{
              ...valueStyle,
              fontSize: "clamp(22px, 2.8vw, 32px)",
              fontVariantNumeric: "tabular-nums",
              color: timeCritical ? THEME.colors.danger : timeWarning ? "#ff8844" : THEME.colors.text,
              textShadow: timeCritical
                ? `0 0 20px ${THEME.colors.danger}80, 0 0 40px ${THEME.colors.danger}40`
                : timeWarning
                  ? "0 0 12px rgba(255,136,68,0.3)"
                  : "none",
              animation: timeCritical ? "timePulse 1s ease-in-out infinite" : "none",
            }}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "clamp(6px, 0.7vw, 10px)", flexShrink: 1, minWidth: 0 }}>
          <div style={{
            ...panelStyle,
            borderColor: allCollected ? "rgba(68,204,136,0.22)" : "rgba(210,140,60,0.1)",
            boxShadow: allCollected
              ? "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(68,204,136,0.08), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)"
              : "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset, inset 0 -1px 0 rgba(0,0,0,0.15)",
          }}>
            <div style={accentLine(
              allCollected ? THEME.colors.accent : "rgba(255,140,0,0.5)"
            )} />
            <div style={innerGlow(
              allCollected ? THEME.colors.accent : THEME.colors.gold
            )} />
            <div style={labelStyle}>Oranges</div>
            <div style={{ ...valueStyle, fontSize: "clamp(18px, 2vw, 22px)", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: "clamp(14px, 1.6vw, 18px)" }}>&#x1F34A;</span>
              <span style={{
                color: allCollected ? THEME.colors.accent : THEME.colors.gold,
                textShadow: allCollected ? `0 0 12px ${THEME.colors.accent}40` : "none",
                transition: "color 0.4s ease, text-shadow 0.4s ease",
              }}>
                {collectiblesGathered}
              </span>
              <span style={{ color: THEME.colors.textDim, fontWeight: 400, fontSize: "clamp(10px, 1.1vw, 13px)" }}>/</span>
              <span style={{ color: THEME.colors.textDim, fontWeight: 400, fontSize: "clamp(11px, 1.2vw, 14px)" }}>{totalCollectibles}</span>
            </div>
            {totalCollectibles > 0 && (
              <div style={{
                width: "100%",
                height: 4,
                background: "rgba(255,140,0,0.06)",
                borderRadius: 6,
                marginTop: 7,
                overflow: "hidden",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
              }}>
                <div style={{
                  width: `${(collectiblesGathered / totalCollectibles) * 100}%`,
                  height: "100%",
                  background: allCollected
                    ? `linear-gradient(90deg, ${THEME.colors.accent}, #88ffcc)`
                    : `linear-gradient(90deg, #cc6600, ${THEME.colors.gold})`,
                  borderRadius: 6,
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: allCollected ? `0 0 8px ${THEME.colors.accent}50, 0 0 3px ${THEME.colors.accent}30` : "0 0 4px rgba(255,165,0,0.15)",
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes timePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <VolumeControl />
      <PauseButton />
      <PauseOverlay />
      <StreakDisplay />
      <FeedbackOverlay />
      <DeadEndVignette />

      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        width: 28,
        height: 28,
      }}>
        <div style={{
          width: 2,
          height: 12,
          background: "rgba(255,255,255,0.35)",
          position: "absolute",
          top: 0,
          left: 13,
          borderRadius: 2,
          boxShadow: "0 0 4px rgba(255,255,255,0.1)",
        }} />
        <div style={{
          width: 2,
          height: 12,
          background: "rgba(255,255,255,0.35)",
          position: "absolute",
          bottom: 0,
          left: 13,
          borderRadius: 2,
          boxShadow: "0 0 4px rgba(255,255,255,0.1)",
        }} />
        <div style={{
          width: 12,
          height: 2,
          background: "rgba(255,255,255,0.35)",
          position: "absolute",
          top: 13,
          left: 0,
          borderRadius: 2,
          boxShadow: "0 0 4px rgba(255,255,255,0.1)",
        }} />
        <div style={{
          width: 12,
          height: 2,
          background: "rgba(255,255,255,0.35)",
          position: "absolute",
          top: 13,
          right: 0,
          borderRadius: 2,
          boxShadow: "0 0 4px rgba(255,255,255,0.1)",
        }} />
        <div style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.45)",
          position: "absolute",
          top: 12,
          left: 12,
          boxShadow: "0 0 6px rgba(255,255,255,0.15)",
        }} />
      </div>
    </div>
  );
}
