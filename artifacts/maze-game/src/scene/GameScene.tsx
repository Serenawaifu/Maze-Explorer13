import { useMemo, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateMaze, getCollectiblePositions, isDeadEnd } from "../engine/mazeGenerator";
import type { MazeData } from "../engine/mazeGenerator";
import { MazeWalls, MazeFloor, MazeCeiling, ExitMarker } from "./MazeWalls";
import { PlayerController } from "./PlayerController";
import { Collectible } from "./Collectible";
import { MathGateComponent } from "./MathGate";
import { HUD } from "../ui/HUD";
import { Compass } from "../ui/Compass";
import { MiniMap } from "../ui/MiniMap";
import { useGameState } from "../engine/gameState";
import { getThemeForLevel } from "../engine/levelThemes";
import {
  startAmbient,
  stopAmbient,
  playLevelComplete,
  playVictoryFanfare,
  playGameOver,
  warmUpAudio,
} from "../engine/audioSystem";
import { WallTorchGLTFModels } from "./WallTorchGLTF";

const CELL_SIZE = 4;
const POINTS_PER_ITEM = 100;
const BONUS_POINTS = 300;
const TIME_PICKUP_SECONDS = 15;

export interface TorchPlacement {
  pos: [number, number, number];
  nx: number;
  nz: number;
}

export function getTorchPlacements(maze: MazeData, wallThickness: number, wallHeight: number): TorchPlacement[] {
  const candidates: TorchPlacement[] = [];
  const torchY = Math.min(wallHeight * 0.6, wallHeight - 0.8);

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.cells[y][x];
      const cx = x * CELL_SIZE;
      const cz = y * CELL_SIZE;

      if (cell.walls.north && y > 0) {
        const wz = cz - CELL_SIZE / 2 + wallThickness / 2 + 0.05;
        candidates.push({ pos: [cx, torchY, wz], nx: 0, nz: 1 });
      }
      if (cell.walls.south && y < maze.height - 1) {
        const wz = cz + CELL_SIZE / 2 - wallThickness / 2 - 0.05;
        candidates.push({ pos: [cx, torchY, wz], nx: 0, nz: -1 });
      }
      if (cell.walls.west && x > 0) {
        const wx = cx - CELL_SIZE / 2 + wallThickness / 2 + 0.05;
        candidates.push({ pos: [wx, torchY, cz], nx: 1, nz: 0 });
      }
      if (cell.walls.east && x < maze.width - 1) {
        const wx = cx + CELL_SIZE / 2 - wallThickness / 2 - 0.05;
        candidates.push({ pos: [wx, torchY, cz], nx: -1, nz: 0 });
      }
    }
  }

  if (candidates.length === 0) return [];

  const minTorchDist = CELL_SIZE * 2.5;
  const maxTorches = Math.max(20, Math.floor(maze.width * maze.height * 0.12));
  const minDistSq = minTorchDist * minTorchDist;

  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: TorchPlacement[] = [];
  for (const c of shuffled) {
    if (selected.length >= maxTorches) break;
    let tooClose = false;
    for (const s of selected) {
      const dx = c.pos[0] - s.pos[0];
      const dz = c.pos[2] - s.pos[2];
      if (dx * dx + dz * dz < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) selected.push(c);
  }

  return selected;
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const called = useRef(false);
  const compiled = useRef(false);
  const frameCount = useRef(0);
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!called.current) {
        called.current = true;
        onReady();
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [onReady]);

  useFrame(() => {
    if (called.current) return;

    if (!compiled.current) {
      try {
        gl.compile(scene, camera);
      } catch (_) {}
      compiled.current = true;
      frameCount.current = 0;
      return;
    }

    frameCount.current++;
    if (frameCount.current >= 10) {
      called.current = true;
      onReady();
    }
  });

  return null;
}

function PlayerLantern({ color }: { color: string }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
      lightRef.current.position.y -= 0.3;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color={color}
      intensity={1.8}
      distance={18}
      decay={2}
      castShadow={false}
    />
  );
}

function PortalParticles({ maze }: { maze: MazeData }) {
  const pointsRef = useRef<THREE.Points>(null);
  const x = maze.end.x * CELL_SIZE;
  const z = maze.end.y * CELL_SIZE;
  const count = 60;

  const { positions: initPos, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      speeds[i] = 0.5 + Math.random() * 1;
    }
    return { positions, speeds };
  }, []);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color: "#ffaa33",
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = performance.now() * 0.001;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speeds[i];
      const angle = t * speeds[i] + i;
      arr[i * 3] += Math.cos(angle) * delta * 0.3;
      arr[i * 3 + 2] += Math.sin(angle) * delta * 0.3;
      if (arr[i * 3 + 1] > 3.5) {
        arr[i * 3 + 1] = 0;
        const a2 = Math.random() * Math.PI * 2;
        const r2 = 0.5 + Math.random() * 1.5;
        arr[i * 3] = Math.cos(a2) * r2;
        arr[i * 3 + 2] = Math.sin(a2) * r2;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[x, 0, z]} material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initPos, 3]} count={count} />
      </bufferGeometry>
    </points>
  );
}

