type GameHandlers = {
  onResume: () => void;
  onRestart: () => void;
  onCreate: () => void;
  showHelp: () => void;
  onCloseHelp: () => void;
  onShowMenu: () => void;
};

// Module-level object shared between game.tsx (writer) and menu/help (readers).
// game.tsx updates properties in place on every render so callers always get
// current callbacks without any global or undefined window.
const gameHandlers: GameHandlers = {
  onResume: () => {},
  onRestart: () => {},
  onCreate: () => {},
  showHelp: () => {},
  onCloseHelp: () => {},
  onShowMenu: () => {},
};

export default gameHandlers;
