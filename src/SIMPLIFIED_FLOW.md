### Goal separate areas of interest
  first time gate
  control (help, about, settings, rate, gameActions, etc)
  game (state management, save, load)

### app open gate
everytime the app opens it goes to gate
  gate checks firstTime condition -> /firstTime (dedicated page similar to /help)
  otherwisse gate goes to /menu -> router.replace(/menu) (gate not visible to android back button)

### First time flow
app open -> /firstTime
  /firstTime onClose -> router.replace(/menu) will never again come back to this page

### Normal flow
app open gate -> /menu
  /menu checks state:playing
    YES: enables "continue" and "restart"
    NO: disable "continue" and "restart"
  nav to /help, /about, /settings via router push (android back button ok)
  nav to /game with param action:['continue','restart','new']

  in /game
    all game actions and timer only in /game
    action "continue" Load game from store and resume
    action "restart" Load game from store, reset game and timer
    action "new game" create new game and start
    nav to /help onClose back to /game
    nav to /menu should it be router.replace?