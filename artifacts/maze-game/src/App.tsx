import { useState, useEffect } from "react";
import { GameScene } from "./scene/GameScene";
import { StartScreen, GameOverScreen, LevelCompleteScreen, VictoryScreen, LoadingScreen } from "./ui/Screens";
import { InstructionsScreen } from "./ui/Instructions";
import { THEME } from "./ui/theme";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const narrowScreen = window.innerWidth < 768;
  const touchOnly = "ontouchstart" in window && navigator.maxTouchPoints > 0 && !window.matchMedia("(pointer: fine)").matches;
  return mobileUA || (narrowScreen && touchOnly);
}

function MobileNotSupported() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(28,18,10,0.95), #080a14 70%)",
      fontFamily: THEME.fonts.body,
      color: THEME.colors.text,
      padding: 32,
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 24,
      }}>
        🖥️
      </div>
      <h1 style={{
        fontFamily: THEME.fonts.heading,
        fontSize: 28,
        fontWeight: 800,
        color: THEME.colors.primary,
        textShadow: `0 0 30px rgba(210,136,42,0.4)`,
        letterSpacing: 3,
        textTransform: "uppercase",
        margin: "0 0 16px",
      }}>
        Desktop Only
      </h1>
      <div style={{
        width: 80,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
        margin: "0 auto 24px",
        borderRadius: 1,
        boxShadow: `0 0 12px ${THEME.colors.primary}40`,
      }} />
      <p style={{
        fontSize: 16,
        lineHeight: 1.6,
        color: THEME.colors.textMuted,
        maxWidth: 400,
        margin: "0 0 12px",
      }}>
        Mobile is not supported.
      </p>
      <p style={{
        fontSize: 14,
        lineHeight: 1.5,
        color: THEME.colors.textDim,
        maxWidth: 400,
        margin: 0,
      }}>
        Please open this game on a desktop or laptop computer with a keyboard and mouse for the best experience.
      </p>
    </div>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileNotSupported />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#080a14" }}>
      <StartScreen />
      <InstructionsScreen />
      <LoadingScreen />
      <GameOverScreen />
      <LevelCompleteScreen />
      <VictoryScreen />
      <GameScene />
    </div>
  );
}

export default App;
