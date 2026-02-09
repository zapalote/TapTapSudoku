# TapTapSudoku — Expo Migration Plan

## Executive Summary

Migrate TapTapSudoku from bare React Native CLI (RN 0.79.1 / React 19) to **Expo SDK 54** (RN 0.81 / React 19.1) with TypeScript, functional components, Expo Router, and modern tooling. The app is ~2,600 LOC with minimal external dependencies, making it a clean candidate for migration.

---

## Current State

| Aspect | Current |
|--------|---------|
| Framework | React Native 0.79.1 (bare CLI via `@rnc/cli`) |
| React | 19.0.0 |
| Language | JavaScript |
| Components | Class components (state + lifecycle methods) |
| Navigation | None — uses `<Modal>` overlays for menu/help/settings/about |
| State Mgmt | Local component state in `Main.js` container |
| Storage | `@react-native-async-storage/async-storage` |
| Animations | `Animated` API (built-in) |
| SVG | `react-native-svg` |
| Haptics | `Vibration` API (built-in) |
| Build | Metro + native Xcode/Gradle projects |
| Tests | Single smoke test |
| Architecture | New Architecture enabled (`newArchEnabled: true`) |

### Key Files

| File | Lines | Role |
|------|-------|------|
| `containers/Main.js` | 603 | Primary game screen, state hub |
| `utils/sudoku.js` | 401 | Puzzle generation, solving, rating |
| `components/Board.js` | 392 | Game board interaction & validation |
| `components/Cell.js` | 207 | Individual cell rendering |
| `components/CircularPadCell.js` | 125 | Number pad button with progress arc |
| `components/Timer.js` | 107 | Elapsed time display |
| `containers/ProvideSettings.js` | 97 | Difficulty selection modal |
| `containers/ProvideMenu.js` | 94 | Main menu modal |
| `containers/ProvideAbout.js` | 99 | About/credits modal |
| `containers/ProvideHelp.js` | ~80 | Tutorial modal |

---

## Target State

| Aspect | Target |
|--------|--------|
| Framework | **Expo SDK 54** (React Native 0.81) |
| React | 19.1 |
| Language | **TypeScript** (strict mode) |
| Components | **Functional components + hooks** |
| Navigation | **Expo Router v4** (file-based routing) |
| State Mgmt | **Zustand** for game state |
| Storage | **react-native-mmkv** (fast sync storage) with migration from AsyncStorage |
| Animations | **react-native-reanimated v4** |
| Gestures | **react-native-gesture-handler** |
| SVG | `react-native-svg` (unchanged, compatible) |
| Haptics | **expo-haptics** |
| Splash | **expo-splash-screen** |
| Status Bar | **expo-status-bar** |
| Build | **EAS Build** (cloud) + **EAS Update** (OTA) |
| Tests | Jest + React Native Testing Library |
| Architecture | New Architecture (mandatory in SDK 54) |

---

## Migration Phases

### Phase 0: Pre-Migration Setup

**Goal:** Create the new Expo project scaffold alongside the existing code.

#### 0.1 Initialize Expo project

```bash
npx create-expo-app@latest TapTapSudoku-expo --template default
```

This gives us the default Expo SDK 54 template with:
- TypeScript configured
- Expo Router with file-based routing
- `app.json` / `app.config.ts` for Expo config
- Metro config via `expo/metro-config`
- EAS build support

#### 0.2 Configure `app.json` / `app.config.ts`

Transfer configuration from the current `app.json`:

```jsonc
{
  "expo": {
    "name": "TapTapSudoku",
    "slug": "TapTapSudoku",
    "version": "2.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "icon": "./assets/icons/icon.png",
    "splash": {
      "image": "./assets/splash/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.zapalote.TapTapSudoku",
      "supportsTablet": false,
      "requireFullScreen": true
    },
    "android": {
      "package": "com.zapalote.TapTapSudoku",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      "expo-router",
      "expo-haptics"
    ]
  }
}
```

#### 0.3 Install dependencies

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg expo-haptics expo-splash-screen expo-status-bar react-native-mmkv
npm install zustand
```

#### 0.4 Configure EAS

```bash
npx eas-cli init
npx eas build:configure
```

Create `eas.json`:
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

#### 0.5 Configure TypeScript

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### 0.6 Configure Babel

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated plugin auto-configured by babel-preset-expo in SDK 54
  };
};
```

