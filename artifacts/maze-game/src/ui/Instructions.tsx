import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import { useGameState } from "../engine/gameState";
import { THEME } from "./theme";

const instructionsCSS = `
@keyframes instrFadeIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes instrSlideLeft {
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes instrSlideRight {
  from { opacity: 0; transform: translateX(-60px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes instrPulseGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(210,136,42,0.15), inset 0 1px 0 rgba(255,255,255,0.04); }
  50% { box-shadow: 0 0 24px rgba(210,136,42,0.3), inset 0 1px 0 rgba(255,255,255,0.06); }
}
@keyframes instrFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes instrSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

function KeyCap({ label, wide, size = 38 }: { label: string; wide?: boolean; size?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: wide ? size * 2.2 : size,
        height: size,
        borderRadius: 6,
        background: hovered
          ? "linear-gradient(180deg, rgba(60,45,25,0.95), rgba(40,28,14,0.9))"
          : "linear-gradient(180deg, rgba(45,32,18,0.9), rgba(28,18,10,0.85))",
        border: `1px solid ${hovered ? "rgba(210,140,60,0.5)" : "rgba(210,140,60,0.2)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: THEME.fonts.heading,
        fontSize: wide ? 10 : 13,
        fontWeight: 700,
        color: hovered ? "#fff" : THEME.colors.text,
        letterSpacing: 1,
        boxShadow: hovered
          ? "0 0 16px rgba(210,136,42,0.3), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "all 0.2s ease",
        cursor: "default",
        textTransform: "uppercase",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

function MouseIcon() {
  return (
    <div style={{
      width: 36,
      height: 54,
      borderRadius: "12px 12px 18px 18px",
      border: "2px solid rgba(210,140,60,0.35)",
      background: "linear-gradient(180deg, rgba(45,32,18,0.6), rgba(28,18,10,0.5))",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{
        width: 1,
        height: 20,
        background: "rgba(210,140,60,0.25)",
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
      }} />
      <div style={{
        width: 6,
        height: 12,
        borderRadius: 3,
        background: "linear-gradient(180deg, rgba(210,136,42,0.7), rgba(210,136,42,0.3))",
        marginTop: 6,
        boxShadow: "0 0 8px rgba(210,136,42,0.3)",
      }} />
      <div style={{
        position: "absolute",
        top: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderBottom: "6px solid rgba(210,136,42,0.5)",
      }} />
      <div style={{
        position: "absolute",
        bottom: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "6px solid rgba(210,136,42,0.5)",
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: -8,
        transform: "translateY(-50%)",
        width: 0,
        height: 0,
        borderTop: "5px solid transparent",
        borderBottom: "5px solid transparent",
        borderRight: "6px solid rgba(210,136,42,0.5)",
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        right: -8,
        transform: "translateY(-50%)",
        width: 0,
        height: 0,
        borderTop: "5px solid transparent",
        borderBottom: "5px solid transparent",
        borderLeft: "6px solid rgba(210,136,42,0.5)",
      }} />
    </div>
  );
}

function CollectibleIcon({ color, size = 20, glow }: { color: string; size?: number; glow?: string }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, ${color}, ${color}88)`,
      boxShadow: glow || `0 0 10px ${color}60`,
      flexShrink: 0,
    }} />
  );
}

function PortalIcon() {
  return (
    <div style={{
      width: 28,
      height: 36,
      borderRadius: "14px 14px 4px 4px",
      border: "2px solid rgba(68,204,136,0.6)",
      background: "radial-gradient(ellipse at 50% 60%, rgba(68,204,136,0.25), transparent)",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 16px rgba(68,204,136,0.3)",
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: THEME.colors.accent,
        boxShadow: `0 0 12px ${THEME.colors.accent}`,
        animation: "instrFloat 2s ease-in-out infinite",
      }} />
    </div>
  );
}

function TimerIcon() {
  return (
    <div style={{
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: "2px solid rgba(210,140,60,0.5)",
      background: "rgba(28,18,10,0.6)",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 2,
        height: 8,
        background: THEME.colors.primary,
        position: "absolute",
        bottom: "50%",
        left: "50%",
        transformOrigin: "bottom center",
        transform: "translateX(-50%) rotate(30deg)",
        borderRadius: 1,
      }} />
      <div style={{
        width: 2,
        height: 6,
        background: THEME.colors.danger,
        position: "absolute",
        bottom: "50%",
        left: "50%",
        transformOrigin: "bottom center",
        transform: "translateX(-50%) rotate(150deg)",
        borderRadius: 1,
      }} />
      <div style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: THEME.colors.primary,
      }} />
    </div>
  );
}

function MathGateIcon({ color, value }: { color: string; value: string }) {
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: "50%",
      border: `2px solid ${color}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: THEME.fonts.heading,
      fontSize: 12,
      fontWeight: 700,
      color,
      background: `radial-gradient(circle, ${color}15, transparent)`,
      boxShadow: `0 0 10px ${color}40`,
    }}>
      {value}
    </div>
  );
}

