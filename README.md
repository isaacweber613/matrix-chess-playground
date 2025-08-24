# Chess Game

A fully-featured chess game built with HTML, CSS, and JavaScript. Play against AI opponents of varying difficulty levels or enjoy human vs human matches.

## Features

### Game Modes
- **Human vs Human** - Play against another person
- **Human vs Bot** - Challenge AI opponents with 10 difficulty levels
- **Bot vs Bot** - Watch AI opponents battle each other

### Chess Rules
- Complete chess rule implementation including:
  - All piece movements (pawn, rook, bishop, knight, queen, king)
  - Castling (both kingside and queenside)
  - En passant captures
  - Pawn promotion (automatically promotes to queen)
  - Check and checkmate detection
  - Stalemate detection

### AI Features
- 10 difficulty levels (1-10)
- Opening book for higher difficulty levels
- Minimax algorithm with alpha-beta pruning
- Position evaluation with piece-square tables
- Tactical awareness and king safety evaluation

### User Interface
- Visual board with piece highlighting
- Move validation and legal move indicators
- Last move highlighting
- King in check highlighting
- Sound effects for moves, captures, check, and checkmate
- Board flipping support
- Responsive design

### Game Management
- Save/load game states
- Game history with up to 20 saved games
- Undo moves (undoes both human and bot moves in bot games)
- Move hints using AI evaluation
- Switch sides during human vs bot games
- Reset and restart games

## How to Play

1. Open `index.html` in a web browser
2. Choose your game mode:
   - **Human vs Human**: Take turns on the same device
   - **Human vs Bot**: Select your color and bot difficulty (1-10)
   - **Bot vs Bot**: Watch two AI opponents play (set individual difficulty levels)
3. Click "Start Game" to begin
4. Click on pieces to select them, then click on valid squares to move
5. The game will automatically detect check, checkmate, and stalemate

## Controls

- **Click pieces and squares** - Make moves
- **Undo Move** - Take back the last move(s)
- **Switch Sides** - Change colors in human vs bot mode
- **Flip Board** - Rotate the board view
- **Hint** - Get AI suggestion for next move
- **Sound Toggle** - Enable/disable sound effects
- **Reset Game** - Start over with same settings
- **View History** - See previous games and resume incomplete ones

## Bot Difficulty Levels

- **Levels 1-2**: Random moves with some basic preferences
- **Levels 3-4**: Basic evaluation with randomness
- **Levels 5-6**: Improved evaluation focusing on captures and position
- **Levels 7-8**: Minimax search (2-3 ply depth) with opening book
- **Levels 9-10**: Advanced minimax (3-4 ply depth) with full tactical awareness

## Files

- `index.html` - Main game interface and setup
- `chess.js` - Core game logic, AI, and chess rules
- `style.css` - Styling and visual design

## Browser Requirements

- Modern web browser with JavaScript enabled
- Web Audio API support for sound effects (optional)
- Local storage support for game persistence (optional)

## Recent Bug Fixes

- Fixed issue where game would stop accepting moves when a player was in check
- Game now properly continues allowing legal moves while in check state