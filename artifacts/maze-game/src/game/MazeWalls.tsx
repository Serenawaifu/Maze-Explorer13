import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { MazeData } from "./mazeGenerator";
import { getWallSegments } from "./mazeGenerator";
import { type LevelTheme, getThemeForLevel } from "./levelThemes";
import { useGameState } from "./gameState";

const CELL_SIZE = 4;

interface MazeWallsProps {
  maze: MazeData;
  level: number;
}

function buildWallMaterial(theme: LevelTheme): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(...theme.wallColor),
    roughness: theme.wallRoughness,
    metalness: theme.wallMetalness,
    bumpScale: 0.02,
  });

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = theme.wallBaseHex;
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 32;
  const brickW = 64;
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      theme.wallBrickFn(ctx, x, y, brickW, brickH);
    }

    ctx.strokeStyle = theme.wallMortarColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, row * brickH);
    ctx.lineTo(256, row * brickH);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, Math.ceil(theme.wallHeight / 2));
  mat.map = tex;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = 256;
  normalCanvas.height = 256;
  const nctx = normalCanvas.getContext("2d")!;
  nctx.fillStyle = "#8080ff";
  nctx.fillRect(0, 0, 256, 256);

  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    nctx.strokeStyle = "#6060cc";
    nctx.lineWidth = 3;
    nctx.beginPath();
    nctx.moveTo(0, row * brickH);
    nctx.lineTo(256, row * brickH);
    nctx.stroke();

    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      nctx.beginPath();
      nctx.moveTo(x, row * brickH);
      nctx.lineTo(x, (row + 1) * brickH);
      nctx.stroke();
    }
  }

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(2, Math.ceil(theme.wallHeight / 2));
  mat.normalMap = normalTex;
  mat.normalScale = new THREE.Vector2(0.5, 0.5);

  mat.needsUpdate = true;
  return mat;
}

export function MazeWalls({ maze, level }: MazeWallsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const wallSegments = useMemo(() => getWallSegments(maze), [maze]);
  const theme = useMemo(() => getThemeForLevel(level), [level]);
  const wallHeight = theme.wallHeight;
  const wallThickness = theme.wallThickness;

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    wallSegments.forEach((wall, i) => {
      dummy.position.set(wall.x, wallHeight / 2, wall.z);
      dummy.rotation.set(0, 0, 0);
      if (wall.rotated) {
        dummy.scale.set(wallThickness, wallHeight, CELL_SIZE + wallThickness);
      } else {
        dummy.scale.set(CELL_SIZE + wallThickness, wallHeight, wallThickness);
      }
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
    meshRef.current.computeBoundingBox();
  }, [wallSegments, wallHeight, wallThickness]);

  const wallMaterial = useMemo(() => {
    return buildWallMaterial(theme);
  }, [theme]);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, wallSegments.length]}
        material={wallMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </>
  );
}

export function MazeFloor({ maze, level }: { maze: MazeData; level: number }) {
  const floorSize = Math.max(maze.width, maze.height) * CELL_SIZE + CELL_SIZE;
  const centerX = ((maze.width - 1) * CELL_SIZE) / 2;
  const centerZ = ((maze.height - 1) * CELL_SIZE) / 2;

  const floorMaterial = useMemo(() => {
    const theme = getThemeForLevel(level);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = theme.floorBaseHex;
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        theme.floorTileFn(ctx, col * tileSize, row * tileSize, tileSize);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(floorSize / 4, floorSize / 4);

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: theme.floorRoughness,
      metalness: 0.02,
      color: new THREE.Color(...theme.floorColor),
    });
  }, [floorSize, level]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} material={floorMaterial}>
      <planeGeometry args={[floorSize, floorSize]} />
    </mesh>
  );
}

export function MazeCeiling({ maze, level }: { maze: MazeData; level: number }) {
  const floorSize = Math.max(maze.width, maze.height) * CELL_SIZE + CELL_SIZE;
  const centerX = ((maze.width - 1) * CELL_SIZE) / 2;
  const centerZ = ((maze.height - 1) * CELL_SIZE) / 2;
  const theme = useMemo(() => getThemeForLevel(level), [level]);

  const ceilingMaterial = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = theme.ceilingBaseHex;
    ctx.fillRect(0, 0, 256, 256);

    const tileW = 64;
    const tileH = 32;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 4; col++) {
        theme.ceilingTileFn(ctx, col * tileW, row * tileH, tileW, tileH);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(floorSize / 4, floorSize / 4);

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.95,
      metalness: 0.0,
      color: new THREE.Color(...theme.ceilingColor),
    });
  }, [floorSize, theme]);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[centerX, theme.wallHeight, centerZ]} material={ceilingMaterial}>
      <planeGeometry args={[floorSize, floorSize]} />
    </mesh>
  );
}