function StreakIcon() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderBottom: "14px solid #ffa500",
        filter: "drop-shadow(0 0 6px rgba(255,165,0,0.5))",
        position: "relative",
      }} />
      <span style={{
        fontFamily: THEME.fonts.heading,
        fontSize: 14,
        fontWeight: 800,
        color: THEME.colors.gold,
        textShadow: `0 0 8px ${THEME.colors.goldGlow}`,
      }}>
        3x
      </span>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 0",
    }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36 }}>
        {icon}
      </div>
      <span style={{
        fontFamily: THEME.fonts.body,
        fontSize: "clamp(13px, 1.6vw, 15px)",
        color: THEME.colors.text,
        lineHeight: 1.5,
      }}>
        {text}
      </span>
    </div>
  );
}

function HudMockup() {
  const labelStyle: CSSProperties = {
    fontFamily: THEME.fonts.body,
    fontSize: 9,
    color: THEME.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const boxStyle: CSSProperties = {
    background: "rgba(28,18,10,0.7)",
    border: "1px solid rgba(210,140,60,0.2)",
    borderRadius: 6,
    padding: "6px 10px",
    backdropFilter: "blur(8px)",
  };

  const mockText: CSSProperties = {
    fontFamily: THEME.fonts.heading,
    fontSize: 11,
    color: THEME.colors.text,
    letterSpacing: 1,
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 380,
      aspectRatio: "16/9",
      background: "linear-gradient(135deg, rgba(20,14,8,0.9), rgba(12,8,4,0.85))",
      border: "1px solid rgba(210,140,60,0.15)",
      borderRadius: 10,
      position: "relative",
      overflow: "hidden",
      margin: "0 auto",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(210,136,42,0.03), transparent 70%)",
      }} />

      <div style={{ position: "absolute", top: 8, left: 10, ...boxStyle }}>
        <div style={labelStyle}>Level & Score</div>
        <div style={mockText}>LVL 1 &bull; 1250</div>
      </div>

      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", ...boxStyle }}>
        <div style={labelStyle}>Timer</div>
        <div style={{ ...mockText, color: THEME.colors.text }}>02:45</div>
      </div>

      <div style={{ position: "absolute", top: 8, right: 10, ...boxStyle }}>
        <div style={labelStyle}>Oranges</div>
        <div style={mockText}>8 / 12</div>
        <div style={{
          width: "100%",
          height: 3,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 2,
          marginTop: 3,
          overflow: "hidden",
        }}>
          <div style={{
            width: "66%",
            height: "100%",
            background: `linear-gradient(90deg, ${THEME.colors.primary}, ${THEME.colors.gold})`,
            borderRadius: 2,
          }} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 8, left: 10, ...boxStyle, padding: "4px 8px" }}>
        <div style={labelStyle}>Volume</div>
      </div>

      <div style={{ position: "absolute", bottom: 8, right: 10, ...boxStyle, padding: "4px 8px" }}>
        <div style={labelStyle}>Pause</div>
      </div>

      <div style={{
        position: "absolute",
        top: "50%",
        right: 10,
        transform: "translateY(-50%)",
        ...boxStyle,
        padding: "4px 6px",
      }}>
        <div style={labelStyle}>Minimap</div>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: "rgba(210,136,42,0.08)",
          border: "1px solid rgba(210,140,60,0.15)",
          marginTop: 3,
        }} />
      </div>

      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}>
        <div style={{
          width: 16,
          height: 16,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(210,140,60,0.4)",
          }} />
          <div style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(210,140,60,0.4)",
          }} />
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: THEME.colors.primary,
            transform: "translate(-50%, -50%)",
          }} />
        </div>
      </div>
    </div>
  );
}

