const CELL_SIZE = 4;

export interface Point2D {
  x: number;
  y: number;
}

export function poissonDiskSample(
  width: number,
  height: number,
  minDist: number,
  maxAttempts: number = 30,
  existingPoints: Point2D[] = []
): Point2D[] {
  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  const grid: (Point2D | null)[] = new Array(gridW * gridH).fill(null);

  const points: Point2D[] = [];
  const active: number[] = [];

  const gridIndex = (x: number, y: number) => {
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH) return -1;
    return gy * gridW + gx;
  };

  const addPoint = (p: Point2D) => {
    const idx = gridIndex(p.x, p.y);
    if (idx < 0) return;
    grid[idx] = p;
    const i = points.length;
    points.push(p);
    active.push(i);
  };

  for (const ep of existingPoints) {
    const idx = gridIndex(ep.x, ep.y);
    if (idx >= 0) {
      grid[idx] = ep;
      points.push(ep);
    }
  }

  if (active.length === 0) {
    addPoint({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }

  while (active.length > 0) {
    const randIdx = Math.floor(Math.random() * active.length);
    const pointIdx = active[randIdx];
    const center = points[pointIdx];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minDist + Math.random() * minDist;
      const nx = center.x + Math.cos(angle) * r;
      const ny = center.y + Math.sin(angle) * r;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const gx = Math.floor(nx / cellSize);
      const gy = Math.floor(ny / cellSize);
      let tooClose = false;

      for (let dy = -2; dy <= 2 && !tooClose; dy++) {
        for (let dx = -2; dx <= 2 && !tooClose; dx++) {
          const cx = gx + dx;
          const cy = gy + dy;
          if (cx < 0 || cx >= gridW || cy < 0 || cy >= gridH) continue;
          const neighbor = grid[cy * gridW + cx];
          if (neighbor) {
            const ddx = neighbor.x - nx;
            const ddy = neighbor.y - ny;
            if (ddx * ddx + ddy * ddy < minDist * minDist) {
              tooClose = true;
            }
          }
        }
      }

      if (!tooClose) {
        addPoint({ x: nx, y: ny });
        found = true;
        break;
      }
    }

    if (!found) {
      active.splice(randIdx, 1);
    }
  }

  return points.slice(existingPoints.length);
}

export function poissonDiskOnCells(
  candidates: Point2D[],
  minDistCells: number,
  maxCount: number
): Point2D[] {
  if (candidates.length === 0) return [];

  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: Point2D[] = [];
  const minDistSq = minDistCells * minDistCells;

  for (const candidate of shuffled) {
    if (selected.length >= maxCount) break;

    let tooClose = false;
    for (const existing of selected) {
      const dx = candidate.x - existing.x;
      const dy = candidate.y - existing.y;
      if (dx * dx + dy * dy < minDistSq) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      selected.push(candidate);
    }
  }

  return selected;
}

export interface WallCandidate {
  worldX: number;
  worldY: number;
  worldZ: number;
  nx: number;
  nz: number;
}

export function poissonTorchPlacement(
  wallCandidates: WallCandidate[],
  minDist: number,
  maxCount: number
): WallCandidate[] {
  if (wallCandidates.length === 0) return [];

  const shuffled = [...wallCandidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: WallCandidate[] = [];
  const minDistSq = minDist * minDist;

  for (const candidate of shuffled) {
    if (selected.length >= maxCount) break;

    let tooClose = false;
    for (const existing of selected) {
      const dx = candidate.worldX - existing.worldX;
      const dz = candidate.worldZ - existing.worldZ;
      if (dx * dx + dz * dz < minDistSq) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      selected.push(candidate);
    }
  }

  return selected;
}
