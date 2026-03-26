import { poissonDiskOnCells } from "./pcg";

export interface MazeCell {
  x: number;
  y: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
  visited: boolean;
}

export type MazeAlgorithm = "recursive-backtracker" | "prims" | "kruskals" | "rooms-and-corridors" | "binary-tree";

export interface MathGate {
  cellX: number;
  cellY: number;
  value: number;
  wall: "north" | "south" | "east" | "west";
  worldX: number;
  worldZ: number;
  collected: boolean;
  onPath: boolean;
}

export interface MazeData {
  width: number;
  height: number;
  cells: MazeCell[][];
  start: { x: number; y: number };
  end: { x: number; y: number };
  algorithm: MazeAlgorithm;
  mathGates: MathGate[];
  targetSum: number;
  deadEnds: { x: number; y: number }[];
}

const CELL_SIZE = 4;

function createGrid(width: number, height: number): MazeCell[][] {
  const cells: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = { x, y, walls: { north: true, south: true, east: true, west: true }, visited: false };
    }
  }
  return cells;
}

function removeWall(a: MazeCell, b: MazeCell) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  if (dx === 1) { a.walls.west = false; b.walls.east = false; }
  else if (dx === -1) { a.walls.east = false; b.walls.west = false; }
  if (dy === 1) { a.walls.north = false; b.walls.south = false; }
  else if (dy === -1) { a.walls.south = false; b.walls.north = false; }
}

function getUnvisitedNeighbors(cell: MazeCell, cells: MazeCell[][], width: number, height: number): MazeCell[] {
  const neighbors: MazeCell[] = [];
  const { x, y } = cell;
  if (y > 0 && !cells[y - 1][x].visited) neighbors.push(cells[y - 1][x]);
  if (y < height - 1 && !cells[y + 1][x].visited) neighbors.push(cells[y + 1][x]);
  if (x > 0 && !cells[y][x - 1].visited) neighbors.push(cells[y][x - 1]);
  if (x < width - 1 && !cells[y][x + 1].visited) neighbors.push(cells[y][x + 1]);
  return neighbors;
}

function generateRecursiveBacktracker(cells: MazeCell[][], width: number, height: number, start: { x: number; y: number } = { x: 0, y: 0 }, extraPassageRate: number = 0.10) {
  const stack: MazeCell[] = [];
  const startCell = cells[start.y][start.x];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, cells, width, height);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  const totalCells = width * height;
  const extraPassages = Math.floor(totalCells * extraPassageRate);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const cell = cells[y][x];
    const dirs: { dx: number; dy: number; wall: keyof typeof cell.walls; opposite: string }[] = [
      { dx: 0, dy: -1, wall: "north", opposite: "south" },
      { dx: 0, dy: 1, wall: "south", opposite: "north" },
      { dx: 1, dy: 0, wall: "east", opposite: "west" },
      { dx: -1, dy: 0, wall: "west", opposite: "east" },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && cell.walls[dir.wall]) {
      cell.walls[dir.wall] = false;
      cells[ny][nx].walls[dir.opposite as keyof MazeCell["walls"]] = false;
    }
  }
}

interface Edge {
  x1: number; y1: number;
  x2: number; y2: number;
  weight: number;
}