function DeadEndIcon() {
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: "50%",
      border: "2px solid rgba(204,34,51,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle, rgba(204,34,51,0.15), transparent)",
      boxShadow: "0 0 10px rgba(204,34,51,0.3)",
    }}>
      <div style={{
        fontFamily: THEME.fonts.heading,
        fontSize: 16,
        fontWeight: 900,
        color: THEME.colors.danger,
        lineHeight: 1,
      }}>!</div>
    </div>
  );
}

function TimePickupIcon() {
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      border: "2px solid rgba(80,160,255,0.5)",
      background: "radial-gradient(circle at 35% 35%, rgba(80,160,255,0.4), rgba(40,100,200,0.15))",
      boxShadow: "0 0 10px rgba(80,160,255,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <span style={{
        fontFamily: THEME.fonts.heading,
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(140,200,255,0.9)",
      }}>+</span>
    </div>
  );
}

const slideData = [
  {
    title: "MOVEMENT & CONTROLS",
    subtitle: "How to navigate the maze",
  },
  {
    title: "YOUR MISSION",
    subtitle: "What you need to do",
  },
  {
    title: "READING YOUR HUD",
    subtitle: "Understanding the screen layout",
  },
  {
    title: "PRO TIPS",
    subtitle: "Advanced mechanics to master",
  },
];

function SlideControls() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 20,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{
            display: "flex",
            gap: 4,
            flexDirection: "column",
            alignItems: "center",
          }}>
            <KeyCap label="W" />
            <div style={{ display: "flex", gap: 4 }}>
              <KeyCap label="A" />
              <KeyCap label="S" />
              <KeyCap label="D" />
            </div>
          </div>
          <span style={{
            fontFamily: THEME.fonts.body,
            fontSize: 11,
            color: THEME.colors.textDim,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginTop: 4,
          }}>
            Move
          </span>
        </div>

        <div style={{
          width: 1,
          height: 70,
          background: "linear-gradient(180deg, transparent, rgba(210,140,60,0.2), transparent)",
        }} />

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}>
          <MouseIcon />
          <span style={{
            fontFamily: THEME.fonts.body,
            fontSize: 11,
            color: THEME.colors.textDim,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Look Around
          </span>
        </div>

        <div style={{
          width: 1,
          height: 70,
          background: "linear-gradient(180deg, transparent, rgba(210,140,60,0.2), transparent)",
        }} />

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}>
          <KeyCap label="ESC" wide size={36} />
          <span style={{
            fontFamily: THEME.fonts.body,
            fontSize: 11,
            color: THEME.colors.textDim,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Pause
          </span>
        </div>
      </div>

      <div style={{
        fontFamily: THEME.fonts.body,
        fontSize: "clamp(12px, 1.5vw, 14px)",
        color: THEME.colors.textMuted,
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: 400,
      }}>
        Click the game screen to lock your mouse for camera control.
        <br />
        Arrow keys also work for movement.
      </div>
    </div>
  );
}

function SlideMission() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <InfoRow
        icon={<CollectibleIcon color="#ff8c00" size={22} glow="0 0 12px rgba(255,140,0,0.5)" />}
        text="Collect all the oranges scattered throughout the maze. Your progress is tracked at the top-right of the screen."
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={<PortalIcon />}
        text="Reach the exit portal once all oranges are collected. The portal unlocks when you've gathered every one."
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={<TimerIcon />}
        text="Beat the clock! Each level has a time limit. When it runs low, the timer turns red and pulses to warn you."
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={<CollectibleIcon color="#ffd700" size={18} glow="0 0 10px rgba(255,215,0,0.5)" />}
        text="Look for bonus gems for extra points. They're golden and worth more with a higher streak multiplier."
      />
    </div>
  );
}

