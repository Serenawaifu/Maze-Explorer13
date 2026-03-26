import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameState } from "./gameState";
import type { MathGate as MathGateData } from "./mazeGenerator";

interface MathGateProps {
  gate: MathGateData;
  onCollect: (value: number, onPath: boolean) => void;
}

function createNumberTexture(value: number, onPath: boolean): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, size, size);

  const glowR = onPath ? "100, 200, 255" : "200, 100, 255";
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.45);
  grad.addColorStop(0, `rgba(${glowR}, 0.3)`);
  grad.addColorStop(0.7, `rgba(${glowR}, 0.15)`);
  grad.addColorStop(1, `rgba(${glowR}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${glowR}, 0.5)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = "bold 56px 'Orbitron', monospace, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = `rgba(${glowR}, 0.8)`;
  ctx.shadowBlur = 15;
  ctx.fillText(String(value), size / 2, size / 2);

  ctx.font = "14px monospace";
  ctx.fillStyle = `rgba(${glowR}, 0.7)`;
  ctx.shadowBlur = 0;
  ctx.fillText(`+${value}`, size / 2, size * 0.78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function MathGateComponent({ gate, onCollect }: MathGateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const flashTimer = useRef(0);

  const texture = useMemo(() => createNumberTexture(gate.value, gate.onPath), [gate.value, gate.onPath]);

  const ringColor = gate.onPath ? "#3388cc" : "#8833cc";
  const ringEmissive = gate.onPath ? "#2266aa" : "#6622aa";
  const lightColor = gate.onPath ? "#4488cc" : "#8844cc";

  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: ringColor,
    emissive: ringEmissive,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [ringColor, ringEmissive]);

  const numberMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
    emissive: lightColor,
    emissiveIntensity: 0.5,
  }), [texture, lightColor]);

  useFrame((_, delta) => {
    if (collected) {
      if (flashOpacity > 0) {
        flashTimer.current += delta;
        setFlashOpacity(Math.max(0, 1 - flashTimer.current * 3));
      }
      return;
    }
    if (!groupRef.current) return;

    const t = performance.now() * 0.001;
    groupRef.current.rotation.y += delta * 0.8;
    groupRef.current.position.y = 1.2 + Math.sin(t * 1.5) * 0.15;

    const playerPos = useGameState.getState().playerPosition;
    const dx = playerPos.x - gate.worldX;
    const dz = playerPos.z - gate.worldZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.0) {
      setCollected(true);
      setFlashOpacity(1);
      flashTimer.current = 0;
      onCollect(gate.value, gate.onPath);
    }
  });

  if (collected && flashOpacity <= 0) return null;

  return (
    <group ref={groupRef} position={[gate.worldX, 1.2, gate.worldZ]}>
      {!collected && (
        <>
          <mesh material={ringMat} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.6, 0.04, 8, 24]} />
          </mesh>
          <mesh material={ringMat} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.03, 8, 24]} />
          </mesh>
          <mesh material={numberMat}>
            <planeGeometry args={[1.0, 1.0]} />
          </mesh>
          <mesh material={numberMat} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.0, 1.0]} />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            color={lightColor}
            intensity={2}
            distance={8}
            decay={2}
          />
        </>
      )}
      {collected && flashOpacity > 0 && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color="#66bbff"
            emissive="#44aaff"
            emissiveIntensity={3}
            transparent
            opacity={flashOpacity * 0.6}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