function generatePrims(cells: MazeCell[][], width: number, height: number, start: { x: number; y: number } = { x: 0, y: 0 }, extraPassageRate: number = 0.10) {
  const inMaze = new Set<string>();
  const frontier: Edge[] = [];

  const key = (x: number, y: number) => `${x},${y}`;

  const addFrontier = (x: number, y: number) => {
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    ];
    for (const d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !inMaze.has(key(nx, ny))) {
        frontier.push({ x1: x, y1: y, x2: nx, y2: ny, weight: Math.random() });
      }
    }
  };

  inMaze.add(key(start.x, start.y));
  cells[start.y][start.x].visited = true;
  addFrontier(start.x, start.y);

  while (frontier.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].weight < frontier[minIdx].weight) minIdx = i;
    }
    const edge = frontier[minIdx];
    frontier.splice(minIdx, 1);

    const k2 = key(edge.x2, edge.y2);
    if (inMaze.has(k2)) continue;

    inMaze.add(k2);
    cells[edge.y2][edge.x2].visited = true;
    removeWall(cells[edge.y1][edge.x1], cells[edge.y2][edge.x2]);
    addFrontier(edge.x2, edge.y2);
  }

  const extraPassages = Math.floor(width * height * extraPassageRate);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const cell = cells[y][x];
    const dirs: { dx: number; dy: number; wall: keyof typeof cell.walls; opposite: string }[] = [
      { dx: 0, dy: -1, wall: "north", opposite: "south" },
      { dx: 0, dy: 1, wall: "south", opposite: "north" },
      { dx: 1, dy: 0, wall: "east", opposite: "west" },
      { dx: -1, dy: 0, wall: "west", opposite: "east" },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && cell.walls[dir.wall]) {
      cell.walls[dir.wall] = false;
      cells[ny][nx].walls[dir.opposite as keyof MazeCell["walls"]] = false;
    }
  }
}

function generateKruskals(cells: MazeCell[][], width: number, height: number, extraPassageRate: number = 0.08) {
  const parent: number[] = [];
  const rank: number[] = [];
  const total = width * height;

  for (let i = 0; i < total; i++) {
    parent[i] = i;
    rank[i] = 0;
  }

  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const union = (a: number, b: number): boolean => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
    return true;
  };

  const cellId = (x: number, y: number) => y * width + x;

  const edges: { x1: number; y1: number; x2: number; y2: number; weight: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < width - 1) edges.push({ x1: x, y1: y, x2: x + 1, y2: y, weight: Math.random() });
      if (y < height - 1) edges.push({ x1: x, y1: y, x2: x, y2: y + 1, weight: Math.random() });
    }
  }

  edges.sort((a, b) => a.weight - b.weight);

  for (const edge of edges) {
    const idA = cellId(edge.x1, edge.y1);
    const idB = cellId(edge.x2, edge.y2);
    if (union(idA, idB)) {
      removeWall(cells[edge.y1][edge.x1], cells[edge.y2][edge.x2]);
      cells[edge.y1][edge.x1].visited = true;
      cells[edge.y2][edge.x2].visited = true;
    }
  }

  const extraPassages = Math.floor(width * height * extraPassageRate);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const cell = cells[y][x];
    const dirs: { dx: number; dy: number; wall: keyof typeof cell.walls; opposite: string }[] = [
      { dx: 0, dy: -1, wall: "north", opposite: "south" },
      { dx: 0, dy: 1, wall: "south", opposite: "north" },
      { dx: 1, dy: 0, wall: "east", opposite: "west" },
      { dx: -1, dy: 0, wall: "west", opposite: "east" },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && cell.walls[dir.wall]) {
      cell.walls[dir.wall] = false;
      cells[ny][nx].walls[dir.opposite as keyof MazeCell["walls"]] = false;
    }
  }
}

function generateBinaryTree(cells: MazeCell[][], width: number, height: number, extraPassageRate: number = 0.05) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells[y][x].visited = true;
      const canGoNorth = y > 0;
      const canGoEast = x < width - 1;

      if (canGoNorth && canGoEast) {
        if (Math.random() < 0.5) {
          removeWall(cells[y][x], cells[y - 1][x]);
        } else {
          removeWall(cells[y][x], cells[y][x + 1]);
        }
      } else if (canGoNorth) {
        removeWall(cells[y][x], cells[y - 1][x]);
      } else if (canGoEast) {
        removeWall(cells[y][x], cells[y][x + 1]);
      }
    }
  }

  const extraPassages = Math.floor(width * height * extraPassageRate);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const cell = cells[y][x];
    const dirs: { dx: number; dy: number; wall: keyof typeof cell.walls; opposite: string }[] = [
      { dx: 0, dy: -1, wall: "north", opposite: "south" },
      { dx: 0, dy: 1, wall: "south", opposite: "north" },
      { dx: 1, dy: 0, wall: "east", opposite: "west" },
      { dx: -1, dy: 0, wall: "west", opposite: "east" },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && cell.walls[dir.wall]) {
      cell.walls[dir.wall] = false;
      cells[ny][nx].walls[dir.opposite as keyof MazeCell["walls"]] = false;
    }
  }
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

