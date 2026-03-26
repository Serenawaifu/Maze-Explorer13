# Perfect In-Game HUD Layout

## What & Why
Redesign the entire in-game HUD using a professional 9-zone screen framework based on FPS/dungeon crawler industry standards. The current layout has positioning issues (elements overlapping, inconsistent spacing, no contextual visibility). This overhaul applies a structured zone-based anchor system, contextual fade behavior, and responsive safe-area design to create a polished, immersive experience.

## Done looks like
- **9-Zone Grid System**: All HUD elements anchored to defined screen zones with consistent padding/margins, no overlaps on any screen size
- **Zone 1 (Top-Left)**: Level panel + Difficulty badge + Score — stacked vertically, compact
- **Zone 2 (Top-Center)**: Skyrim-style horizontal compass bar with scrolling cardinal directions, exit marker, and distance indicator — positioned at the very top
- **Zone 2 (Below compass)**: Timer panel centered below the compass bar with proper spacing
- **Zone 3 (Top-Right)**: Health bar + percentage + Gems counter — stacked vertically
- **Zone 4 (Center-Left)**: Active power-up buffs (only visible when active)
- **Zone 5 (Center)**: Crosshair only — absolutely nothing else in center zone
- **Zone 7 (Bottom-Left)**: Volume control only (desktop); joystick occupies this on touch
- **Zone 8 (Bottom-Center)**: Context-sensitive instruction text (changes for boss fights); Boss health bar above it during boss encounters
- **Zone 9 (Bottom-Right)**: Compact minimap (90px desktop, 70px mobile) with no legend text — just the map canvas
- **Contextual Fade System**: HUD elements smoothly fade to 40% opacity after 4 seconds of no relevant change, instantly fade back to 100% on change. Health always visible when below 100%. Timer always visible when below 60 seconds. Score fades unless just changed. Compass always visible.
- **Damage direction indicators**: Brief directional red flash on the screen edge corresponding to damage direction (left/right/front/back)
- **Responsive safe areas**: All elements stay within 90% safe zone, proper clamp-based sizing that works from 360px mobile to 2560px ultrawide
- **Touch device adaptations**: Compass hidden on mobile, minimap shifts up to avoid joystick overlap, volume control repositioned, attack button in bottom-right

## Out of scope
- Diegetic/3D-world UI elements (health on character model, etc.)
- HUD customization settings panel (position/size/opacity sliders)
- Color-blind mode alternatives
- Minimap zoom or rotation modes
- Radar-style minimap (keep current top-down static)

## Tasks
1. **Create HUD zone layout system** — Build a `HUDLayout` wrapper component that defines the 9 screen zones as CSS-positioned containers with safe-area padding. All HUD child components mount into their designated zone rather than using ad-hoc fixed positioning. Each zone uses consistent edge margins via clamp().

2. **Refine compass bar** — Polish the horizontal compass to match Skyrim-style behavior: smooth scrolling of direction labels as player rotates, exit marker triangle that slides along the bar (or shows edge arrows when off-screen), subtle tick marks between cardinals, distance label on the right side. Ensure it sits cleanly at top-center with proper spacing from level/health panels on either side.

3. **Implement contextual fade system** — Add a `useHUDFade` hook that tracks per-element visibility state. Elements fade to 40% after idle period (4s), snap back to 100% on relevant state change. Health panel stays full opacity when HP < 100%. Timer stays full when < 60s. Score flashes on change then fades. Compass and crosshair always fully visible. Use CSS transitions for smooth animation.

4. **Add damage direction indicators** — When the player takes damage, show a brief red gradient flash on the screen edge corresponding to the damage source direction (requires passing damage source position to HUD). Flash appears for 0.4s with fade-out animation. Replaces the current full-screen red flash with directional feedback.

5. **Polish minimap and touch layout** — Ensure minimap is compact (90px/70px) with no legend, proper border radius, and sits cleanly in bottom-right. Verify touch layout: minimap and volume shift up to avoid joystick/attack button, compass hidden on mobile, all zones respect touch control overlay areas.

6. **Final integration testing** — Verify all 9 zones render without overlaps at multiple viewport sizes (mobile portrait, mobile landscape, tablet, desktop, ultrawide). Test boss fight mode (boss health bar appears, attack cooldown, instruction text changes). Test damage flash direction. Test fade behavior. Fix any edge cases.

## Relevant files
- `artifacts/maze-game/src/game/HUD.tsx`
- `artifacts/maze-game/src/game/Compass.tsx`
- `artifacts/maze-game/src/game/MiniMap.tsx`
- `artifacts/maze-game/src/game/TouchControls.tsx`
- `artifacts/maze-game/src/game/theme.ts`
- `artifacts/maze-game/src/game/gameState.ts`
- `artifacts/maze-game/src/game/levelThemes.ts`
- `artifacts/maze-game/src/game/scoreSystem.ts`