function DynamicFog({ fogColorHex, fogNear, fogFar }: { fogColorHex: number; fogNear: number; fogFar: number }) {
  const { scene } = useThree();

  useEffect(() => {
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.setHex(fogColorHex);
    }
  }, [scene, fogColorHex]);

  useFrame(() => {
    if (!scene.fog) return;
    const fog = scene.fog as THREE.Fog;
    fog.near += (fogNear - fog.near) * 0.05;
    fog.far += (fogFar - fog.far) * 0.05;
  });

  return null;
}

function DeadEndDetector({ maze }: { maze: MazeData }) {
  const lastCellRef = useRef<string>("");
  const triggerDeadEndFlash = useGameState((s) => s.triggerDeadEndFlash);
  const setFeedback = useGameState((s) => s.setFeedback);

  useFrame(() => {
    const state = useGameState.getState();
    if (state.screen !== "playing") return;
    const pp = state.playerPosition;
    const cellX = Math.round(pp.x / CELL_SIZE);
    const cellZ = Math.round(pp.z / CELL_SIZE);
    const cellKey = `${cellX},${cellZ}`;

    if (cellKey !== lastCellRef.current) {
      lastCellRef.current = cellKey;
      if (isDeadEnd(maze, pp.x, pp.z)) {
        triggerDeadEndFlash();
        setFeedback("Dead End!");
      }
    }
  });

  return null;
}

function FlowFeedbackTicker() {
  const tickDeadEndFlash = useGameState((s) => s.tickDeadEndFlash);
  const tickFeedback = useGameState((s) => s.tickFeedback);

  useFrame((_, delta) => {
    tickDeadEndFlash(delta);
    tickFeedback(delta);
  });

  return null;
}