function generateRoomsAndCorridors(
  cells: MazeCell[][],
  width: number,
  height: number,
  extraPassageRate: number = 0.05
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells[y][x].visited = true;
    }
  }

  const rooms: Room[] = [];
  const minRoomSize = 3;
  const maxRoomSize = Math.max(4, Math.floor(Math.min(width, height) / 5));
  const attempts = width * height;

  for (let i = 0; i < attempts && rooms.length < Math.floor((width * height) / 30); i++) {
    const rw = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const rh = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const rangeX = width - rw - 2;
    const rangeY = height - rh - 2;
    if (rangeX <= 0 || rangeY <= 0) continue;
    const rx = 1 + Math.floor(Math.random() * rangeX);
    const ry = 1 + Math.floor(Math.random() * rangeY);

    let overlaps = false;
    for (const other of rooms) {
      if (
        rx - 1 < other.x + other.w &&
        rx + rw + 1 > other.x &&
        ry - 1 < other.y + other.h &&
        ry + rh + 1 > other.y
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let cy = ry; cy < ry + rh; cy++) {
        for (let cx = rx; cx < rx + rw; cx++) {
          if (cy > ry) cells[cy][cx].walls.north = false;
          if (cy < ry + rh - 1) cells[cy][cx].walls.south = false;
          if (cx > rx) cells[cy][cx].walls.west = false;
          if (cx < rx + rw - 1) cells[cy][cx].walls.east = false;

          if (cy > ry) cells[cy - 1][cx].walls.south = false;
          if (cy < ry + rh - 1) cells[cy + 1][cx].walls.north = false;
          if (cx > rx) cells[cy][cx - 1].walls.east = false;
          if (cx < rx + rw - 1) cells[cy][cx + 1].walls.west = false;
        }
      }
    }
  }

  const roomCenters = rooms.map((r) => ({
    x: Math.floor(r.x + r.w / 2),
    y: Math.floor(r.y + r.h / 2),
  }));

  for (let i = 0; i < roomCenters.length - 1; i++) {
    const a = roomCenters[i];
    const b = roomCenters[i + 1];

    let cx = a.x;
    let cy = a.y;

    const horizFirst = Math.random() < 0.5;

    if (horizFirst) {
      while (cx !== b.x) {
        const next = cx + (b.x > cx ? 1 : -1);
        if (b.x > cx) {
          cells[cy][cx].walls.east = false;
          cells[cy][next].walls.west = false;
        } else {
          cells[cy][cx].walls.west = false;
          cells[cy][next].walls.east = false;
        }
        cx = next;
      }
      while (cy !== b.y) {
        const next = cy + (b.y > cy ? 1 : -1);
        if (b.y > cy) {
          cells[cy][cx].walls.south = false;
          cells[next][cx].walls.north = false;
        } else {
          cells[cy][cx].walls.north = false;
          cells[next][cx].walls.south = false;
        }
        cy = next;
      }
    } else {
      while (cy !== b.y) {
        const next = cy + (b.y > cy ? 1 : -1);
        if (b.y > cy) {
          cells[cy][cx].walls.south = false;
          cells[next][cx].walls.north = false;
        } else {
          cells[cy][cx].walls.north = false;
          cells[next][cx].walls.south = false;
        }
        cy = next;
      }
      while (cx !== b.x) {
        const next = cx + (b.x > cx ? 1 : -1);
        if (b.x > cx) {
          cells[cy][cx].walls.east = false;
          cells[cy][next].walls.west = false;
        } else {
          cells[cy][cx].walls.west = false;
          cells[cy][next].walls.east = false;
        }
        cx = next;
      }
    }
  }

  const unconnected: { x: number; y: number }[] = [];
  const connected = new Set<string>();

  for (const room of rooms) {
    for (let cy = room.y; cy < room.y + room.h; cy++) {
      for (let cx = room.x; cx < room.x + room.w; cx++) {
        connected.add(`${cx},${cy}`);
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y][x];
      const hasOpen = !cell.walls.north || !cell.walls.south || !cell.walls.east || !cell.walls.west;
      if (hasOpen) connected.add(`${x},${y}`);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!connected.has(`${x},${y}`)) {
        unconnected.push({ x, y });
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const uc of unconnected) {
      if (connected.has(`${uc.x},${uc.y}`)) continue;
      const dirs = [
        { dx: 0, dy: -1, wall: "north" as const, opp: "south" as const },
        { dx: 0, dy: 1, wall: "south" as const, opp: "north" as const },
        { dx: 1, dy: 0, wall: "east" as const, opp: "west" as const },
        { dx: -1, dy: 0, wall: "west" as const, opp: "east" as const },
      ];
      for (const d of dirs) {
        const nx = uc.x + d.dx;
        const ny = uc.y + d.dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && connected.has(`${nx},${ny}`)) {
          cells[uc.y][uc.x].walls[d.wall] = false;
          cells[ny][nx].walls[d.opp] = false;
          connected.add(`${uc.x},${uc.y}`);
          changed = true;
          break;
        }
      }
    }
  }

  for (const uc of unconnected) {
    if (connected.has(`${uc.x},${uc.y}`)) continue;
    const dirs = [
      { dx: 0, dy: -1, wall: "north" as const, opp: "south" as const },
      { dx: 0, dy: 1, wall: "south" as const, opp: "north" as const },
      { dx: 1, dy: 0, wall: "east" as const, opp: "west" as const },
      { dx: -1, dy: 0, wall: "west" as const, opp: "east" as const },
    ];
    const validDirs = dirs.filter(d => {
      const nx = uc.x + d.dx;
      const ny = uc.y + d.dy;
      return nx >= 0 && nx < width && ny >= 0 && ny < height;
    });
    if (validDirs.length > 0) {
      const d = validDirs[Math.floor(Math.random() * validDirs.length)];
      const nx = uc.x + d.dx;
      const ny = uc.y + d.dy;
      cells[uc.y][uc.x].walls[d.wall] = false;
      cells[ny][nx].walls[d.opp] = false;
      connected.add(`${uc.x},${uc.y}`);
    }
  }

  const extraPassages = Math.floor(width * height * extraPassageRate);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const cell = cells[y][x];
    const dirs: { dx: number; dy: number; wall: keyof typeof cell.walls; opposite: string }[] = [
      { dx: 0, dy: -1, wall: "north", opposite: "south" },
      { dx: 0, dy: 1, wall: "south", opposite: "north" },
      { dx: 1, dy: 0, wall: "east", opposite: "west" },
      { dx: -1, dy: 0, wall: "west", opposite: "east" },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && cell.walls[dir.wall]) {
      cell.walls[dir.wall] = false;
      cells[ny][nx].walls[dir.opposite as keyof MazeCell["walls"]] = false;
    }
  }
}

