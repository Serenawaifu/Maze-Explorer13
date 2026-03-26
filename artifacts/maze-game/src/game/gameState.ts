import { create } from "zustand";
import type { MazeAlgorithm } from "./mazeGenerator";

export interface LevelConfig {
  level: number;
  mazeWidth: number;
  mazeHeight: number;
  collectibleCount: number;
  bonusGemCount: number;
  timePickupCount: number;
  timeLimit: number;
  algorithm: MazeAlgorithm;
  algorithmLabel: string;
  mathGateCount: number;
  extraPassageRate: number;
}

const BASE_LEVELS: LevelConfig[] = [
  {
    level: 1, mazeWidth: 18, mazeHeight: 18,
    collectibleCount: 12, bonusGemCount: 2, timePickupCount: 1,
    timeLimit: 180, algorithm: "recursive-backtracker",
    algorithmLabel: "Stone Dungeon",
    mathGateCount: 0, extraPassageRate: 0.02,
  },
  {
    level: 2, mazeWidth: 24, mazeHeight: 24,
    collectibleCount: 18, bonusGemCount: 3, timePickupCount: 2,
    timeLimit: 250, algorithm: "recursive-backtracker",
    algorithmLabel: "Overgrown Hedge",
    mathGateCount: 3, extraPassageRate: 0.02,
  },
  {
    level: 3, mazeWidth: 30, mazeHeight: 30,
    collectibleCount: 24, bonusGemCount: 4, timePickupCount: 2,
    timeLimit: 340, algorithm: "recursive-backtracker",
    algorithmLabel: "Backrooms",
    mathGateCount: 5, extraPassageRate: 0.02,
  },
  {
    level: 4, mazeWidth: 36, mazeHeight: 36,
    collectibleCount: 28, bonusGemCount: 5, timePickupCount: 3,
    timeLimit: 430, algorithm: "recursive-backtracker",
    algorithmLabel: "Voxel Arena",
    mathGateCount: 7, extraPassageRate: 0.01,
  },
  {
    level: 5, mazeWidth: 38, mazeHeight: 38,
    collectibleCount: 30, bonusGemCount: 5, timePickupCount: 3,
    timeLimit: 480, algorithm: "recursive-backtracker",
    algorithmLabel: "Squid Game",
    mathGateCount: 8, extraPassageRate: 0.01,
  },
  {
    level: 6, mazeWidth: 42, mazeHeight: 42,
    collectibleCount: 34, bonusGemCount: 6, timePickupCount: 4,
    timeLimit: 540, algorithm: "recursive-backtracker",
    algorithmLabel: "Candy World",
    mathGateCount: 9, extraPassageRate: 0.01,
  },
];

export const TOTAL_LEVELS = BASE_LEVELS.length;

export type GameScreen = "start" | "instructions" | "playing" | "paused" | "levelComplete" | "gameOver" | "victory";

interface GameState {
  screen: GameScreen;
  level: number;
  levelsCompleted: number;
  score: number;
  timeRemaining: number;
  collectiblesGathered: number;
  totalCollectibles: number;
  playerPosition: { x: number; z: number };
  playerYaw: number;
  runId: number;
  screenShake: number;

  deadEndFlash: number;
  streakMultiplier: number;
  streakCount: number;
  mathSum: number;
  targetMathSum: number;
  lastFeedback: string;
  feedbackTimer: number;
  portalLocked: boolean;

  setScreen: (screen: GameScreen) => void;
  startGame: () => void;
  nextLevel: () => void;
  addScore: (points: number) => void;
  setTimeRemaining: (time: number) => void;
  collectItem: () => void;
  setPlayerPosition: (x: number, z: number) => void;
  setPlayerYaw: (yaw: number) => void;
  setTotalCollectibles: (count: number) => void;
  getLevelConfig: () => LevelConfig;
  triggerScreenShake: (intensity: number) => void;
  beginPlaying: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  exitGame: () => void;
  backToStart: () => void;
  tickScreenShake: (delta: number) => void;

  triggerDeadEndFlash: () => void;
  tickDeadEndFlash: (delta: number) => void;
  resetStreak: () => void;
  incrementStreak: () => void;
  addMathGateValue: (value: number) => void;
  setTargetMathSum: (sum: number) => void;
  setFeedback: (msg: string) => void;
  tickFeedback: (delta: number) => void;
  addTime: (seconds: number) => void;
  setPortalLocked: (locked: boolean) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  screen: "start",
  level: 1,
  levelsCompleted: 0,
  score: 0,
  timeRemaining: 120,
  collectiblesGathered: 0,
  totalCollectibles: 0,
  playerPosition: { x: 0, z: 0 },
  playerYaw: 0,
  runId: 0,
  screenShake: 0,

  deadEndFlash: 0,
  streakMultiplier: 1,
  streakCount: 0,
  mathSum: 0,
  targetMathSum: 0,
  lastFeedback: "",
  feedbackTimer: 0,
  portalLocked: false,

  setScreen: (screen) => set({ screen }),

  startGame: () => {
    set({ screen: "instructions" });
  },