---

### Phase 1: Core Types & Game Logic

**Goal:** Port the pure logic layer to TypeScript — no UI changes yet.

#### 1.1 Define core types

Create `src/types/game.ts`:

```typescript
export interface CellData {
  number: number | null;       // Committed number (1-9 or null)
  hints: number[];             // Pencil marks
  fixed: boolean;              // Given clue (immutable)
  error: boolean;              // Collision flagged
  highlight: boolean;          // Selected/highlighted
  glow: boolean;               // Animation state (row/col/box complete)
}

export interface GameState {
  board: CellData[];           // 81 cells
  selectedIndex: number | null;
  elapsed: number;             // Seconds
  errors: number;              // Bad move count
  difficulty: number;          // 0-7 raw difficulty
  difficultyLevel: DifficultyLevel;
  solved: boolean;
  paused: boolean;
}

export type DifficultyLevel = 0 | 1 | 2 | 3;
// 0=Manageable (0-1), 1=Challenging (2-3), 2=Impossible (4-7), 3=Surprise

export interface DifficultyRange {
  label: string;
  min: number;
  max: number;
}

export interface GameRecords {
  bestTimes: (number | null)[];  // 8 slots, one per raw difficulty
}
```

#### 1.2 Port Sudoku engine

Convert `utils/sudoku.js` → `src/lib/sudoku.ts`:

- Add TypeScript types to all functions
- Export strongly typed API:
  ```typescript
  export function makePuzzle(): (number | null)[];
  export function solvePuzzle(puzzle: (number | null)[]): number[] | null;
  export function ratePuzzle(puzzle: (number | null)[], samples?: number): number;
  export function checkPuzzle(puzzle: (number | null)[]): (number | null)[] | null;
  export function posFor(x: number, y: number, axis?: number): number;
  export function allowedValues(board: (number | null)[], pos: number): number[];
  ```
- Keep the algorithm unchanged — it's battle-tested
- Rename camelCase where appropriate (`makepuzzle` → `makePuzzle`, etc.)

#### 1.3 Port storage layer

Convert `utils/store.js` → `src/lib/storage.ts` using MMKV:

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'taptap-sudoku' });

export const Storage = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : null;
  },
  setObject: (key: string, value: unknown) => {
    storage.set(key, JSON.stringify(value));
  },
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};
```

#### 1.4 AsyncStorage → MMKV data migration

Create `src/lib/migrate-storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from './storage';

export async function migrateFromAsyncStorage(): Promise<void> {
  const migrated = Storage.getString('_migrated');
  if (migrated === 'true') return;

  const keys = ['board', 'elapsed', 'error', 'records', 'levelRange', 'levelValue', 'first'];
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      Storage.setString(key, value);
    }
  }
  Storage.setString('_migrated', 'true');
}
```

Keep `@react-native-async-storage/async-storage` as a dependency only for migration. Remove it after a release cycle.

#### 1.5 Port language/i18n

Convert `utils/language.js` → `src/lib/language.ts`:
- Add a `Translations` type
- Keep English strings, but structure for future i18n expansion

---

### Phase 2: State Management with Zustand

**Goal:** Replace the class-component state in `Main.js` with a Zustand store.

#### 2.1 Create game store

`src/store/game-store.ts`:

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CellData, DifficultyLevel, GameState } from '@/types/game';
import { makePuzzle, ratePuzzle, solvePuzzle } from '@/lib/sudoku';
import { Storage } from '@/lib/storage';

interface GameStore extends GameState {
  // Actions
  newGame: (level: DifficultyLevel) => void;
  selectCell: (index: number) => void;
  placeNumber: (num: number) => void;   // "Lock" / double-tap
  toggleHint: (num: number) => void;    // "Pencil" / single-tap
  tick: () => void;                     // Timer increment
  pause: () => void;
  resume: () => void;
  clearCell: () => void;

  // Persistence
  save: () => void;
  restore: () => void;

  // Settings
  difficultyLevel: DifficultyLevel;
  setDifficultyLevel: (level: DifficultyLevel) => void;

  // Records
  bestTimes: (number | null)[];
}
```