function ensurePathExists(
  cells: MazeCell[][],
  width: number,
  height: number,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const visited = new Set<string>();
  const queue: { x: number; y: number }[] = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const cell = cells[cur.y][cur.x];
    const neighbors: { x: number; y: number }[] = [];
    if (!cell.walls.north && cur.y > 0) neighbors.push({ x: cur.x, y: cur.y - 1 });
    if (!cell.walls.south && cur.y < height - 1) neighbors.push({ x: cur.x, y: cur.y + 1 });
    if (!cell.walls.east && cur.x < width - 1) neighbors.push({ x: cur.x + 1, y: cur.y });
    if (!cell.walls.west && cur.x > 0) neighbors.push({ x: cur.x - 1, y: cur.y });
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(n);
      }
    }
  }

  if (visited.has(`${end.x},${end.y}`)) return;

  let cx = start.x;
  let cy = start.y;
  while (cx !== end.x || cy !== end.y) {
    if (cx !== end.x) {
      const next = cx + (end.x > cx ? 1 : -1);
      if (end.x > cx) {
        cells[cy][cx].walls.east = false;
        cells[cy][next].walls.west = false;
      } else {
        cells[cy][cx].walls.west = false;
        cells[cy][next].walls.east = false;
      }
      cx = next;
    } else {
      const next = cy + (end.y > cy ? 1 : -1);
      if (end.y > cy) {
        cells[cy][cx].walls.south = false;
        cells[next][cx].walls.north = false;
      } else {
        cells[cy][cx].walls.north = false;
        cells[next][cx].walls.south = false;
      }
      cy = next;
    }
  }
}

