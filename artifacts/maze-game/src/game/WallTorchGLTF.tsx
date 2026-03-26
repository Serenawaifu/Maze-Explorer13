import { useMemo, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { TorchPlacement } from "./GameScene";
import type { MazeData } from "./mazeGenerator";
import { useGameState } from "./gameState";

const MODEL_URL = `${import.meta.env.BASE_URL}models/torch.gltf`;
const CELL_SIZE = 4;
const MAX_FLAME_TORCHES = 10;
const FLAME_ON_DIST = 10;
const FLAME_OFF_DIST = 12;
const FADE_IN_SPEED = 0.5;
const FADE_OUT_SPEED = 0.8;

function hasLineOfSight(maze: MazeData, px: number, pz: number, tx: number, tz: number): boolean {
  const pcx = Math.floor(px / CELL_SIZE + 0.5);
  const pcz = Math.floor(pz / CELL_SIZE + 0.5);
  const tcx = Math.floor(tx / CELL_SIZE + 0.5);
  const tcz = Math.floor(tz / CELL_SIZE + 0.5);

  if (pcx === tcx && pcz === tcz) return true;

  const dx = tcx - pcx;
  const dz = tcz - pcz;
  const steps = Math.max(Math.abs(dx), Math.abs(dz));
  if (steps === 0) return true;

  let cx = pcx;
  let cz = pcz;

  for (let s = 0; s < steps; s++) {
    const nx = pcx + Math.round((dx * (s + 1)) / steps);
    const nz = pcz + Math.round((dz * (s + 1)) / steps);

    if (nx !== cx && nz !== cz) {
      const canX = canCross(maze, cx, cz, nx, cz);
      const canZ = canCross(maze, cx, cz, cx, nz);
      if (!canX && !canZ) return false;
      if (canX && canCross(maze, nx, cz, nx, nz)) { cx = nx; cz = nz; continue; }
      if (canZ && canCross(maze, cx, nz, nx, nz)) { cx = nx; cz = nz; continue; }
      return false;
    }

    if (!canCross(maze, cx, cz, nx, nz)) return false;
    cx = nx;
    cz = nz;
  }

  return true;
}

function canCross(maze: MazeData, x1: number, z1: number, x2: number, z2: number): boolean {
  if (x1 < 0 || x1 >= maze.width || z1 < 0 || z1 >= maze.height) return false;
  if (x2 < 0 || x2 >= maze.width || z2 < 0 || z2 >= maze.height) return false;

  const cell = maze.cells[z1][x1];
  const dx = x2 - x1;
  const dz = z2 - z1;

  if (dx === 1 && dz === 0) return !cell.walls.east;
  if (dx === -1 && dz === 0) return !cell.walls.west;
  if (dz === 1 && dx === 0) return !cell.walls.south;
  if (dz === -1 && dx === 0) return !cell.walls.north;
  if (dx === 0 && dz === 0) return true;

  return false;
}

let _fireTexture: THREE.CanvasTexture | null = null;
function getFireSpriteTexture(): THREE.CanvasTexture {
  if (_fireTexture) return _fireTexture;
  const canvas = document.createElement("canvas");
  const frameCount = 8;
  const frameSize = 128;
  canvas.width = frameSize * frameCount;
  canvas.height = frameSize;
  const ctx = canvas.getContext("2d")!;

  for (let f = 0; f < frameCount; f++) {
    const ox = f * frameSize;
    const cx = ox + frameSize / 2;
    const cy = frameSize;
    const seed = f * 137.5;

    for (let layer = 0; layer < 6; layer++) {
      const layerR = 1 - layer / 6;
      const h = frameSize * (0.85 - layer * 0.1);
      const w = frameSize * (0.32 - layer * 0.03);
      const wobble = Math.sin(seed + layer * 2.1) * 6;

      const grad = ctx.createRadialGradient(
        cx + wobble, cy - h * 0.4, 0,
        cx + wobble, cy - h * 0.3, w * layerR
      );

      if (layer < 2) {
        grad.addColorStop(0, `rgba(255,${220 + layer * 15},${80 + layer * 30},${0.95 - layer * 0.1})`);
        grad.addColorStop(0.4, `rgba(255,${140 + layer * 20},10,${0.6 - layer * 0.1})`);
        grad.addColorStop(0.8, `rgba(220,60,0,${0.2})`);
        grad.addColorStop(1, "rgba(180,30,0,0)");
      } else if (layer < 4) {
        grad.addColorStop(0, `rgba(255,${250 - layer * 10},${180 + layer * 15},${0.75 - layer * 0.08})`);
        grad.addColorStop(0.5, `rgba(255,${180 - layer * 15},${50 + layer * 10},${0.35})`);
        grad.addColorStop(1, "rgba(200,40,0,0)");
      } else {
        grad.addColorStop(0, `rgba(255,255,${220 - layer * 10},${0.5})`);
        grad.addColorStop(0.6, `rgba(255,200,80,${0.15})`);
        grad.addColorStop(1, "rgba(255,100,0,0)");
      }

      ctx.beginPath();
      const tipY = cy - h;
      const baseW = w * layerR;
      ctx.moveTo(cx + wobble, tipY + Math.sin(seed + layer) * 5);
      ctx.bezierCurveTo(
        cx + baseW * 0.7 + wobble, tipY + h * 0.25,
        cx + baseW * 1.1 + Math.sin(seed + layer * 3) * 3, cy - h * 0.12,
        cx + baseW * 0.35, cy
      );
      ctx.lineTo(cx - baseW * 0.35, cy);
      ctx.bezierCurveTo(
        cx - baseW * 1.1 - Math.sin(seed + layer * 3) * 3, cy - h * 0.12,
        cx - baseW * 0.7 + wobble, tipY + h * 0.25,
        cx + wobble, tipY + Math.sin(seed + layer) * 5
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const coreGrad = ctx.createRadialGradient(cx, cy - frameSize * 0.22, 0, cx, cy - frameSize * 0.25, frameSize * 0.12);
    coreGrad.addColorStop(0, "rgba(255,255,240,0.95)");
    coreGrad.addColorStop(0.3, "rgba(255,240,160,0.6)");
    coreGrad.addColorStop(0.7, "rgba(255,180,60,0.2)");
    coreGrad.addColorStop(1, "rgba(255,120,20,0)");
    ctx.fillStyle = coreGrad;
    ctx.fillRect(ox, 0, frameSize, frameSize);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  _fireTexture = tex;
  return tex;
}

let _particleTexture: THREE.CanvasTexture | null = null;
function getParticleTexture(): THREE.CanvasTexture {
  if (_particleTexture) return _particleTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,220,100,1)");
  gradient.addColorStop(0.3, "rgba(255,160,40,0.8)");
  gradient.addColorStop(0.6, "rgba(255,100,20,0.3)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  _particleTexture = new THREE.CanvasTexture(canvas);
  return _particleTexture;
}

function getLocalPositionInScene(node: THREE.Object3D, sceneRoot: THREE.Object3D): THREE.Vector3 {
  const pos = new THREE.Vector3();
  const mat = new THREE.Matrix4();
  let current: THREE.Object3D | null = node;
  const chain: THREE.Object3D[] = [];
  while (current && current !== sceneRoot) {
    chain.unshift(current);
    current = current.parent;
  }
  if (current === sceneRoot) {
    chain.unshift(sceneRoot);
  }
  mat.identity();
  for (const obj of chain) {
    obj.updateMatrix();
    mat.multiply(obj.matrix);
  }
  pos.setFromMatrixPosition(mat);
  return pos;
}

function TorchModelInstance({ placement, onFlameLocalPos }: {
  placement: TorchPlacement;
  onFlameLocalPos?: (pos: THREE.Vector3) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const reported = useRef(false);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const primitiveRef = useCallback((primitiveObj: THREE.Group | null) => {
    if (!primitiveObj || reported.current) return;
    reported.current = true;

    let flameLocalPos: THREE.Vector3 | null = null;
    primitiveObj.traverse((child: THREE.Object3D) => {
      if ((child.name === "Flame" || child.name === "Flame_flame1_0") && !flameLocalPos) {
        flameLocalPos = getLocalPositionInScene(child, primitiveObj);
        child.visible = false;
      }
      if (child.name.startsWith("Flame2") || child.name.startsWith("Flame3")) {
        child.visible = false;
      }
    });
    if (flameLocalPos && onFlameLocalPos) {
      onFlameLocalPos(flameLocalPos);
    }
  }, [onFlameLocalPos]);

  const angle = Math.atan2(placement.nx, placement.nz);

  return (
    <group position={placement.pos} rotation={[0, angle, 0]}>
      <group position={[0, -0.4, -0.02]}>
        <primitive ref={primitiveRef} object={clonedScene} />
      </group>
    </group>
  );
}

function SpriteFlame({ position, opacityRef }: { position: [number, number, number]; opacityRef: React.RefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const frameCount = 8;
  const frameWidth = 1 / frameCount;
  const frameRef = useRef(Math.floor(Math.random() * frameCount));
  const elapsed = useRef(0);

  const tex = useMemo(() => {
    const base = getFireSpriteTexture();
    const t = base.clone();
    t.repeat.set(frameWidth, 1);
    t.offset.set(0, 0);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, [frameWidth]);

  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current > 0.09) {
      elapsed.current = 0;
      frameRef.current = (frameRef.current + 1) % frameCount;
      tex.offset.x = frameRef.current * frameWidth;
    }
    if (meshRef.current) {
      const t = performance.now() * 0.001;
      meshRef.current.scale.x = 1 + Math.sin(t * 7.3) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(t * 5.7 + 1) * 0.08;
    }
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current!;
    }
  });

  return (
    <Billboard position={position}>
      <mesh ref={meshRef}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          transparent
          alphaTest={0.01}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}

function SpriteFlameInner({ position, opacityRef }: { position: [number, number, number]; opacityRef: React.RefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const frameCount = 8;
  const frameWidth = 1 / frameCount;
  const frameRef = useRef(Math.floor(Math.random() * frameCount));
  const elapsed = useRef(0);

  const tex = useMemo(() => {
    const base = getFireSpriteTexture();
    const t = base.clone();
    t.repeat.set(frameWidth, 1);
    t.offset.set(4 * frameWidth, 0);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, [frameWidth]);

  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current > 0.075) {
      elapsed.current = 0;
      frameRef.current = (frameRef.current + 1) % frameCount;
      tex.offset.x = frameRef.current * frameWidth;
    }
    if (meshRef.current) {
      const t = performance.now() * 0.001;
      meshRef.current.scale.x = 0.9 + Math.cos(t * 9.1) * 0.12;
      meshRef.current.scale.y = 0.9 + Math.sin(t * 6.3 + 2) * 0.1;
    }
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current! * 0.8;
    }
  });

  return (
    <Billboard position={position}>
      <mesh ref={meshRef}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          transparent
          alphaTest={0.01}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}

function FireParticles({ position, opacityRef }: {
  position: [number, number, number];
  opacityRef: React.RefObject<number>;
}) {
  const count = 30;
  const meshRef = useRef<THREE.Points>(null!);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.04;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.random() * 0.15;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      velocities[i * 3] = (Math.random() - 0.5) * 0.006;
      velocities[i * 3 + 1] = 0.008 + Math.random() * 0.012;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
    }
    return { positions, velocities };
  }, []);

  const posRef = useRef(positions.slice());
  const lifetimeRef = useRef(new Float32Array(count).map(() => Math.random()));

  const matRef = useRef<THREE.PointsMaterial>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      lifetimeRef.current[i] -= delta * 0.9;
      if (lifetimeRef.current[i] <= 0) {
        lifetimeRef.current[i] = 1.0;
        const r = Math.random() * 0.04;
        const theta = Math.random() * Math.PI * 2;
        posRef.current[i * 3] = Math.cos(theta) * r;
        posRef.current[i * 3 + 1] = Math.random() * 0.08;
        posRef.current[i * 3 + 2] = Math.sin(theta) * r;
      } else {
        posRef.current[i * 3] += velocities[i * 3] + (Math.random() - 0.5) * 0.002;
        posRef.current[i * 3 + 1] += velocities[i * 3 + 1];
        posRef.current[i * 3 + 2] += velocities[i * 3 + 2] + (Math.random() - 0.5) * 0.002;
      }
      arr[i * 3] = posRef.current[i * 3];
      arr[i * 3 + 1] = posRef.current[i * 3 + 1];
      arr[i * 3 + 2] = posRef.current[i * 3 + 2];
    }
    pos.needsUpdate = true;

    if (matRef.current) {
      matRef.current.opacity = opacityRef.current! * 0.6;
    }
  });

  return (
    <points ref={meshRef} position={position} geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        map={getParticleTexture()}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ff9030"
      />
    </points>
  );
}

