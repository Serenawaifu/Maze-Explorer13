import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playPickup } from "../engine/audioSystem";
import { useGameState } from "../engine/gameState";

const SPARKLE_COUNT = 20;

interface CollectibleProps {
  position: { x: number; z: number };
  onCollect: () => void;
  type?: "normal" | "bonus" | "time";
}

const GEM_CONFIGS = {
  normal: {
    mainColor: "#ff8c00",
    emissive: "#ff6600",
    emissiveIntensity: 1.8,
    glowColor: "#ff8c00",
    sparkleColor: "#ffaa33",
    scale: 1,
  },
  bonus: {
    mainColor: "#ffd700",
    emissive: "#ffaa00",
    emissiveIntensity: 2.5,
    glowColor: "#ffd700",
    sparkleColor: "#ffee66",
    scale: 1.3,
  },
  time: {
    mainColor: "#00ccff",
    emissive: "#0088cc",
    emissiveIntensity: 2.0,
    glowColor: "#00ccff",
    sparkleColor: "#66ddff",
    scale: 1.1,
  },
};

export function Collectible({ position, onCollect, type = "normal" }: CollectibleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sparkleRef = useRef<THREE.Points>(null);
  const gemGroupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const collectedRef = useRef(false);
  const sparkleActiveRef = useRef(false);
  const sparkleTimerRef = useRef(0);
  const doneRef = useRef(false);

  const config = GEM_CONFIGS[type];

  const mainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: config.mainColor,
    roughness: type === "bonus" ? 0.3 : 0.65,
    metalness: type === "bonus" ? 0.8 : 0.05,
    emissive: config.emissive,
    emissiveIntensity: config.emissiveIntensity,
  }), [config, type]);

  const stemMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: type === "time" ? "#1a5a6a" : "#2d5a1e",
    roughness: 0.8,
  }), [type]);

  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: type === "time" ? "#2a7a8a" : "#3a7a28",
    roughness: 0.7,
    side: THREE.DoubleSide,
  }), [type]);

  const sparkleData = useMemo(() => {
    const positions = new Float32Array(SPARKLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      ));
    }
    return { positions, velocities };
  }, []);

  const sparkleMat = useMemo(() => new THREE.PointsMaterial({
    color: config.sparkleColor,
    size: 0.12,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [config]);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    if (sparkleActiveRef.current && sparkleRef.current) {
      sparkleTimerRef.current += delta;
      const geo = sparkleRef.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        arr[i * 3] += sparkleData.velocities[i].x * delta;
        arr[i * 3 + 1] += sparkleData.velocities[i].y * delta;
        arr[i * 3 + 2] += sparkleData.velocities[i].z * delta;
        sparkleData.velocities[i].y -= 5 * delta;
      }
      pos.needsUpdate = true;
      sparkleMat.opacity = Math.max(0, 1 - sparkleTimerRef.current * 2);
      if (sparkleTimerRef.current > 0.6) {
        sparkleActiveRef.current = false;
        doneRef.current = true;
        if (sparkleRef.current) sparkleRef.current.visible = false;
      }
      return;
    }

    if (collectedRef.current) return;
    if (!gemGroupRef.current) return;

    const t = performance.now() * 0.001;
    const rotSpeed = type === "bonus" ? 2.5 : 1.5;
    gemGroupRef.current.rotation.y += delta * rotSpeed;
    const bobSpeed = type === "bonus" ? 3 : 2;
    gemGroupRef.current.position.y = 0.8 + Math.sin(t * bobSpeed + position.x * 10) * 0.1;

    const playerPosition = useGameState.getState().playerPosition;
    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.5) {
      collectedRef.current = true;
      sparkleActiveRef.current = true;
      sparkleTimerRef.current = 0;
      sparkleMat.opacity = 1;
      if (gemGroupRef.current) gemGroupRef.current.visible = false;
      if (glowRef.current) glowRef.current.visible = false;
      if (sparkleRef.current) sparkleRef.current.visible = true;
      playPickup();
      onCollect();
    }
  });

  const s = config.scale;

  return (
    <group ref={groupRef}>
      <group ref={gemGroupRef} position={[position.x, 0.8, position.z]} scale={[s, s, s]}>
        {type === "time" ? (
          <>
            <mesh material={mainMaterial} rotation={[Math.PI / 4, 0, 0]}>
              <torusGeometry args={[0.2, 0.06, 8, 16]} />
            </mesh>
            <mesh material={mainMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} material={mainMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 6]} />
            </mesh>
          </>
        ) : type === "bonus" ? (
          <mesh material={mainMaterial}>
            <octahedronGeometry args={[0.28, 0]} />
          </mesh>
        ) : (
          <>
            <mesh material={mainMaterial}>
              <sphereGeometry args={[0.25, 16, 16]} />
            </mesh>
            <mesh position={[0, 0.28, 0]} material={stemMaterial}>
              <cylinderGeometry args={[0.02, 0.03, 0.1, 6]} />
            </mesh>
            <mesh position={[0.06, 0.3, 0]} rotation={[0, 0, -0.4]} material={leafMaterial}>
              <planeGeometry args={[0.12, 0.06]} />
            </mesh>
          </>
        )}
      </group>
      <mesh ref={glowRef} position={[position.x, 0.02, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5 * s, 24]} />
        <meshStandardMaterial
          color={config.glowColor}
          emissive={config.emissive}
          emissiveIntensity={2.5}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points ref={sparkleRef} visible={false} position={[position.x, 0.8, position.z]} material={sparkleMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkleData.positions, 3]} count={SPARKLE_COUNT} />
        </bufferGeometry>
      </points>
    </group>
  );
}