function findDeadEnds(cells: MazeCell[][], width: number, height: number, start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] {
  const deadEnds: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y][x];
      let openings = 0;
      if (!cell.walls.north) openings++;
      if (!cell.walls.south) openings++;
      if (!cell.walls.east) openings++;
      if (!cell.walls.west) openings++;
      if (openings === 1) {
        if (!(x === start.x && y === start.y) && !(x === end.x && y === end.y)) {
          deadEnds.push({ x, y });
        }
      }
    }
  }
  return deadEnds;
}

function solveMaze(cells: MazeCell[][], width: number, height: number, start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] {
  const visited = new Set<string>();
  const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [];
  queue.push({ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] });
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === end.x && current.y === end.y) return current.path;

    const cell = cells[current.y][current.x];
    const neighbors: { x: number; y: number }[] = [];
    if (!cell.walls.north && current.y > 0) neighbors.push({ x: current.x, y: current.y - 1 });
    if (!cell.walls.south && current.y < height - 1) neighbors.push({ x: current.x, y: current.y + 1 });
    if (!cell.walls.east && current.x < width - 1) neighbors.push({ x: current.x + 1, y: current.y });
    if (!cell.walls.west && current.x > 0) neighbors.push({ x: current.x - 1, y: current.y });

    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ x: n.x, y: n.y, path: [...current.path, { x: n.x, y: n.y }] });
      }
    }
  }
  return [];
}

function generateMathGates(cells: MazeCell[][], width: number, height: number, gateCount: number, start: { x: number; y: number }, end: { x: number; y: number }): { gates: MathGate[]; targetSum: number } {
  if (gateCount <= 0) return { gates: [], targetSum: 0 };

  const solution = solveMaze(cells, width, height, start, end);
  if (solution.length < 3) return { gates: [], targetSum: 0 };

  const pathIndices: number[] = [];
  for (let i = 1; i < solution.length - 1; i++) {
    pathIndices.push(i);
  }

  for (let i = pathIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pathIndices[i], pathIndices[j]] = [pathIndices[j], pathIndices[i]];
  }

  const selectedIndices = pathIndices.slice(0, Math.min(gateCount, pathIndices.length));
  selectedIndices.sort((a, b) => a - b);

  const gates: MathGate[] = [];
  let targetSum = 0;

  for (const idx of selectedIndices) {
    const from = solution[idx - 1];
    const to = solution[idx];
    const value = 1 + Math.floor(Math.random() * 9);
    targetSum += value;

    let wall: "north" | "south" | "east" | "west" = "north";
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 1) wall = "east";
    else if (dx === -1) wall = "west";
    else if (dy === 1) wall = "south";
    else if (dy === -1) wall = "north";

    const midX = (from.x + to.x) / 2 * CELL_SIZE;
    const midZ = (from.y + to.y) / 2 * CELL_SIZE;

    gates.push({
      cellX: from.x,
      cellY: from.y,
      value,
      wall,
      worldX: midX,
      worldZ: midZ,
      collected: false,
      onPath: true,
    });
  }

  const offPathCount = Math.floor(gateCount * 0.5);
  const nonPathCells: { x: number; y: number }[] = [];
  const pathSet = new Set(solution.map(p => `${p.x},${p.y}`));
  const gateSet = new Set(gates.map(g => `${g.cellX},${g.cellY}`));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!pathSet.has(`${x},${y}`) && !(x === start.x && y === start.y) && !(x === end.x && y === end.y) && !gateSet.has(`${x},${y}`)) {
        nonPathCells.push({ x, y });
      }
    }
  }
  const spacedDecoys = poissonDiskOnCells(nonPathCells, 3, offPathCount);
  for (let i = 0; i < spacedDecoys.length; i++) {
    const cell = spacedDecoys[i];
    const value = 1 + Math.floor(Math.random() * 9);
    gates.push({
      cellX: cell.x,
      cellY: cell.y,
      value,
      wall: "north",
      worldX: cell.x * CELL_SIZE,
      worldZ: cell.y * CELL_SIZE,
      collected: false,
      onPath: false,
    });
  }

  return { gates, targetSum };
}