function SlideHud() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
    }}>
      <HudMockup />
      <div style={{
        fontFamily: THEME.fonts.body,
        fontSize: "clamp(12px, 1.5vw, 14px)",
        color: THEME.colors.textMuted,
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: 380,
      }}>
        Everything you need is on-screen. Level and score at top-left,
        countdown timer at top-center, oranges progress at top-right.
        The minimap shows your position in the maze.
      </div>
    </div>
  );
}

function SlideProTips() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <InfoRow
        icon={<StreakIcon />}
        text="Collect items consecutively to build a streak multiplier (up to 3x). More points per pickup!"
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={<DeadEndIcon />}
        text="Dead ends flash the screen red and reset your streak. Try to avoid them to keep your multiplier high."
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={
          <div style={{ display: "flex", gap: 4 }}>
            <MathGateIcon color="#4488ff" value="+3" />
          </div>
        }
        text="Math Gates are number rings in later levels. Blue gates count toward the sum, purple gates are decoys — avoid those!"
      />
      <div style={{
        width: "80%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(210,140,60,0.1), transparent)",
        margin: "2px auto",
      }} />
      <InfoRow
        icon={<TimePickupIcon />}
        text="Blue glowing pickups add bonus seconds to your timer. Grab them when you see them!"
      />
    </div>
  );
}

const SLIDES = [SlideControls, SlideMission, SlideHud, SlideProTips];

function NavButton({ onClick, label, variant = "default" }: {
  onClick: () => void;
  label: string;
  variant?: "default" | "primary" | "skip";
}) {
  const [hovered, setHovered] = useState(false);

  const isPrimary = variant === "primary";
  const isSkip = variant === "skip";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: isSkip ? "6px 16px" : isPrimary ? "12px 36px" : "10px 24px",
        fontFamily: THEME.fonts.heading,
        fontSize: isSkip ? 10 : isPrimary ? 14 : 12,
        fontWeight: 700,
        letterSpacing: isSkip ? 3 : 2,
        textTransform: "uppercase",
        border: isSkip
          ? "1px solid rgba(255,255,255,0.08)"
          : isPrimary
            ? `1px solid rgba(210,140,60,${hovered ? 0.6 : 0.3})`
            : `1px solid rgba(255,255,255,${hovered ? 0.15 : 0.08})`,
        borderRadius: isSkip ? 4 : 8,
        cursor: "pointer",
        background: isSkip
          ? (hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)")
          : isPrimary
            ? (hovered
              ? "linear-gradient(135deg, rgba(210,136,42,0.35), rgba(180,110,30,0.25))"
              : "linear-gradient(135deg, rgba(210,136,42,0.2), rgba(180,110,30,0.12))")
            : (hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)"),
        color: isSkip
          ? (hovered ? THEME.colors.text : THEME.colors.textDim)
          : isPrimary
            ? (hovered ? "#fff" : THEME.colors.text)
            : (hovered ? THEME.colors.text : THEME.colors.textDim),
        boxShadow: isPrimary && hovered
          ? "0 0 20px rgba(210,136,42,0.25), 0 4px 16px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "all 0.25s ease",
        transform: hovered && !isSkip ? "translateY(-1px)" : "translateY(0)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {label}
    </button>
  );
}