#### 2.2 Move validation logic into store actions

The collision detection, hint removal, and completion detection currently in `Board.js` (`onPadPress`) should become store actions:

- `placeNumber(num)`: Validate → check collisions → check solvability → update board → check completions → trigger animations
- `toggleHint(num)`: Add/remove pencil mark → auto-remove conflicting hints in same row/col/box
- Completion detection emits events that the UI subscribes to for animations

#### 2.3 Persistence middleware

Use Zustand's `persist` middleware with MMKV:

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

const mmkvStorage = {
  getItem: (key: string) => Storage.getString(key) ?? null,
  setItem: (key: string, value: string) => Storage.setString(key, value),
  removeItem: (key: string) => Storage.delete(key),
};

const useGameStore = create<GameStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // ... state and actions
    })),
    {
      name: 'game-state',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        board: state.board,
        elapsed: state.elapsed,
        errors: state.errors,
        difficulty: state.difficulty,
        difficultyLevel: state.difficultyLevel,
        bestTimes: state.bestTimes,
      }),
    }
  )
);
```

---

### Phase 3: UI Components — Class → Functional + Hooks

**Goal:** Convert all components from class components to functional components with hooks.

#### 3.1 Conversion map

| Current File | New File | Key Changes |
|-------------|----------|-------------|
| `components/Cell.js` | `src/components/Cell.tsx` | FC + `useAnimatedStyle` for glow/error |
| `components/Grid.js` | `src/components/Grid.tsx` | FC, pure layout |
| `components/Board.js` | `src/components/Board.tsx` | FC + `useGameStore` selectors, remove internal state |
| `components/NumberPad.js` | `src/components/NumberPad.tsx` | FC + gesture handler |
| `components/CircularPadCell.js` | `src/components/CircularPadCell.tsx` | FC + reanimated for press feedback |
| `components/CircularProgress.js` | `src/components/CircularProgress.tsx` | FC (already simple) |
| `components/Timer.js` | `src/components/Timer.tsx` | FC + `useEffect` interval |
| `components/BadMove.js` | `src/components/BadMove.tsx` | FC (simple display) |
| `components/RadioButtonsGroup.js` | `src/components/RadioButtonsGroup.tsx` | FC |
| `components/Touchable.js` | Remove | Use `Pressable` from RN directly |
| `components/GlobalStyle.js` | `src/constants/layout.ts` | Convert to `useWindowDimensions` hook |

#### 3.2 Custom hooks to extract

| Hook | Purpose | Extracts from |
|------|---------|--------------|
| `useTimer` | Manages elapsed time with pause/resume | `Timer.js` + `Main.js` |
| `useDoubleTap` | Detect single vs double tap (300ms delay) | `CircularPadCell.js` pan responder |
| `useBoardAnimations` | Row/col/box/number completion animations | `Board.js` + `Cell.js` |
| `useAppLifecycle` | Pause on background, resume on foreground | `Main.js` AppState listener |
| `useLayout` | Responsive sizing (cellSize, margins) | `GlobalStyle.js` |

#### 3.3 Animation migration

Replace `Animated` API with `react-native-reanimated` v4:

| Current Animation | Reanimated Replacement |
|------------------|----------------------|
| `Animated.timing` for cell rotation | `withTiming` + `useAnimatedStyle` |
| `Animated.timing` for cell scale | `withSpring` for bouncy feel |
| `Animated.timing` for fade overlay | `withTiming` on opacity shared value |
| Pan responder for double-tap | `Gesture.Tap().numberOfTaps(2)` from gesture-handler |

Example — Cell completion animation:
```typescript
const rotation = useSharedValue(0);
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotateY: `${rotation.value}deg` },
    { scale: scale.value },
  ],
}));

function triggerGlow() {
  rotation.value = withTiming(360, { duration: 1000 });
  scale.value = withSequence(
    withTiming(1.1, { duration: 500 }),
    withTiming(1, { duration: 500 })
  );
}
```

#### 3.4 Gesture migration

Replace the custom PanResponder-based double-tap detection with `react-native-gesture-handler`:

```typescript
const singleTap = Gesture.Tap()
  .maxDuration(250)
  .onEnd(() => { runOnJS(onHint)(number); });