function pickRandomStartEnd(width: number, height: number): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
  ];

  const edgeCells: { x: number; y: number }[] = [];
  for (let x = 0; x < width; x++) {
    edgeCells.push({ x, y: 0 });
    edgeCells.push({ x, y: height - 1 });
  }
  for (let y = 1; y < height - 1; y++) {
    edgeCells.push({ x: 0, y });
    edgeCells.push({ x: width - 1, y });
  }

  const startIdx = Math.floor(Math.random() * corners.length);
  const start = corners[startIdx];

  const candidates = edgeCells.filter(c => {
    const dist = Math.abs(c.x - start.x) + Math.abs(c.y - start.y);
    return dist >= Math.floor((width + height) / 2);
  });

  const end = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : corners[(startIdx + 2) % 4];

  return { start, end };
}

export function generateMaze(width: number, height: number, algorithm: MazeAlgorithm = "recursive-backtracker", mathGateCount: number = 0, extraPassageRate?: number): MazeData {
  const cells = createGrid(width, height);
  const { start, end } = pickRandomStartEnd(width, height);

  switch (algorithm) {
    case "prims":
      generatePrims(cells, width, height, start, extraPassageRate);
      break;
    case "kruskals":
      generateKruskals(cells, width, height, extraPassageRate);
      break;
    case "rooms-and-corridors":
      generateRoomsAndCorridors(cells, width, height, extraPassageRate);
      ensurePathExists(cells, width, height, start, end);
      break;
    case "binary-tree":
      generateBinaryTree(cells, width, height, extraPassageRate);
      break;
    case "recursive-backtracker":
    default:
      generateRecursiveBacktracker(cells, width, height, start, extraPassageRate);
      break;
  }

  const deadEnds = findDeadEnds(cells, width, height, start, end);
  const { gates, targetSum } = generateMathGates(cells, width, height, mathGateCount, start, end);

  return {
    width,
    height,
    cells,
    start,
    end,
    algorithm,
    mathGates: gates,
    targetSum,
    deadEnds,
  };
}

export function getWallSegments(maze: MazeData): { x: number; z: number; rotated: boolean }[] {
  const walls: { x: number; z: number; rotated: boolean }[] = [];

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.cells[y][x];
      const cx = x * CELL_SIZE;
      const cz = y * CELL_SIZE;

      if (cell.walls.north) {
        walls.push({ x: cx, z: cz - CELL_SIZE / 2, rotated: false });
      }
      if (cell.walls.west) {
        walls.push({ x: cx - CELL_SIZE / 2, z: cz, rotated: true });
      }
      if (x === maze.width - 1 && cell.walls.east) {
        walls.push({ x: cx + CELL_SIZE / 2, z: cz, rotated: true });
      }
      if (y === maze.height - 1 && cell.walls.south) {
        walls.push({ x: cx, z: cz + CELL_SIZE / 2, rotated: false });
      }
    }
  }

  return walls;
}