function TorchFlameEffect({ worldPos, opacityRef }: {
  worldPos: [number, number, number];
  opacityRef: React.RefObject<number>;
}) {
  const boneY = worldPos[1] - 0.06;
  const flamePos: [number, number, number] = [worldPos[0], boneY + 0.18, worldPos[2]];
  const innerPos: [number, number, number] = [worldPos[0], boneY + 0.20, worldPos[2]];
  const lightPos: [number, number, number] = [worldPos[0], boneY + 0.12, worldPos[2]];
  const particlePos: [number, number, number] = [worldPos[0], boneY, worldPos[2]];

  const lightRef = useRef<THREE.PointLight>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    const o = opacityRef.current!;
    if (groupRef.current) {
      groupRef.current.visible = o > 0.01;
    }
    if (!lightRef.current) return;
    const t = time.current;
    const flicker =
      4.0 +
      Math.sin(t * 8.3) * 1.0 +
      Math.sin(t * 13.7 + 1.2) * 0.5 +
      Math.sin(t * 5.1 + 2.5) * 0.6;
    lightRef.current.intensity = flicker * o;
    lightRef.current.position.x = lightPos[0] + Math.sin(t * 6) * 0.02;
    lightRef.current.position.z = lightPos[2] + Math.cos(t * 7) * 0.02;
  });

  return (
    <group ref={groupRef}>
      <SpriteFlame position={flamePos} opacityRef={opacityRef} />
      <SpriteFlameInner position={innerPos} opacityRef={opacityRef} />
      <FireParticles position={particlePos} opacityRef={opacityRef} />
      <pointLight
        ref={lightRef}
        position={lightPos}
        color="#ff8830"
        intensity={4.0}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}