const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .maxDuration(250)
  .onEnd(() => { runOnJS(onLock)(number); });

const gesture = Gesture.Exclusive(doubleTap, singleTap);

return (
  <GestureDetector gesture={gesture}>
    <Animated.View style={animatedStyle}>
      {/* CircularPadCell content */}
    </Animated.View>
  </GestureDetector>
);
```

#### 3.5 Haptics migration

Replace `Vibration.vibrate()` with `expo-haptics`:

```typescript
import * as Haptics from 'expo-haptics';

// On bad move (was: Vibration.vibrate())
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// On number placement
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On game completion
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

### Phase 4: Navigation with Expo Router

**Goal:** Replace modal-based "navigation" with file-based Expo Router routes.

#### 4.1 Route structure

```
src/app/
├── _layout.tsx          # Root layout: GestureHandlerRootView + Stack
├── index.tsx            # Redirect to /game or /menu
├── game.tsx             # Main game screen (Board + NumberPad + Timer)
├── menu.tsx             # Main menu (presented as modal)
├── settings.tsx         # Difficulty settings (presented as modal)
├── help.tsx             # Tutorial/help (presented as modal)
└── about.tsx            # About/credits (presented as modal)
```

#### 4.2 Root layout

```typescript
// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="game" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Difficulty' }} />
        <Stack.Screen name="help" options={{ presentation: 'modal', title: 'How to Play' }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

#### 4.3 Navigation pattern

Current modals controlled by boolean state (`showMenu`, `showHelp`, etc.) become router pushes:

```typescript
// Before (Main.js)
this.setState({ showMenu: true });