  beginPlaying: () => {
    const randomLevel = 1 + Math.floor(Math.random() * BASE_LEVELS.length);
    const config = BASE_LEVELS[randomLevel - 1];
    set((s) => ({
      screen: "playing",
      level: randomLevel,
      levelsCompleted: 0,
      score: 0,
      timeRemaining: config.timeLimit,
      collectiblesGathered: 0,
      totalCollectibles: config.collectibleCount,
      playerPosition: { x: 0, z: 0 },
      playerYaw: 0,
      runId: s.runId + 1,
      screenShake: 0,
      deadEndFlash: 0,
      streakMultiplier: 1,
      streakCount: 0,
      mathSum: 0,
      targetMathSum: 0,
      lastFeedback: "",
      feedbackTimer: 0,
      portalLocked: false,
    }));
  },

  nextLevel: () => {
    const state = get();
    const completed = state.levelsCompleted + 1;
    if (completed >= BASE_LEVELS.length) {
      set({ screen: "victory", levelsCompleted: completed });
      return;
    }
    let nextLevelNum = 1 + Math.floor(Math.random() * BASE_LEVELS.length);
    while (nextLevelNum === state.level && BASE_LEVELS.length > 1) {
      nextLevelNum = 1 + Math.floor(Math.random() * BASE_LEVELS.length);
    }
    const config = BASE_LEVELS[nextLevelNum - 1];
    set({
      screen: "playing",
      level: nextLevelNum,
      levelsCompleted: completed,
      timeRemaining: config.timeLimit,
      collectiblesGathered: 0,
      totalCollectibles: config.collectibleCount,
      playerPosition: { x: 0, z: 0 },
      playerYaw: 0,
      screenShake: 0,
      deadEndFlash: 0,
      streakMultiplier: 1,
      streakCount: 0,
      mathSum: 0,
      targetMathSum: 0,
      lastFeedback: "",
      feedbackTimer: 0,
      portalLocked: false,
    });
  },

  addScore: (points) => {
    const multiplier = get().streakMultiplier;
    set((s) => ({ score: s.score + Math.floor(points * multiplier) }));
  },

  setTimeRemaining: (time) => {
    if (time <= 0) {
      set({ timeRemaining: 0, screen: "gameOver" });
    } else {
      set({ timeRemaining: time });
    }
  },

  collectItem: () => {
    set((s) => ({ collectiblesGathered: s.collectiblesGathered + 1 }));
  },

  setPlayerPosition: (x, z) => {
    const cur = get().playerPosition;
    if (Math.abs(cur.x - x) > 0.0001 || Math.abs(cur.z - z) > 0.0001) {
      set({ playerPosition: { x, z } });
    }
  },

  setPlayerYaw: (yaw) => {
    if (Math.abs(get().playerYaw - yaw) > 0.0001) {
      set({ playerYaw: yaw });
    }
  },

  setTotalCollectibles: (count) => set({ totalCollectibles: count }),

  getLevelConfig: () => {
    const state = get();
    return BASE_LEVELS[Math.min(state.level - 1, BASE_LEVELS.length - 1)];
  },

  triggerScreenShake: (intensity) => set({ screenShake: intensity }),

  pauseGame: () => {
    if (get().screen === "playing") {
      set({ screen: "paused" });
    }
  },

  resumeGame: () => {
    if (get().screen === "paused") {
      set({ screen: "playing" });
    }
  },

  exitGame: () => {
    if (get().screen === "playing" || get().screen === "paused") {
      set({ screen: "gameOver" });
    }
  },

  backToStart: () => set({ screen: "start" }),

  tickScreenShake: (delta) => {
    const s = get();
    if (s.screenShake > 0) {
      set({ screenShake: Math.max(0, s.screenShake - delta * 3) });
    }
  },

  triggerDeadEndFlash: () => {
    const s = get();
    if (s.deadEndFlash <= 0) {
      set({ deadEndFlash: 1.0, streakCount: 0, streakMultiplier: 1 });
    }
  },

  tickDeadEndFlash: (delta) => {
    const s = get();
    if (s.deadEndFlash > 0) {
      set({ deadEndFlash: Math.max(0, s.deadEndFlash - delta * 2) });
    }
  },

  resetStreak: () => set({ streakCount: 0, streakMultiplier: 1 }),

  incrementStreak: () => {
    const s = get();
    const newCount = s.streakCount + 1;
    const newMultiplier = 1 + Math.min(newCount * 0.25, 2.0);
    set({ streakCount: newCount, streakMultiplier: newMultiplier });
  },

  addMathGateValue: (value) => {
    set((s) => ({ mathSum: s.mathSum + value }));
  },

  setTargetMathSum: (sum) => set({ targetMathSum: sum }),

  setFeedback: (msg) => set({ lastFeedback: msg, feedbackTimer: 2.5 }),

  tickFeedback: (delta) => {
    const s = get();
    if (s.feedbackTimer > 0) {
      const newTimer = s.feedbackTimer - delta;
      if (newTimer <= 0) {
        set({ feedbackTimer: 0, lastFeedback: "" });
      } else {
        set({ feedbackTimer: newTimer });
      }
    }
  },

  addTime: (seconds) => {
    set((s) => ({ timeRemaining: s.timeRemaining + seconds }));
  },

  setPortalLocked: (locked) => set({ portalLocked: locked }),
}));