export function GameScene() {
  const screen = useGameState((s) => s.screen);
  const level = useGameState((s) => s.level);
  const runId = useGameState((s) => s.runId);
  const setScreen = useGameState((s) => s.setScreen);
  const getLevelConfig = useGameState((s) => s.getLevelConfig);
  const setTargetMathSum = useGameState((s) => s.setTargetMathSum);
  const batchCollectGem = useGameState((s) => s.batchCollectGem);
  const batchCollectBonus = useGameState((s) => s.batchCollectBonus);
  const batchCollectTime = useGameState((s) => s.batchCollectTime);
  const batchCollectMathGate = useGameState((s) => s.batchCollectMathGate);

  const finishLoading = useGameState((s) => s.finishLoading);

  const config = getLevelConfig();
  const isActive = screen !== "start" && screen !== "instructions" && screen !== "gameOver" && screen !== "victory";
  const prevScreenRef = useRef(screen);
  const collectedItemsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (screen === "playing") {
      startAmbient();
      collectedItemsRef.current = new Set();
    } else if (screen === "loading") {
      warmUpAudio();
    } else {
      stopAmbient();
    }
  }, [screen]);

  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = screen;
    if (screen === "levelComplete" && prev === "playing") {
      playLevelComplete();
    } else if (screen === "victory" && prev !== "victory") {
      playVictoryFanfare();
    } else if (screen === "gameOver" && prev === "playing") {
      playGameOver();
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing" && screen !== "paused" && document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (screen === "paused" && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [screen]);

  const mazeData = useMemo(() => {
    if (!isActive) return null;
    return generateMaze(config.mazeWidth, config.mazeHeight, config.algorithm, config.mathGateCount, config.extraPassageRate);
  }, [level, runId, isActive, config.mazeWidth, config.mazeHeight, config.algorithm, config.mathGateCount, config.extraPassageRate]);

  useEffect(() => {
    if (mazeData && mazeData.targetSum > 0) {
      setTargetMathSum(mazeData.targetSum);
    }
  }, [mazeData, setTargetMathSum]);

  const collectiblePositions = useMemo(() => {
    if (!mazeData) return [];
    return getCollectiblePositions(mazeData, config.collectibleCount, config.bonusGemCount, config.timePickupCount);
  }, [mazeData, config.collectibleCount, config.bonusGemCount, config.timePickupCount]);

  const normalGemCount = useMemo(() => collectiblePositions.filter(p => p.type === "normal").length, [collectiblePositions]);

  const setTotalCollectibles = useGameState((s) => s.setTotalCollectibles);

  useEffect(() => {
    if (collectiblePositions.length > 0) {
      setTotalCollectibles(normalGemCount);
    }
  }, [normalGemCount, setTotalCollectibles]);

  const handleCollect = useCallback((index: number, type: "normal" | "bonus" | "time") => {
    if (useGameState.getState().screen !== "playing") return;
    collectedItemsRef.current.add(index);

    if (type === "normal") {
      batchCollectGem(POINTS_PER_ITEM, true);
    } else if (type === "bonus") {
      batchCollectBonus(BONUS_POINTS, "Bonus Orange! +300");
    } else if (type === "time") {
      batchCollectTime(TIME_PICKUP_SECONDS, 50, `+${TIME_PICKUP_SECONDS}s Time!`);
    }
  }, [batchCollectGem, batchCollectBonus, batchCollectTime]);

  const handleMathGateCollect = useCallback((value: number, onPath: boolean) => {
    batchCollectMathGate(value, onPath);
  }, [batchCollectMathGate]);

  const exitX = mazeData ? mazeData.end.x * CELL_SIZE : 0;
  const exitZ = mazeData ? mazeData.end.y * CELL_SIZE : 0;

  const portalRejectCooldown = useRef(0);

  useEffect(() => {
    if (!mazeData || screen !== "playing") return;
    const checkExit = () => {
      const state = useGameState.getState();
      if (state.screen !== "playing") return;
      const pp = state.playerPosition;
      const dx = pp.x - exitX;
      const dz = pp.z - exitZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const gemsCollected = state.collectiblesGathered >= state.totalCollectibles;
      const mathSumMet = state.targetMathSum <= 0 || state.mathSum === state.targetMathSum;

      if (dist < 3.0 && state.targetMathSum > 0 && !mathSumMet) {
        if (!state.portalLocked) {
          state.setPortalLocked(true);
        }
      } else if (state.portalLocked && dist >= 3.0) {
        state.setPortalLocked(false);
      }

      if (dist < 1.5 && gemsCollected && mathSumMet) {
        const timeBonus = Math.floor(state.timeRemaining * 5);
        const mathBonus = state.targetMathSum > 0 ? 500 : 0;
        state.addScore(timeBonus + 500 + mathBonus);
        setScreen("levelComplete");
      } else if (dist < 1.5 && gemsCollected && !mathSumMet) {
        const now = Date.now();
        if (now - portalRejectCooldown.current > 3000) {
          portalRejectCooldown.current = now;
          if (state.mathSum > state.targetMathSum) {
            state.setFeedback("Sum Exceeded! Portal Sealed");
          } else {
            state.setFeedback(`Path Sum Needed: ${state.mathSum}/${state.targetMathSum}`);
          }
        }
      }
    };
    const id = setInterval(checkExit, 100);
    return () => clearInterval(id);
  }, [mazeData, screen, exitX, exitZ, setScreen]);

  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const torchPlacements = useMemo(() => mazeData ? getTorchPlacements(mazeData, theme.wallThickness, theme.wallHeight) : [], [mazeData, theme.wallThickness, theme.wallHeight]);

  if (!isActive || !mazeData) return null;

  const isLoading = screen === "loading";

  return (
    <>
      <Canvas
        style={{
          position: "fixed",
          inset: 0,
          zIndex: isLoading ? -1 : undefined,
          pointerEvents: screen === "paused" || isLoading ? "none" : "auto",
        }}
        camera={{ fov: 75, near: 0.1, far: 100 }}
      >
        <color attach="background" args={[theme.fogColor]} />
        <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />

        <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />
        <hemisphereLight args={[theme.directionalColor, theme.fogColor, 0.15]} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.4}
          color={theme.directionalColor}
        />
        <PlayerLantern color={theme.torchColor} />

        <WallTorchGLTFModels torchPlacements={torchPlacements} maze={mazeData} />
        <PortalParticles maze={mazeData} />
        <DynamicFog fogColorHex={theme.fogColorHex} fogNear={theme.fogNear} fogFar={theme.fogFar} />

        <MazeWalls maze={mazeData} level={level} />
        <MazeFloor maze={mazeData} level={level} />
        <MazeCeiling maze={mazeData} level={level} />
        <ExitMarker maze={mazeData} />

        {collectiblePositions.map((pos, i) => (
          <Collectible
            key={`${runId}-${level}-c-${i}`}
            position={pos}
            type={pos.type}
            onCollect={() => handleCollect(i, pos.type)}
          />
        ))}

        {mazeData.mathGates.map((gate, i) => (
          <MathGateComponent
            key={`${runId}-${level}-g-${i}`}
            gate={gate}
            onCollect={handleMathGateCollect}
          />
        ))}

        <DeadEndDetector maze={mazeData} />
        <FlowFeedbackTicker />
        <PlayerController maze={mazeData} level={level} />
        {screen === "loading" && <SceneReady key={`ready-${runId}-${level}`} onReady={finishLoading} />}
      </Canvas>

      <HUD />
      <Compass maze={mazeData} />
      <MiniMap
        maze={mazeData}
        level={level}
        exitPosition={{ x: exitX, z: exitZ }}
        collectiblePositions={collectiblePositions}
        collectedItems={collectedItemsRef.current}
      />
    </>
  );
}
