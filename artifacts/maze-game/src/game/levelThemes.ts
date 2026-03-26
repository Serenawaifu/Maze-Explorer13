export interface LevelTheme {
  name: string;
  wallHeight: number;
  wallThickness: number;
  wallColor: [number, number, number];
  wallBaseHex: string;
  wallBrickFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
  wallMortarColor: string;
  floorBaseHex: string;
  floorColor: [number, number, number];
  floorTileFn: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
  ceilingBaseHex: string;
  ceilingColor: [number, number, number];
  ceilingTileFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
  fogColor: string;
  fogColorHex: number;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  ambientIntensity: number;
  torchColor: string;
  directionalColor: string;
  wallRoughness: number;
  wallMetalness: number;
  floorRoughness: number;
}

function stoneBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 85 + Math.random() * 45;
  const g = 65 + Math.random() * 30;
  const b = 40 + Math.random() * 25;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const edgeShade = 0.75 + Math.random() * 0.12;
  ctx.fillStyle = `rgba(${Math.round(r * edgeShade)},${Math.round(g * edgeShade)},${Math.round(b * edgeShade)},0.35)`;
  ctx.fillRect(x + 1, y + 1, w - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, h - 2);
  ctx.fillStyle = `rgba(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)},0.25)`;
  ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
  ctx.fillRect(x + w - 3, y + 1, 2, h - 2);
  ctx.strokeStyle = `rgba(30,18,8,0.75)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 18; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    const shade = 55 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade},${shade * 0.65},${shade * 0.4},0.3)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 2, 1 + Math.random() * 1.5);
  }
  if (Math.random() < 0.15) {
    const grad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, 0, x + w * 0.5, y + h * 0.5, 5 + Math.random() * 4);
    grad.addColorStop(0, `rgba(${r - 15},${g - 12},${b - 8},0.15)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
  if (Math.random() < 0.12) {
    const sx = x + Math.random() * w * 0.5;
    const sy = y + Math.random() * h;
    ctx.strokeStyle = `rgba(25,15,8,0.15)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 5 + Math.random() * 10, sy + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
}

function hedgeLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const baseG = 50 + Math.random() * 40;
  ctx.fillStyle = `rgb(${15 + Math.random() * 15},${baseG},${10 + Math.random() * 12})`;
  ctx.fillRect(x, y, w, h);
  for (let layer = 0; layer < 3; layer++) {
    for (let n = 0; n < 12; n++) {
      const lx = x + Math.random() * w;
      const ly = y + Math.random() * h;
      const depth = 0.6 + layer * 0.15;
      const lg = (40 + Math.random() * 80) * depth;
      const lr = (10 + Math.random() * 25) * depth;
      const lb = (8 + Math.random() * 15) * depth;
      const size = 4 + Math.random() * 10;
      ctx.fillStyle = `rgba(${lr},${lg},${lb},${0.3 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(lx, ly, size, size * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let n = 0; n < 10; n++) {
    const vx = x + Math.random() * w;
    const vy = y + Math.random() * h;
    ctx.strokeStyle = `rgba(25,${55 + Math.random() * 35},15,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.quadraticCurveTo(vx + (Math.random() - 0.5) * 12, vy + Math.random() * 10, vx + (Math.random() - 0.5) * 8, vy + 6 + Math.random() * 10);
    ctx.stroke();
  }
  if (Math.random() < 0.2) {
    const fx = x + Math.random() * w;
    const fy = y + Math.random() * h;
    const colors = ["rgba(220,50,70,0.55)", "rgba(250,210,40,0.5)", "rgba(210,100,220,0.45)", "rgba(255,255,200,0.4)"];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(fx, fy, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(0,0,0,0.06)`;
  ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
}

function backroomsPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 195 + Math.random() * 25;
  const g = 185 + Math.random() * 20;
  const b = 125 + Math.random() * 25;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = `rgba(${r + 10},${g + 8},${b + 10},0.15)`;
  ctx.fillRect(x + 1, y + 1, w - 2, 2);
  ctx.fillStyle = `rgba(${r - 20},${g - 18},${b - 15},0.12)`;
  ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
  ctx.strokeStyle = `rgba(140,130,80,0.45)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  for (let n = 0; n < 15; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(${155 + Math.random() * 30},${145 + Math.random() * 25},${85 + Math.random() * 25},0.25)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  if (Math.random() < 0.4) {
    const sx = x + Math.random() * w;
    const sy = y + h * 0.2 + Math.random() * h * 0.6;
    const stainR = 6 + Math.random() * 14;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, stainR);
    grad.addColorStop(0, `rgba(${135 + Math.random() * 20},${125 + Math.random() * 15},${65 + Math.random() * 20},0.3)`);
    grad.addColorStop(0.6, `rgba(${155 + Math.random() * 15},${145 + Math.random() * 10},${80 + Math.random() * 15},0.12)`);
    grad.addColorStop(1, `rgba(180,170,110,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
  if (Math.random() < 0.08) {
    ctx.strokeStyle = `rgba(100,90,55,0.12)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.random() * w, y);
    ctx.lineTo(x + Math.random() * w, y + h);
    ctx.stroke();
  }
  if (Math.random() < 0.06) {
    ctx.fillStyle = `rgba(170,160,100,0.08)`;
    ctx.fillRect(x + 2, y + h * 0.3, w - 4, 1);
  }
}

function voxelBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const hue = Math.floor(Math.random() * 8);
  const colors = [
    [50, 140, 230],
    [60, 190, 90],
    [230, 70, 50],
    [210, 170, 40],
    [140, 70, 210],
    [50, 190, 190],
    [240, 130, 50],
    [90, 200, 140],
  ];
  const [cr, cg, cb] = colors[hue];
  const v = 0.82 + Math.random() * 0.18;
  ctx.fillStyle = `rgb(${Math.round(cr * v)},${Math.round(cg * v)},${Math.round(cb * v)})`;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgba(255,255,255,0.18)`;
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillStyle = `rgba(0,0,0,0.2)`;
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x + w - 3, y, 3, h);
  ctx.strokeStyle = `rgba(0,0,0,0.3)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  if (Math.random() < 0.2) {
    ctx.fillStyle = `rgba(255,255,255,0.1)`;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  }
  if (Math.random() < 0.1) {
    ctx.fillStyle = `rgba(0,0,0,0.06)`;
    ctx.fillRect(x + w * 0.3, y + h * 0.3, w * 0.4, h * 0.4);
  }
}

function candyStripe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const palettes = [
    [255, 140, 175],
    [215, 125, 200],
    [175, 135, 235],
    [255, 175, 145],
    [195, 215, 255],
    [255, 200, 130],
    [170, 230, 200],
  ];
  const [cr, cg, cb] = palettes[Math.floor(Math.random() * palettes.length)];
  const v = 0.88 + Math.random() * 0.12;
  ctx.fillStyle = `rgb(${Math.round(cr * v)},${Math.round(cg * v)},${Math.round(cb * v)})`;
  ctx.fillRect(x, y, w, h);
  const stripeW = 5 + Math.random() * 4;
  const angle = Math.random() < 0.5;
  if (angle) {
    for (let sx = x - h; sx < x + w; sx += stripeW * 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.18 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + stripeW, y);
      ctx.lineTo(sx + stripeW + h * 0.5, y + h);
      ctx.lineTo(sx + h * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    for (let sx = x; sx < x + w; sx += stripeW * 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.12})`;
      ctx.fillRect(sx, y, stripeW, h);
    }
  }
  for (let n = 0; n < 8; n++) {
    const dx = x + Math.random() * w;
    const dy = y + Math.random() * h;
    const dotColors = ["rgba(255,70,110,0.5)", "rgba(90,200,255,0.5)", "rgba(255,225,55,0.5)", "rgba(110,255,110,0.5)", "rgba(200,90,255,0.5)", "rgba(255,160,60,0.4)"];
    ctx.fillStyle = dotColors[Math.floor(Math.random() * dotColors.length)];
    ctx.beginPath();
    ctx.arc(dx, dy, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255,255,255,0.06)`;
  ctx.fillRect(x, y, w, h * 0.3);
  ctx.strokeStyle = `rgba(255,190,210,0.25)`;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function stoneFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = 55 + Math.random() * 25;
  const g = 45 + Math.random() * 18;
  const b = 32 + Math.random() * 14;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(25,18,10,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  for (let n = 0; n < 8; n++) {
    const nx = x + Math.random() * size;
    const ny = y + Math.random() * size;
    ctx.fillStyle = `rgba(${40 + Math.random() * 20},${30 + Math.random() * 15},${20 + Math.random() * 10},0.3)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function grassFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const g = 55 + Math.random() * 30;
  const r = 30 + Math.random() * 20;
  const b = 20 + Math.random() * 12;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x, y, size, size);
  for (let n = 0; n < 20; n++) {
    const bx = x + Math.random() * size;
    const by = y + Math.random() * size;
    const bg = 50 + Math.random() * 80;
    ctx.strokeStyle = `rgba(${20 + Math.random() * 20},${bg},${10 + Math.random() * 15},0.5)`;
    ctx.lineWidth = 0.5 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (Math.random() - 0.5) * 3, by - 3 - Math.random() * 4);
    ctx.stroke();
  }
  if (Math.random() < 0.15) {
    ctx.fillStyle = `rgba(${60 + Math.random() * 30},${40 + Math.random() * 20},${20 + Math.random() * 10},0.35)`;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.2 + Math.random() * size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function carpetFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = 160 + Math.random() * 20;
  const g = 140 + Math.random() * 15;
  const b = 90 + Math.random() * 20;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x, y, size, size);
  for (let n = 0; n < 30; n++) {
    const nx = x + Math.random() * size;
    const ny = y + Math.random() * size;
    ctx.fillStyle = `rgba(${140 + Math.random() * 30},${120 + Math.random() * 25},${70 + Math.random() * 25},0.2)`;
    ctx.fillRect(nx, ny, 1, 1);
  }
  if (Math.random() < 0.08) {
    const grad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size * 0.35);
    grad.addColorStop(0, `rgba(130,110,65,0.2)`);
    grad.addColorStop(1, `rgba(160,140,90,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, size, size);
  }
}

function gridFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = `rgb(${200 + Math.random() * 20},${200 + Math.random() * 20},${210 + Math.random() * 20})`;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(100,120,140,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  ctx.strokeStyle = "rgba(80,100,120,0.15)";
  ctx.lineWidth = 0.5;
  const half = size / 2;
  ctx.beginPath();
  ctx.moveTo(x + half, y);
  ctx.lineTo(x + half, y + size);
  ctx.moveTo(x, y + half);
  ctx.lineTo(x + size, y + half);
  ctx.stroke();
}

function candyFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const half = size / 2;
  const isEven = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
  if (isEven) {
    ctx.fillStyle = `rgb(${250 + Math.random() * 5},${200 + Math.random() * 20},${210 + Math.random() * 20})`;
  } else {
    ctx.fillStyle = `rgb(${220 + Math.random() * 15},${180 + Math.random() * 15},${240 + Math.random() * 15})`;
  }
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,220,240,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  if (Math.random() < 0.1) {
    const dotColors = ["rgba(255,100,130,0.35)", "rgba(130,200,255,0.35)", "rgba(255,230,80,0.35)"];
    ctx.fillStyle = dotColors[Math.floor(Math.random() * dotColors.length)];
    ctx.beginPath();
    ctx.arc(x + half, y + half, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function stoneCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const v = 20 + Math.random() * 15;
  ctx.fillStyle = `rgb(${v + 5},${v + 2},${v})`;
  ctx.fillRect(x, y + 1, w, h - 2);
  for (let n = 0; n < 8; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    ctx.fillStyle = `rgba(${v + 10},${v + 5},${v},0.4)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 3, 1);
  }
  ctx.strokeStyle = `rgba(${v - 5},${v - 8},${v - 10},0.6)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function skyCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 130 + Math.random() * 20;
  const g = 180 + Math.random() * 25;
  const b = 230 + Math.random() * 25;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, w, h);
  if (Math.random() < 0.3) {
    const cx = x + Math.random() * w;
    const cy = y + Math.random() * h;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10 + Math.random() * 15);
    grad.addColorStop(0, `rgba(255,255,255,${0.15 + Math.random() * 0.15})`);
    grad.addColorStop(1, `rgba(200,220,240,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
}

function fluorescentCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = `rgb(${210 + Math.random() * 15},${205 + Math.random() * 15},${190 + Math.random() * 15})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `rgba(160,155,130,0.6)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  if (Math.random() < 0.25) {
    const lx = x + w * 0.15;
    const ly = y + h * 0.35;
    const lw = w * 0.7;
    const lh = h * 0.3;
    ctx.fillStyle = `rgba(245,242,220,${0.6 + Math.random() * 0.3})`;
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = `rgba(200,195,170,0.4)`;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(lx, ly, lw, lh);
  }
  if (Math.random() < 0.1) {
    const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.3);
    grad.addColorStop(0, `rgba(180,170,120,0.15)`);
    grad.addColorStop(1, `rgba(210,200,180,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
}

function voxelCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = `rgb(${220 + Math.random() * 20},${220 + Math.random() * 20},${225 + Math.random() * 20})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(150,160,170,0.3)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = `rgba(255,255,255,0.08)`;
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = `rgba(0,0,0,0.05)`;
  ctx.fillRect(x, y + h - 1, w, 1);
}

function squidGamePanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const base = 58 + Math.random() * 12;
  const rShift = 5 + Math.random() * 8;
  ctx.fillStyle = `rgb(${base + rShift},${base + Math.random() * 4},${base - 3 + Math.random() * 4})`;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = `rgba(${base + 20},${base + 15},${base + 12},0.12)`;
  ctx.fillRect(x + 1, y + 1, w - 2, 2);
  ctx.fillStyle = `rgba(${base - 15},${base - 18},${base - 20},0.1)`;
  ctx.fillRect(x + 1, y + h - 3, w - 2, 2);

  ctx.strokeStyle = `rgba(45,42,38,0.6)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  for (let n = 0; n < 8; n++) {
    const nx = x + Math.random() * w;
    const ny = y + Math.random() * h;
    const sv = 50 + Math.random() * 25;
    ctx.fillStyle = `rgba(${sv + 5},${sv},${sv - 3},0.15)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 2, 1 + Math.random() * 1.5);
  }

  if (Math.random() < 0.12) {
    const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.4);
    grad.addColorStop(0, `rgba(${base + 8},${base + 3},${base},0.1)`);
    grad.addColorStop(1, `rgba(${base},${base - 3},${base - 5},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  if (Math.random() < 0.05) {
    ctx.strokeStyle = `rgba(40,35,30,0.1)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.random() * w, y);
    ctx.lineTo(x + Math.random() * w, y + h);
    ctx.stroke();
  }
}

function concreteFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const v = 155 + Math.random() * 20;
  ctx.fillStyle = `rgb(${v},${v - 2},${v - 5})`;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = `rgba(120,115,108,0.35)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  for (let n = 0; n < 12; n++) {
    const nx = x + Math.random() * size;
    const ny = y + Math.random() * size;
    const sv = 130 + Math.random() * 40;
    ctx.fillStyle = `rgba(${sv},${sv - 3},${sv - 6},0.2)`;
    ctx.fillRect(nx, ny, 1 + Math.random() * 2, 1 + Math.random() * 1.5);
  }

  if (Math.random() < 0.06) {
    ctx.strokeStyle = `rgba(100,95,88,0.1)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const sx = x + Math.random() * size;
    const sy = y + Math.random() * size;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * size * 0.6, sy + (Math.random() - 0.5) * size * 0.4);
    ctx.stroke();
  }
}

function industrialCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const v = 90 + Math.random() * 15;
  ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `rgba(60,65,70,0.5)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.strokeStyle = `rgba(50,55,60,0.25)`;
  ctx.lineWidth = 0.5;
  const mid = h / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + mid);
  ctx.lineTo(x + w, y + mid);
  ctx.stroke();

  if (Math.random() < 0.2) {
    ctx.fillStyle = `rgba(180,50,70,${0.06 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.5, 3 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (Math.random() < 0.15) {
    const lx = x + w * 0.1;
    const ly = y + h * 0.3;
    const lw = w * 0.8;
    const lh = h * 0.4;
    ctx.fillStyle = `rgba(200,210,220,${0.08 + Math.random() * 0.06})`;
    ctx.fillRect(lx, ly, lw, lh);
  }
}

function waferCeilingTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 230 + Math.random() * 20;
  const g = 190 + Math.random() * 20;
  const b = 140 + Math.random() * 20;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `rgba(${r - 40},${g - 40},${b - 30},0.4)`;
  ctx.lineWidth = 1;
  const gridSize = 8;
  for (let gx = x; gx < x + w; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  if (Math.random() < 0.1) {
    ctx.fillStyle = `rgba(200,120,60,0.15)`;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 4 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const LEVEL_THEMES: LevelTheme[] = [
  {
    name: "Stone Dungeon",
    wallHeight: 4.8,
    wallThickness: 0.55,
    wallColor: [0.45, 0.33, 0.22],
    wallBaseHex: "#6a4e32",
    wallBrickFn: stoneBrick,
    wallMortarColor: "rgba(20,12,5,0.9)",
    floorBaseHex: "#2a1808",
    floorColor: [0.22, 0.16, 0.1],
    floorTileFn: stoneFloorTile,
    ceilingBaseHex: "#120a05",
    ceilingColor: [0.07, 0.04, 0.02],
    ceilingTileFn: stoneCeilingTile,
    fogColor: "#0d0804",
    fogColorHex: 0x0d0804,
    fogNear: 3,
    fogFar: 22,
    ambientColor: "#ff9955",
    ambientIntensity: 0.35,
    torchColor: "#ff8822",
    directionalColor: "#ffbb77",
    wallRoughness: 0.82,
    wallMetalness: 0.06,
    floorRoughness: 0.95,
  },
  {
    name: "Overgrown Hedge",
    wallHeight: 2.2,
    wallThickness: 0.85,
    wallColor: [0.2, 0.42, 0.15],
    wallBaseHex: "#1e4818",
    wallBrickFn: hedgeLeaf,
    wallMortarColor: "rgba(15,40,10,0.2)",
    floorBaseHex: "#2e2818",
    floorColor: [0.25, 0.3, 0.15],
    floorTileFn: grassFloorTile,
    ceilingBaseHex: "#78b8e8",
    ceilingColor: [0.5, 0.72, 0.92],
    ceilingTileFn: skyCeilingTile,
    fogColor: "#88c888",
    fogColorHex: 0x88c888,
    fogNear: 8,
    fogFar: 45,
    ambientColor: "#ddffbb",
    ambientIntensity: 0.85,
    torchColor: "#aacc66",
    directionalColor: "#fffff0",
    wallRoughness: 0.98,
    wallMetalness: 0.0,
    floorRoughness: 0.96,
  },
  {
    name: "Backrooms",
    wallHeight: 3.0,
    wallThickness: 0.1,
    wallColor: [0.78, 0.75, 0.52],
    wallBaseHex: "#c8c088",
    wallBrickFn: backroomsPanel,
    wallMortarColor: "rgba(150,140,90,0.5)",
    floorBaseHex: "#a89868",
    floorColor: [0.62, 0.55, 0.38],
    floorTileFn: carpetFloorTile,
    ceilingBaseHex: "#d8d4c8",
    ceilingColor: [0.85, 0.83, 0.78],
    ceilingTileFn: fluorescentCeilingTile,
    fogColor: "#d0c888",
    fogColorHex: 0xd0c888,
    fogNear: 3,
    fogFar: 14,
    ambientColor: "#eedd99",
    ambientIntensity: 0.6,
    torchColor: "#ddcc77",
    directionalColor: "#ffffbb",
    wallRoughness: 0.65,
    wallMetalness: 0.02,
    floorRoughness: 0.82,
  },
  {
    name: "Voxel Arena",
    wallHeight: 3.8,
    wallThickness: 0.4,
    wallColor: [0.3, 0.5, 0.8],
    wallBaseHex: "#3570c0",
    wallBrickFn: voxelBlock,
    wallMortarColor: "rgba(10,20,30,0.5)",
    floorBaseHex: "#b8bcc8",
    floorColor: [0.75, 0.78, 0.82],
    floorTileFn: gridFloorTile,
    ceilingBaseHex: "#d0d4d8",
    ceilingColor: [0.82, 0.84, 0.86],
    ceilingTileFn: voxelCeilingTile,
    fogColor: "#c0d8f0",
    fogColorHex: 0xc0d8f0,
    fogNear: 10,
    fogFar: 50,
    ambientColor: "#ccddff",
    ambientIntensity: 0.7,
    torchColor: "#77aaff",
    directionalColor: "#ffffff",
    wallRoughness: 0.35,
    wallMetalness: 0.12,
    floorRoughness: 0.25,
  },
  {
    name: "Squid Game",
    wallHeight: 3.5,
    wallThickness: 0.3,
    wallColor: [0.30, 0.29, 0.27],
    wallBaseHex: "#4a4845",
    wallBrickFn: squidGamePanel,
    wallMortarColor: "rgba(30,28,25,0.7)",
    floorBaseHex: "#3a3835",
    floorColor: [0.22, 0.21, 0.20],
    floorTileFn: concreteFloorTile,
    ceilingBaseHex: "#2a2d30",
    ceilingColor: [0.16, 0.17, 0.19],
    ceilingTileFn: industrialCeilingTile,
    fogColor: "#1a2025",
    fogColorHex: 0x1a2025,
    fogNear: 3,
    fogFar: 18,
    ambientColor: "#55aa99",
    ambientIntensity: 0.35,
    torchColor: "#dd4466",
    directionalColor: "#77ccbb",
    wallRoughness: 0.8,
    wallMetalness: 0.05,
    floorRoughness: 0.6,
  },
  {
    name: "Candy World",
    wallHeight: 2.0,
    wallThickness: 0.5,
    wallColor: [0.92, 0.55, 0.68],
    wallBaseHex: "#e890a8",
    wallBrickFn: candyStripe,
    wallMortarColor: "rgba(255,190,210,0.25)",
    floorBaseHex: "#f0c8d8",
    floorColor: [0.94, 0.8, 0.87],
    floorTileFn: candyFloorTile,
    ceilingBaseHex: "#f0d8c0",
    ceilingColor: [0.92, 0.85, 0.75],
    ceilingTileFn: waferCeilingTile,
    fogColor: "#f8d0e8",
    fogColorHex: 0xf8d0e8,
    fogNear: 5,
    fogFar: 28,
    ambientColor: "#ffddee",
    ambientIntensity: 0.75,
    torchColor: "#ff77aa",
    directionalColor: "#ffeedd",
    wallRoughness: 0.45,
    wallMetalness: 0.06,
    floorRoughness: 0.35,
  },
];

export function getThemeForLevel(level: number): LevelTheme {
  return LEVEL_THEMES[Math.min(level - 1, LEVEL_THEMES.length - 1)];
}