// After
import { router } from 'expo-router';
router.push('/menu');
```

The menu screen triggers game actions via the Zustand store (no callback props needed):

```typescript
// menu.tsx
function MenuScreen() {
  const newGame = useGameStore((s) => s.newGame);

  return (
    <Pressable onPress={() => {
      newGame(difficultyLevel);
      router.back();
    }}>
      <Text>New Game</Text>
    </Pressable>
  );
}
```

---

### Phase 5: Responsive Layout & Theming

**Goal:** Modernize the responsive layout system and add dark mode support.

#### 5.1 Layout hook

Replace `GlobalStyle.js` static calculations with a reactive hook:

```typescript
// src/hooks/useLayout.ts
import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const boardSize = Math.min(width - 32, 500);  // 16px padding each side, max 500
  const cellSize = Math.floor(boardSize / 9);

  return { width, height, isPortrait, boardSize, cellSize };
}
```

#### 5.2 Theme support

The app already has `userInterfaceStyle: "automatic"` in config. Add theme-aware colors:

```typescript
// src/constants/colors.ts
export const Colors = {
  light: {
    background: '#FFFFFF',
    cellBackground: '#F5F5F5',
    cellBorder: '#CCCCCC',
    fixedText: '#666666',
    selectedBorder: '#FFD700',
    hintText: '#008B8B',
    errorBorder: '#FF0000',
    numberText: '#000000',
  },
  dark: {
    background: '#1A1A1A',
    cellBackground: '#2A2A2A',
    cellBorder: '#444444',
    fixedText: '#999999',
    selectedBorder: '#FFD700',
    hintText: '#40E0D0',
    errorBorder: '#FF4444',
    numberText: '#FFFFFF',
  },
};
```

Use `useColorScheme()` from React Native to select the active palette.

---

### Phase 6: Asset Migration & Splash Screen

**Goal:** Move assets into Expo-compatible locations and configure splash/icons.

#### 6.1 Asset inventory

| Asset Type | Current Location | Action |
|-----------|-----------------|--------|
| App icon | `assets/icons/` | Copy to Expo `assets/images/icon.png` (1024x1024) |
| Adaptive icon | `assets/icons/` | Copy foreground image |
| Splash screen | `assets/splash/` | Configure in `app.json` |
| Button images (PNGs) | `assets/images/` | Evaluate: replace with SVG icons or keep |
| Fonts | `assets/fonts/` | Use `expo-font` or `useFonts` hook |

#### 6.2 Replace PNG buttons with vector icons

The current app uses PNG images for menu/settings/help buttons. Replace with `@expo/vector-icons` (included in Expo):

```typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="settings-outline" size={24} color={colors.text} />
<Ionicons name="help-circle-outline" size={24} color={colors.text} />
<Ionicons name="information-circle-outline" size={24} color={colors.text} />
```

#### 6.3 Splash screen

```typescript
// src/app/_layout.tsx
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await migrateFromAsyncStorage();
      useGameStore.getState().restore();
      setReady(true);
      SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!ready) return null;

  return (/* layout */);
}
```

---

### Phase 7: Testing

**Goal:** Establish meaningful test coverage for the migrated app.

#### 7.1 Test strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Sudoku engine | Jest (unit) | High — pure logic |
| Zustand store | Jest (unit) | High — game actions & validation |
| Storage | Jest (unit) | Medium — MMKV mocked |
| Components | RNTL* (integration) | Medium — key interactions |
| Navigation | RNTL + expo-router testing utils | Low — smoke tests |
| E2E | Maestro or Detox | Key user flows |

*RNTL = React Native Testing Library

#### 7.2 Priority test cases

1. **Sudoku engine**: Puzzle generation returns valid puzzle, solver finds correct solution, difficulty rating is consistent
2. **Game store**: New game initializes 81 cells, placing valid number succeeds, placing invalid number increments error count, completion detected when all cells filled, timer ticks correctly, persistence round-trips correctly
3. **Board component**: Cell selection highlights correctly, double-tap locks number, single-tap adds hint, completed row/col/box triggers animation
4. **Navigation**: Menu opens and closes, new game from menu resets board, settings change persists

---

### Phase 8: Remove Legacy Code & Native Projects

**Goal:** Clean up everything that's no longer needed.

#### 8.1 Files to remove

```
ios/                           # Entire native iOS project
android/                       # Entire native Android project
App.jsx                        # Replaced by src/app/_layout.tsx
index.js                       # Replaced by Expo entry point
components/                    # Migrated to src/components/
containers/                    # Migrated to src/app/ routes
utils/                         # Migrated to src/lib/
Gemfile                        # No longer needed (no CocoaPods)
Gemfile.lock
.eslintrc.js                   # Replace with Expo-compatible config
.prettierrc.js                 # Keep or update
metro.config.js                # Replace with Expo metro config
jest.config.js                 # Replace with Expo jest config
babel.config.js                # Replace with Expo babel config
tsconfig.json                  # Replace with Expo tsconfig
__tests__/                     # Move to src/__tests__/
```

#### 8.2 Dependencies to remove

```
@react-native-community/cli
@react-native/babel-preset
@react-native/metro-config
@react-native/typescript-config
@react-native-async-storage/async-storage  (after migration period)
```

---

## Final Project Structure

```
TapTapSudoku/
├── src/
│   ├── app/                          # Expo Router routes
│   │   ├── _layout.tsx               # Root layout (Stack + providers)
│   │   ├── index.tsx                 # Entry redirect
│   │   ├── game.tsx                  # Main game screen
│   │   ├── menu.tsx                  # Menu modal
│   │   ├── settings.tsx              # Settings modal
│   │   ├── help.tsx                  # Help modal
│   │   └── about.tsx                 # About modal
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── Board.tsx                 # Game board
│   │   ├── Cell.tsx                  # Individual cell
│   │   ├── Grid.tsx                  # 9x9 grid layout
│   │   ├── NumberPad.tsx             # Number input pad
│   │   ├── CircularPadCell.tsx       # Pad button with progress
│   │   ├── CircularProgress.tsx      # SVG arc
│   │   ├── Timer.tsx                 # Timer display
│   │   └── ErrorCounter.tsx          # Bad move counter
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useTimer.ts               # Timer logic
│   │   ├── useDoubleTap.ts           # Single/double tap detection
│   │   ├── useBoardAnimations.ts     # Completion animations
│   │   ├── useAppLifecycle.ts        # Background/foreground handling
│   │   └── useLayout.ts             # Responsive sizing
│   │
│   ├── store/                        # Zustand stores
│   │   └── game-store.ts             # Game state & actions
│   │
│   ├── lib/                          # Pure business logic
│   │   ├── sudoku.ts                 # Puzzle engine
│   │   ├── storage.ts                # MMKV wrapper
│   │   ├── migrate-storage.ts        # AsyncStorage → MMKV migration
│   │   └── language.ts               # Translations
│   │
│   ├── constants/                    # Static values
│   │   ├── colors.ts                 # Theme colors
│   │   ├── layout.ts                 # Sizing constants
│   │   └── difficulties.ts           # Difficulty presets
│   │
│   ├── types/                        # TypeScript types
│   │   └── game.ts                   # Core game types
│   │
│   └── __tests__/                    # Tests
│       ├── lib/
│       │   └── sudoku.test.ts
│       ├── store/
│       │   └── game-store.test.ts
│       └── components/
│           └── Board.test.tsx
│
├── assets/                           # Static assets
│   ├── images/                       # App images
│   ├── fonts/                        # Custom fonts
│   └── splash/                       # Splash screen
│
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build configuration
├── babel.config.js                   # Babel (babel-preset-expo)
├── metro.config.js                   # Metro (expo/metro-config)
├── tsconfig.json                     # TypeScript (extends expo/tsconfig.base)
├── package.json
└── README.md
```

---

## Implementation Order & Dependencies

```
Phase 0 ─── Project scaffold, tooling, config
  │
