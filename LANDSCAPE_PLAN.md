# Landscape Layout Adaptation Plan

## Current State (done)
- `expo-screen-orientation` installed, orientation unlocked in `app.json`
- `useLayout` hook listens for orientation changes and computes reactive `boardWidth`, `cellSize`, `isPortrait`
- Game screen (`index.tsx`) switches container `flexDirection` between `column` (portrait) and `row` (landscape)

## Problem: Static Sizes
Six files import `CellSize`/`BoardWidth`/`Size` from `constants/layout.ts` as **module-level constants** used inside `StyleSheet.create()`. These values are computed once at app launch and never update on rotation.

| File | Static imports used |
|------|-------------------|
| `components/Cell.tsx` | `CellSize` — cell width/height, font sizes, margins, line heights |
| `components/Board.tsx` | `BoardWidth`, `BorderWidth` — board container width, padding |
| `components/NumberPad.tsx` | `CellSize` — pad container width/height |
| `components/CircularPadCell.tsx` | `CellSize` — circle diameter, font size, line height |
| `components/Timer.tsx` | `CellSize` — font size |
| `components/ErrorCounter.tsx` | `CellSize` — font size |
| `app/index.tsx` | `CellSize`, `BoardMargin`, `BorderWidth`, `Size` — margins, icon sizes, overlay |

## Target Layouts

### Portrait (current)
```
┌──────────────────┐
│                  │
│      Board       │
│      (9×9)       │
│                  │
├────────┬─────────┤
│ Timer  │  Number │
│ Errors │   Pad   │
│ Icons  │  (3×3)  │
└────────┴─────────┘
```

### Landscape (target)
```
┌──────────────┬──────────┐
│              │ Timer    │
│    Board     │ Errors   │
│    (9×9)     │ Pad(3×3) │
│              │ Icons    │
└──────────────┴──────────┘
```
Board fills available height. Controls stack vertically to the right.

## Implementation Steps

### Step 1: Create LayoutContext
Create a React Context that provides the computed layout values from `useLayout` to the entire component tree, so components can consume dynamic sizes without prop drilling.

```
src/contexts/LayoutContext.tsx
- LayoutProvider wraps the app in _layout.tsx
- useLayoutContext() hook for components
- Provides: cellSize, boardWidth, boardMargin, borderWidth, isPortrait
```

### Step 2: Convert Cell.tsx to dynamic sizes
- Accept `cellSize` from context (or prop)
- Replace static `StyleSheet.create` size values with `useMemo` computed styles
- Keep non-size styles (colors, alignment) in static StyleSheet

### Step 3: Convert Board.tsx to dynamic sizes
- Accept `boardWidth`, `borderWidth` from context
- Compute container/board styles dynamically via `useMemo`

### Step 4: Convert NumberPad + CircularPadCell to dynamic sizes
- Accept `cellSize` from context
- CircularPadCell: compute `Diam = cellSize * 1.5` dynamically
- NumberPad: compute container `width = cellSize * 5` dynamically

### Step 5: Convert Timer + ErrorCounter
- Accept font size as prop or from context
- These are simpler — just dynamic `fontSize`

### Step 6: Update game screen (index.tsx)
- Remove static imports from `constants/layout.ts`
- All size-dependent styles become inline/memoized using layout context values
- Controls panel:
  - Portrait: horizontal row below board (timer+errors left, pad right)
  - Landscape: vertical column beside board (timer+errors top, pad below, icons bottom)
- Loading overlay: use `layout.width`/`layout.height` instead of static `Size`

### Step 7: Handle modal screens
- `menu.tsx`, `help.tsx`, `about.tsx`, `settings.tsx` may need orientation-aware adjustments
- Consider locking modals to current orientation while open:
  ```ts
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
  ```

## Key Principles
- **Board always uses the shorter screen dimension** (already handled in `useLayout`)
- **Controls reflow** from horizontal (portrait) to vertical (landscape)
- **Split styles**: keep colors/alignment in static `StyleSheet.create`, compute sizes in `useMemo` from context values
- **No prop drilling**: use LayoutContext so deeply nested components (Cell, CircularPadCell) get sizes without threading props through Grid → Board → Cell
- **constants/layout.ts stays** as fallback for SSR/tests, but runtime code reads from context

## Estimated Scope
- ~8 files to modify
- LayoutContext: ~30 lines new code
- Per-component changes: replace static size references with context values + memoized styles
- No logic changes — only how sizes are sourced