export function getCornerPillars(maze: MazeData): { x: number; z: number }[] {
  const pillars: { x: number; z: number }[] = [];
  const added = new Set<string>();

  const addPillar = (px: number, pz: number) => {
    const key = `${px.toFixed(1)},${pz.toFixed(1)}`;
    if (added.has(key)) return;
    added.add(key);
    pillars.push({ x: px, z: pz });
  };

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.cells[y][x];
      const cx = x * CELL_SIZE;
      const cz = y * CELL_SIZE;
      const half = CELL_SIZE / 2;

      const hasN = cell.walls.north;
      const hasS = cell.walls.south;
      const hasW = cell.walls.west;
      const hasE = cell.walls.east;

      if (hasN && hasW) addPillar(cx - half, cz - half);
      if (hasN && hasE) addPillar(cx + half, cz - half);
      if (hasS && hasW) addPillar(cx - half, cz + half);
      if (hasS && hasE) addPillar(cx + half, cz + half);

      if (hasN) {
        addPillar(cx - half, cz - half);
        addPillar(cx + half, cz - half);
      }
      if (hasS) {
        addPillar(cx - half, cz + half);
        addPillar(cx + half, cz + half);
      }
      if (hasW) {
        addPillar(cx - half, cz - half);
        addPillar(cx - half, cz + half);
      }
      if (hasE) {
        addPillar(cx + half, cz - half);
        addPillar(cx + half, cz + half);
      }
    }
  }

  return pillars;
}

export function getCollectiblePositions(
  maze: MazeData,
  count: number,
  bonusCount: number = 0,
  timePickupCount: number = 0
): { x: number; z: number; type: "normal" | "bonus" | "time" }[] {
  const positions: { x: number; z: number; type: "normal" | "bonus" | "time" }[] = [];
  const available: { x: number; y: number }[] = [];

  const gatePositions = new Set(maze.mathGates.map(g => `${g.cellX},${g.cellY}`));

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (x === maze.start.x && y === maze.start.y) continue;
      if (x === maze.end.x && y === maze.end.y) continue;
      if (gatePositions.has(`${x},${y}`)) continue;
      available.push({ x, y });
    }
  }

  const totalNeeded = count + bonusCount + timePickupCount;
  const minSpacing = Math.max(1.5, Math.sqrt((maze.width * maze.height) / (totalNeeded * 2)));
  const spaced = poissonDiskOnCells(available, minSpacing, totalNeeded);

  let idx = 0;

  for (let i = 0; i < Math.min(bonusCount, spaced.length) && idx < spaced.length; i++, idx++) {
    positions.push({ x: spaced[idx].x * CELL_SIZE, z: spaced[idx].y * CELL_SIZE, type: "bonus" });
  }

  for (let i = 0; i < Math.min(timePickupCount, spaced.length - idx) && idx < spaced.length; i++, idx++) {
    positions.push({ x: spaced[idx].x * CELL_SIZE, z: spaced[idx].y * CELL_SIZE, type: "time" });
  }

  const remainingNormal = Math.min(count, spaced.length - idx);
  for (let i = 0; i < remainingNormal && idx < spaced.length; i++, idx++) {
    positions.push({ x: spaced[idx].x * CELL_SIZE, z: spaced[idx].y * CELL_SIZE, type: "normal" });
  }

  return positions;
}

export function isDeadEnd(maze: MazeData, worldX: number, worldZ: number): boolean {
  const cellX = Math.round(worldX / CELL_SIZE);
  const cellY = Math.round(worldZ / CELL_SIZE);
  if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) return false;
  if (cellX === maze.start.x && cellY === maze.start.y) return false;
  if (cellX === maze.end.x && cellY === maze.end.y) return false;
  const cell = maze.cells[cellY][cellX];
  let openings = 0;
  if (!cell.walls.north) openings++;
  if (!cell.walls.south) openings++;
  if (!cell.walls.east) openings++;
  if (!cell.walls.west) openings++;
  return openings === 1;
}
