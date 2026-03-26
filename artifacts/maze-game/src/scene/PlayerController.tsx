import { useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MazeData } from "../engine/mazeGenerator";
import { useGameState } from "../engine/gameState";
import { playFootstep } from "../engine/audioSystem";
import { getThemeForLevel } from "../engine/levelThemes";

const CELL_SIZE = 4;
const MOVE_SPEED = 5;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_RADIUS = 0.6;
const COLLISION_ITERATIONS = 3;
const DUST_COUNT = 30;

interface PlayerControllerProps {
  maze: MazeData;
  level: number;
}

export function PlayerController({ maze, level }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const lockedRef = useRef(false);
  const setPlayerPosition = useGameState((s) => s.setPlayerPosition);
  const setPlayerYaw = useGameState((s) => s.setPlayerYaw);
  const screen = useGameState((s) => s.screen);
  const shakeOffsetRef = useRef(new THREE.Vector3());
  const logicalPosRef = useRef(new THREE.Vector3(0, 1.6, 0));

  const wallBoxes = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number }[]>([]);
  const wallGrid = useRef<Map<string, number[]>>(new Map());
  const GRID_CELL = CELL_SIZE;

  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const WALL_THICKNESS = theme.wallThickness;

  useEffect(() => {
    const boxes: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const cx = x * CELL_SIZE;
        const cz = y * CELL_SIZE;
        if (cell.walls.north) {
          boxes.push({ minX: cx - CELL_SIZE / 2, maxX: cx + CELL_SIZE / 2, minZ: cz - CELL_SIZE / 2 - WALL_THICKNESS / 2, maxZ: cz - CELL_SIZE / 2 + WALL_THICKNESS / 2 });
        }
        if (cell.walls.west) {
          boxes.push({ minX: cx - CELL_SIZE / 2 - WALL_THICKNESS / 2, maxX: cx - CELL_SIZE / 2 + WALL_THICKNESS / 2, minZ: cz - CELL_SIZE / 2, maxZ: cz + CELL_SIZE / 2 });
        }
        if (x === maze.width - 1 && cell.walls.east) {
          boxes.push({ minX: cx + CELL_SIZE / 2 - WALL_THICKNESS / 2, maxX: cx + CELL_SIZE / 2 + WALL_THICKNESS / 2, minZ: cz - CELL_SIZE / 2, maxZ: cz + CELL_SIZE / 2 });
        }
        if (y === maze.height - 1 && cell.walls.south) {
          boxes.push({ minX: cx - CELL_SIZE / 2, maxX: cx + CELL_SIZE / 2, minZ: cz + CELL_SIZE / 2 - WALL_THICKNESS / 2, maxZ: cz + CELL_SIZE / 2 + WALL_THICKNESS / 2 });
        }

        const half = CELL_SIZE / 2;
        const wh = WALL_THICKNESS / 2;
        const hasN = cell.walls.north;
        const hasS = cell.walls.south;
        const hasW = cell.walls.west;
        const hasE = cell.walls.east;

        const corners: [number, number][] = [];
        if (hasN || hasW) corners.push([cx - half, cz - half]);
        if (hasN || hasE) corners.push([cx + half, cz - half]);
        if (hasS || hasW) corners.push([cx - half, cz + half]);
        if (hasS || hasE) corners.push([cx + half, cz + half]);

        for (const [px, pz] of corners) {
          boxes.push({ minX: px - wh, maxX: px + wh, minZ: pz - wh, maxZ: pz + wh });
        }
      }
    }
    wallBoxes.current = boxes;

    const grid = new Map<string, number[]>();
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const gx0 = Math.floor(b.minX / GRID_CELL) - 1;
      const gx1 = Math.floor(b.maxX / GRID_CELL) + 1;
      const gz0 = Math.floor(b.minZ / GRID_CELL) - 1;
      const gz1 = Math.floor(b.maxZ / GRID_CELL) + 1;
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gz = gz0; gz <= gz1; gz++) {
          const key = `${gx},${gz}`;
          let arr = grid.get(key);
          if (!arr) { arr = []; grid.set(key, arr); }
          arr.push(i);
        }
      }
    }
    wallGrid.current = grid;
  }, [maze, WALL_THICKNESS]);

  useEffect(() => {
    const startX = maze.start.x * 4;
    const startZ = maze.start.y * 4;
    camera.position.set(startX, 1.6, startZ);
    logicalPosRef.current.set(startX, 1.6, startZ);
    yawRef.current = 0;
    pitchRef.current = 0;
  }, [camera, maze]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Escape" && screen === "playing") {
      e.preventDefault();
      useGameState.getState().pauseGame();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      return;
    }
    keysRef.current.add(e.code);
  }, [screen]);
  const handleKeyUp = useCallback((e: KeyboardEvent) => { keysRef.current.delete(e.code); }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!lockedRef.current) return;
    yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
    pitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
    pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
  }, []);
  const handlePointerLockChange = useCallback(() => {
    const wasLocked = lockedRef.current;
    lockedRef.current = document.pointerLockElement === gl.domElement;
    if (wasLocked && !lockedRef.current) {
      const currentScreen = useGameState.getState().screen;
      if (currentScreen === "playing") {
        useGameState.getState().pauseGame();
      }
    }
  }, [gl]);

  const handleClick = useCallback(() => {
    if (screen !== "playing") return;
    if (!lockedRef.current) {
      try {
        gl.domElement.requestPointerLock();
      } catch (_) {}
    }
  }, [gl, screen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    gl.domElement.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handlePointerLockChange, handleClick, gl]);

  const resolveCollision = useCallback((px: number, pz: number): { x: number; z: number } => {
    const r = PLAYER_RADIUS;
    let curX = px;
    let curZ = pz;
    const allBoxes = wallBoxes.current;
    const grid = wallGrid.current;

    for (let iter = 0; iter < COLLISION_ITERATIONS; iter++) {
      const gx = Math.floor(curX / GRID_CELL);
      const gz = Math.floor(curZ / GRID_CELL);
      const checked = new Set<number>();

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const indices = grid.get(`${gx + dx},${gz + dz}`);
          if (!indices) continue;
          for (let ii = 0; ii < indices.length; ii++) {
            const idx = indices[ii];
            if (checked.has(idx)) continue;
            checked.add(idx);
            const box = allBoxes[idx];
            const closestX = Math.max(box.minX, Math.min(curX, box.maxX));
            const closestZ = Math.max(box.minZ, Math.min(curZ, box.maxZ));
            const ddx = curX - closestX;
            const ddz = curZ - closestZ;
            const distSq = ddx * ddx + ddz * ddz;
            if (distSq >= r * r) continue;
            if (distSq < 0.0001) {
              const penLeft = curX - box.minX + r;
              const penRight = box.maxX - curX + r;
              const penTop = curZ - box.minZ + r;
              const penBottom = box.maxZ - curZ + r;
              const minPen = Math.min(penLeft, penRight, penTop, penBottom);
              if (minPen === penLeft) curX -= penLeft;
              else if (minPen === penRight) curX += penRight;
              else if (minPen === penTop) curZ -= penTop;
              else curZ += penBottom;
            } else {
              const dist = Math.sqrt(distSq);
              const penetration = r - dist;
              const nx = ddx / dist;
              const nz = ddz / dist;
              curX += nx * penetration;
              curZ += nz * penetration;
            }
          }
        }
      }
    }
    return { x: curX, z: curZ };
  }, []);

  const lightRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustTimerRef = useRef(0);

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      arr[i * 3] = 0;
      arr[i * 3 + 1] = -10;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  const dustMat = useMemo(() => new THREE.PointsMaterial({
    color: "#aa8866",
    size: 0.03,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.NormalBlending,
    sizeAttenuation: true,
  }), []);

  const _euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const _forward = useMemo(() => new THREE.Vector3(), []);
  const _right = useMemo(() => new THREE.Vector3(), []);
  const _moveDir = useMemo(() => new THREE.Vector3(), []);
  const _lookDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (screen !== "playing") return;

    const shake = useGameState.getState().screenShake;

    if (shake > 0.01) {
      const intensity = shake * 0.15;
      shakeOffsetRef.current.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.6,
        (Math.random() - 0.5) * intensity * 0.3
      );
    } else {
      shakeOffsetRef.current.set(0, 0, 0);
    }

    pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));

    _euler.set(pitchRef.current, yawRef.current, 0);
    camera.quaternion.setFromEuler(_euler);

    const keys = keysRef.current;
    _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _forward.y = 0;
    _forward.normalize();
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    _right.y = 0;
    _right.normalize();

    _moveDir.set(0, 0, 0);
    if (keys.has("KeyW") || keys.has("ArrowUp")) _moveDir.add(_forward);
    if (keys.has("KeyS") || keys.has("ArrowDown")) _moveDir.sub(_forward);
    if (keys.has("KeyD") || keys.has("ArrowRight")) _moveDir.add(_right);
    if (keys.has("KeyA") || keys.has("ArrowLeft")) _moveDir.sub(_right);

    const lp = logicalPosRef.current;
    let isMoving = false;
    if (_moveDir.lengthSq() > 0) {
      _moveDir.normalize().multiplyScalar(MOVE_SPEED * delta);
      const prevX = lp.x;
      const prevZ = lp.z;

      const resolved = resolveCollision(prevX + _moveDir.x, prevZ + _moveDir.z);
      lp.x = resolved.x;
      lp.z = resolved.z;

      const moved = Math.abs(lp.x - prevX) > 0.001 || Math.abs(lp.z - prevZ) > 0.001;
      if (moved) {
        playFootstep();
        isMoving = true;
      }
    }

    camera.position.set(
      lp.x + shakeOffsetRef.current.x,
      1.6 + shakeOffsetRef.current.y,
      lp.z + shakeOffsetRef.current.z
    );

    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
      lightRef.current.intensity = 1.5;
      lightRef.current.distance = 8;
    }
    if (spotRef.current) {
      spotRef.current.position.copy(camera.position);
      _lookDir.set(0, 0, -1).applyQuaternion(camera.quaternion);
      spotRef.current.target.position.copy(camera.position).add(_lookDir.multiplyScalar(5));
      spotRef.current.target.updateMatrixWorld();
      spotRef.current.intensity = 3;
      spotRef.current.distance = 14;
    }

    if (dustRef.current && isMoving) {
      dustTimerRef.current += delta;
      if (dustTimerRef.current > 0.08) {
        dustTimerRef.current = 0;
        const geo = dustRef.current.geometry;
        const pos = geo.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = DUST_COUNT - 1; i > 0; i--) {
          arr[i * 3] = arr[(i - 1) * 3];
          arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
          arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
        }
        arr[0] = camera.position.x + (Math.random() - 0.5) * 0.3;
        arr[1] = 0.05 + Math.random() * 0.15;
        arr[2] = camera.position.z + (Math.random() - 0.5) * 0.3;
        pos.needsUpdate = true;
      }
    }

    setPlayerPosition(lp.x, lp.z);
    setPlayerYaw(yawRef.current);
  });

  return (
    <>
      <pointLight ref={lightRef} color="#aabbff" intensity={1.5} distance={8} />
      <spotLight ref={spotRef} color="#ffffff" intensity={3} distance={14} angle={0.5} penumbra={0.6}>
        <object3D />
      </spotLight>
      <points ref={dustRef} material={dustMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} count={DUST_COUNT} />
        </bufferGeometry>
      </points>
    </>
  );
}