function NearbyFlameEffects({ torchPlacements, maze }: { torchPlacements: TorchPlacement[]; maze: MazeData }) {
  const worldPositions = useMemo(() => {
    return torchPlacements.map(tp => {
      const tipOffset = 0.13;
      return [
        tp.pos[0] + tp.nx * tipOffset,
        tp.pos[1],
        tp.pos[2] + tp.nz * tipOffset,
      ] as [number, number, number];
    });
  }, [torchPlacements]);

  const opacitiesArr = useRef<Float32Array>(new Float32Array(torchPlacements.length));
  const opacityRefs = useRef<React.RefObject<number>[]>([]);
  const activeSetRef = useRef<Set<number>>(new Set());
  const sortTimerRef = useRef(0);
  const [renderIndices, setRenderIndices] = useState<number[]>([]);

  if (opacityRefs.current.length !== torchPlacements.length) {
    opacityRefs.current = torchPlacements.map(() => ({ current: 0 }));
    opacitiesArr.current = new Float32Array(torchPlacements.length);
  }

  useFrame((_, delta) => {
    sortTimerRef.current += delta;
    const pp = useGameState.getState().playerPosition;

    if (sortTimerRef.current > 0.3) {
      sortTimerRef.current = 0;

      const dists: { i: number; dist: number }[] = [];
      for (let i = 0; i < worldPositions.length; i++) {
        const pos = worldPositions[i];
        const d = Math.sqrt((pos[0] - pp.x) ** 2 + (pos[2] - pp.z) ** 2);
        dists.push({ i, dist: d });
      }
      dists.sort((a, b) => a.dist - b.dist);

      const newActive = new Set<number>();
      for (const { i, dist } of dists) {
        if (newActive.size >= MAX_FLAME_TORCHES) break;
        if (dist < FLAME_ON_DIST) {
          const pos = worldPositions[i];
          if (hasLineOfSight(maze, pp.x, pp.z, pos[0], pos[2])) {
            newActive.add(i);
          }
        }
      }

      for (const idx of activeSetRef.current) {
        if (!newActive.has(idx) && opacitiesArr.current[idx] > 0.01) {
          const pos = worldPositions[idx];
          const d = Math.sqrt((pos[0] - pp.x) ** 2 + (pos[2] - pp.z) ** 2);
          if (d < FLAME_OFF_DIST) {
            newActive.add(idx);
          }
        }
      }

      activeSetRef.current = newActive;

      const indices = Array.from(newActive);
      setRenderIndices(prev => {
        if (prev.length === indices.length && prev.every((v, j) => v === indices[j])) return prev;
        return indices;
      });
    }

    for (let i = 0; i < torchPlacements.length; i++) {
      if (activeSetRef.current.has(i)) {
        opacitiesArr.current[i] = Math.min(1, opacitiesArr.current[i] + delta * FADE_IN_SPEED);
      } else {
        opacitiesArr.current[i] = Math.max(0, opacitiesArr.current[i] - delta * FADE_OUT_SPEED);
      }
      if (opacityRefs.current[i]) {
        opacityRefs.current[i].current = opacitiesArr.current[i];
      }
    }
  });

  return (
    <>
      {renderIndices.map(idx => (
        <TorchFlameEffect
          key={idx}
          worldPos={worldPositions[idx]}
          opacityRef={opacityRefs.current[idx]}
        />
      ))}
    </>
  );
}

export function WallTorchGLTFModels({ torchPlacements, maze }: { torchPlacements: TorchPlacement[]; maze: MazeData }) {
  return (
    <>
      {torchPlacements.map((tp, i) => (
        <TorchModelInstance key={i} placement={tp} />
      ))}
      <NearbyFlameEffects torchPlacements={torchPlacements} maze={maze} />
    </>
  );
}

useGLTF.preload(MODEL_URL);