export function ExitMarker({ maze }: { maze: MazeData }) {
  const portalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const ring1Mat = useRef<THREE.MeshStandardMaterial>(null);
  const ring2Mat = useRef<THREE.MeshStandardMaterial>(null);
  const groundMat = useRef<THREE.MeshStandardMaterial>(null);
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const x = maze.end.x * CELL_SIZE;
  const z = maze.end.y * CELL_SIZE;

  const lockedColor = new THREE.Color("#cc3333");
  const lockedEmissive = new THREE.Color("#aa2222");
  const openColor = new THREE.Color("#ffaa33");
  const openEmissive = new THREE.Color("#ff8800");
  const readyColor = new THREE.Color("#44cc88");
  const readyEmissive = new THREE.Color("#33aa66");

  useFrame((_, delta) => {
    const t = performance.now() * 0.001;
    const state = useGameState.getState();
    const hasMathGates = state.targetMathSum > 0;
    const mathSumMet = !hasMathGates || state.mathSum === state.targetMathSum;
    const exceeded = hasMathGates && state.mathSum > state.targetMathSum;
    const gemsCollected = state.collectiblesGathered >= state.totalCollectibles;

    const targetColor = exceeded ? lockedColor : (mathSumMet && gemsCollected) ? readyColor : openColor;
    const targetEmissive = exceeded ? lockedEmissive : (mathSumMet && gemsCollected) ? readyEmissive : openEmissive;

    if (coreMat.current) {
      coreMat.current.color.lerp(targetColor, delta * 3);
      coreMat.current.emissive.lerp(targetEmissive, delta * 3);
    }
    if (ring1Mat.current) {
      ring1Mat.current.color.lerp(targetColor, delta * 3);
      ring1Mat.current.emissive.lerp(targetEmissive, delta * 3);
    }
    if (groundMat.current) {
      groundMat.current.color.lerp(targetColor, delta * 3);
      groundMat.current.emissive.lerp(targetEmissive, delta * 3);
    }
    if (light1Ref.current) {
      light1Ref.current.color.lerp(targetColor, delta * 3);
    }
    if (light2Ref.current) {
      light2Ref.current.color.lerp(targetEmissive, delta * 3);
    }

    const spinSpeed = exceeded ? 0.5 : mathSumMet ? 3 : 2;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * spinSpeed;
      ring1Ref.current.rotation.x = Math.sin(t) * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * (spinSpeed * 0.75);
      ring2Ref.current.rotation.y += delta * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 1;
      ring3Ref.current.rotation.z += delta * (spinSpeed * 1.25);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * spinSpeed * 1.5;
      const baseScale = exceeded ? 0.2 : 0.3;
      const pulseAmp = exceeded ? 0.02 : 0.05;
      const pulse = baseScale + Math.sin(t * 4) * pulseAmp;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={portalRef} position={[x, 1.2, z]}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#ffaa33"
          emissive="#ff8800"
          emissiveIntensity={4}
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.5, 0.03, 8, 48]} />
        <meshStandardMaterial
          ref={ring1Mat}
          color="#ffcc44"
          emissive="#ffaa22"
          emissiveIntensity={3}
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.025, 8, 48]} />
        <meshStandardMaterial
          ref={ring2Mat}
          color="#44cc88"
          emissive="#33aa66"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
        />
      </mesh>

      <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[0.8, 0.015, 8, 48]} />
        <meshStandardMaterial
          color="#ffdd66"
          emissive="#ffaa33"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.9, 32]} />
        <meshStandardMaterial
          ref={groundMat}
          color="#ffaa33"
          emissive="#ff8800"
          emissiveIntensity={3}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight ref={light1Ref} color="#ffaa33" intensity={6} distance={10} />
      <pointLight ref={light2Ref} color="#ff8800" intensity={3} distance={5} />
    </group>
  );
}