export function InstructionsScreen() {
  const screen = useGameState((s) => s.screen);
  const beginPlaying = useGameState((s) => s.beginPlaying);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("left");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (screen === "instructions") {
      setCurrentSlide(0);
      setAnimDir("left");
      setAnimKey(0);
    }
  }, [screen]);

  if (screen !== "instructions") return null;

  const isLast = currentSlide === SLIDES.length - 1;
  const isFirst = currentSlide === 0;
  const SlideContent = SLIDES[currentSlide];
  const data = slideData[currentSlide];

  const goNext = () => {
    if (isLast) {
      beginPlaying();
      return;
    }
    setAnimDir("left");
    setAnimKey((k) => k + 1);
    setCurrentSlide((s) => s + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setAnimDir("right");
    setAnimKey((k) => k + 1);
    setCurrentSlide((s) => s - 1);
  };

  const skip = () => {
    beginPlaying();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(28,18,10,0.98), rgba(10,6,3,1) 70%)",
      zIndex: 200,
      fontFamily: THEME.fonts.body,
      color: THEME.colors.text,
      overflow: "hidden",
    }}>
      <style>{instructionsCSS}</style>

      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 3px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <button
        onClick={skip}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = "#fff";
          el.style.borderColor = "rgba(210,136,42,0.5)";
          el.style.background = "linear-gradient(135deg, rgba(210,136,42,0.2), rgba(180,110,30,0.1))";
          el.style.boxShadow = "0 0 16px rgba(210,136,42,0.15), 0 2px 8px rgba(0,0,0,0.3)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = "rgba(255,255,255,0.55)";
          el.style.borderColor = "rgba(255,255,255,0.12)";
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          el.style.transform = "translateY(0)";
        }}
        style={{
          position: "absolute",
          top: "clamp(16px, 2.5vh, 28px)",
          right: "clamp(16px, 2.5vw, 32px)",
          zIndex: 10,
          padding: "10px 28px",
          fontFamily: THEME.fonts.heading,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6,
          cursor: "pointer",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        }}
      >
        SKIP
      </button>

      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 560,
        padding: "0 clamp(16px, 3vw, 32px)",
        maxHeight: "90vh",
        overflow: "hidden",
      }}>
        <div style={{
          fontFamily: THEME.fonts.heading,
          fontSize: 10,
          letterSpacing: 4,
          color: THEME.colors.textMuted,
          textTransform: "uppercase",
          marginBottom: 6,
          animation: "instrFadeIn 0.5s ease forwards",
        }}>
          {currentSlide + 1} / {SLIDES.length}
        </div>

        <h2 style={{
          fontFamily: THEME.fonts.heading,
          fontSize: "clamp(20px, 3.5vw, 30px)",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: 3,
          textTransform: "uppercase",
          margin: "0 0 4px",
          textShadow: `0 0 20px ${THEME.colors.primaryGlow}`,
          textAlign: "center",
        }}>
          {data.title}
        </h2>

        <div style={{
          fontFamily: THEME.fonts.body,
          fontSize: "clamp(12px, 1.5vw, 14px)",
          color: THEME.colors.textDim,
          letterSpacing: 1,
          marginBottom: 16,
          textAlign: "center",
        }}>
          {data.subtitle}
        </div>

        <div style={{
          width: "clamp(60px, 20vw, 100px)",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
          borderRadius: 1,
          boxShadow: `0 0 10px ${THEME.colors.primaryGlow}`,
          marginBottom: 20,
        }} />

        <div
          key={animKey}
          style={{
            width: "100%",
            animation: `${animDir === "left" ? "instrSlideLeft" : "instrSlideRight"} 0.4s cubic-bezier(0.2,0.8,0.2,1) forwards`,
          }}
        >
          <div style={{
            background: "linear-gradient(160deg, rgba(28,18,10,0.8), rgba(18,12,6,0.75))",
            border: "1px solid rgba(210,140,60,0.12)",
            borderRadius: 14,
            padding: "clamp(18px, 3vh, 28px) clamp(20px, 3vw, 32px)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
            animation: "instrPulseGlow 4s ease-in-out infinite",
          }}>
            <SlideContent />
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
          marginBottom: 12,
        }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentSlide
                  ? `linear-gradient(90deg, ${THEME.colors.primary}, ${THEME.colors.gold})`
                  : "rgba(210,140,60,0.15)",
                boxShadow: i === currentSlide ? `0 0 10px ${THEME.colors.primaryGlow}` : "none",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 4,
        }}>
          {!isFirst && (
            <NavButton onClick={goBack} label="Back" />
          )}
          <NavButton
            onClick={goNext}
            label={isLast ? "Start Game" : "Next"}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
}