Phase 1 ─── Core types + sudoku engine + storage (no UI)
  │
Phase 2 ─── Zustand store (depends on types + engine)
  │
Phase 3 ─── UI components conversion (depends on store)
  │          Can parallelize: Cell, Grid, Timer, NumberPad, Board
  │
Phase 4 ─── Navigation / Expo Router (depends on components)
  │
Phase 5 ─── Layout + theming (can overlap with Phase 3-4)
  │
Phase 6 ─── Assets + splash screen (can overlap with Phase 4-5)
  │
Phase 7 ─── Testing (incremental, starts at Phase 1)
  │
Phase 8 ─── Legacy cleanup (after all phases complete)
```

---

## Risk Assessment & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Sudoku engine regression | High | Low | Port without logic changes; comprehensive unit tests |
| Double-tap gesture feel differs | Medium | Medium | Tune gesture-handler timing to match current 300ms threshold |
| MMKV storage migration data loss | High | Low | Keep AsyncStorage as fallback for one release cycle |
| Animation performance differences | Medium | Low | Reanimated v4 runs on UI thread; should be smoother |
| Expo SDK breaking changes | Medium | Low | Pin to SDK 54 (stable); upgrade to 55 after stabilization |
| EAS Build cost | Low | Medium | Free tier (15 builds/month) sufficient for solo dev; local builds available |
| App Store review for new binary | Low | High (certain) | Expected — new bundle structure requires full review |

---

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Expo SDK 54** over SDK 55 beta | Stability for migration; upgrade to 55 after it stabilizes |
| **MMKV** over AsyncStorage | 30x faster, synchronous reads, better for game state that saves on every move |
| **Zustand** over Redux/Context | Minimal boilerplate, hook-native, perfect for single-store game state |
| **Reanimated v4** over Animated API | UI-thread animations, better gesture integration, required for New Architecture |
| **Expo Router** over React Navigation directly | File-based routing, deep linking, Expo-native, built on React Navigation anyway |
| **TypeScript strict mode** | Catches bugs at compile time; especially valuable for the 81-cell board state |
| **Keep sudoku.js algorithm unchanged** | Battle-tested; only add types, don't refactor the solver |
| **Functional components + hooks** | Modern React patterns, better performance with React 19, cleaner code |

---

## Estimated Scope

| Phase | Files to Create/Modify | Complexity |
|-------|----------------------|------------|
| Phase 0: Setup | ~8 config files | Low |
| Phase 1: Core logic | ~5 files (~500 LOC) | Low-Medium |
| Phase 2: Store | ~1 file (~200 LOC) | Medium |
| Phase 3: Components | ~10 files (~1,200 LOC) | Medium-High |
| Phase 4: Navigation | ~6 files (~300 LOC) | Low-Medium |
| Phase 5: Layout/Theme | ~3 files (~150 LOC) | Low |
| Phase 6: Assets | ~3 files + config | Low |
| Phase 7: Tests | ~5 files (~400 LOC) | Medium |
| Phase 8: Cleanup | Deletions only | Low |
| **Total** | **~40 files (~2,750 LOC)** | **Medium** |
