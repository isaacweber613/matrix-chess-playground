class ChessGame {
    constructor() {
        this.board = null;
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameStatus = 'setup';
        this.gameMode = 'human-vs-bot';
        this.botColor = 'black';
        this.humanColor = 'white';
        this.botDifficulty = 5;
        this.isThinking = false;
        this.lastMove = null; // Track last move for en passant and highlighting
        this.moveHistory = []; // Track all moves for undo
        this.boardFlipped = false; // Track if board is manually flipped
        this.soundEnabled = true;
        this.audioContext = null;
        this.whiteBotDifficulty = 5;
        this.blackBotDifficulty = 7;
        this.gameHistory = []; // Store completed/saved games
        
        // DOM elements
        this.setupElement = document.getElementById('game-setup');
        this.gameAreaElement = document.getElementById('game-area');
        this.boardElement = document.getElementById('chess-board');
        this.currentPlayerElement = document.getElementById('current-player');
        this.gameStatusElement = document.getElementById('game-status');
        this.gameModeInfoElement = document.getElementById('game-mode-info');
        
        this.pieces = {
            white: {
                king: '♔', queen: '♕', rook: '♖', 
                bishop: '♗', knight: '♘', pawn: '♙'
            },
            black: {
                king: '♚', queen: '♛', rook: '♜', 
                bishop: '♝', knight: '♞', pawn: '♟'
            }
        };
        
        this.pieceValues = {
            pawn: 100, knight: 300, bishop: 300, rook: 500, queen: 900, king: 10000
        };
        
        // Piece-square tables (from white's perspective)
        this.pieceSquareTables = {
            pawn: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            knight: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            bishop: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            rook: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [0,  0,  0,  5,  5,  0,  0,  0]
            ],
            queen: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-5,  0,  5,  5,  5,  5,  0, -5],
                [0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            king: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [20, 20,  0,  0,  0,  0, 20, 20],
                [20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
        
        // Opening book - common good moves
        this.openingBook = {
            'initial': ['e2e4', 'e2e3', 'd2d4', 'g1f3', 'b1c3'],
            'e7e5': ['g1f3', 'f1c4', 'b1c3'],
            'd7d5': ['g1f3', 'c2c4', 'b1c3'],
            'g8f6': ['d2d4', 'c2c4', 'g1f3']
        };
        
        this.initializeSetup();
    }
    
    initializeSetup() {
        console.log('initializeSetup() called');
        
        // Check if elements exist
        const startButton = document.getElementById('start-game');
        const gameModeSelect = document.getElementById('game-mode');
        console.log('Elements found:', {
            startButton: !!startButton,
            gameMode: !!gameModeSelect
        });
        
        if (!startButton) {
            console.error('start-game button not found!');
            return;
        }
        
        // Setup UI event listeners
        gameModeSelect.addEventListener('change', (e) => {
            const botSettings = document.getElementById('bot-settings');
            const colorSelection = document.getElementById('color-selection');
            const botVsBotSettings = document.getElementById('bot-vs-bot-settings');
            
            if (e.target.value === 'human-vs-human') {
                botSettings.style.display = 'none';
                colorSelection.style.display = 'none';
                botVsBotSettings.style.display = 'none';
            } else if (e.target.value === 'human-vs-bot') {
                botSettings.style.display = 'block';
                colorSelection.style.display = 'block';
                botVsBotSettings.style.display = 'none';
            } else if (e.target.value === 'bot-vs-bot') {
                botSettings.style.display = 'none';
                colorSelection.style.display = 'none';
                botVsBotSettings.style.display = 'block';
            }
        });
        
        startButton.addEventListener('click', () => {
            console.log('Start game button clicked!');
            this.startGame();
        });
        
        document.getElementById('reset-game').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('back-to-setup').addEventListener('click', () => {
            this.backToSetup();
        });
        
        document.getElementById('toggle-sound').addEventListener('click', () => {
            this.toggleSound();
        });
        
        document.getElementById('undo-move').addEventListener('click', () => {
            this.undoMove();
        });
        
        document.getElementById('switch-sides').addEventListener('click', () => {
            this.switchSides();
        });
        
        document.getElementById('flip-board').addEventListener('click', () => {
            this.flipBoard();
        });
        
        document.getElementById('hint-move').addEventListener('click', () => {
            this.showHint();
        });
        
        document.getElementById('view-history').addEventListener('click', () => {
            this.showHistory();
        });
        
        document.getElementById('close-history').addEventListener('click', () => {
            this.hideHistory();
        });
        
        this.initializeAudio();
        this.loadGameHistory();
        
        // Try to load saved game state on page load
        if (this.loadGameState()) {
            console.log('Loaded saved game state');
        }
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const button = document.getElementById('toggle-sound');
        button.textContent = this.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        
        if (this.soundEnabled && this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    async playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Resume audio context if suspended (required by modern browsers)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.log('Could not resume audio context:', e);
                return;
            }
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Sound playback error:', e);
        }
    }
    
    playMoveSound() {
        this.playSound(220, 0.1, 'sine', 0.2); // A3 note - increased volume
    }
    
    playCaptureSound() {
        this.playSound(440, 0.2, 'square', 0.25); // Higher pitched, harsher sound - increased volume
    }
    
    playCheckSound() {
        this.playSound(330, 0.3, 'triangle', 0.3); // Warning sound - increased volume
    }
    
    playCheckmateSound() {
        // Play a sequence of notes - increased volume
        setTimeout(() => this.playSound(523, 0.2, 'sine', 0.3), 0);   // C5
        setTimeout(() => this.playSound(440, 0.2, 'sine', 0.3), 100); // A4
        setTimeout(() => this.playSound(349, 0.2, 'sine', 0.3), 200); // F4
        setTimeout(() => this.playSound(262, 0.4, 'sine', 0.3), 300); // C4
    }
    
    playCastleSound() {
        // Two quick tones for the two pieces moving - increased volume
        this.playSound(294, 0.15, 'sine', 0.2); // D4
        setTimeout(() => this.playSound(349, 0.15, 'sine', 0.2), 80); // F4
    }
    
    playPromotionSound() {
        // Ascending scale to celebrate promotion - increased volume
        setTimeout(() => this.playSound(262, 0.1, 'sine', 0.2), 0);   // C4
        setTimeout(() => this.playSound(330, 0.1, 'sine', 0.2), 60);  // E4
        setTimeout(() => this.playSound(392, 0.1, 'sine', 0.2), 120); // G4
        setTimeout(() => this.playSound(523, 0.2, 'sine', 0.3), 180); // C5
    }
    
    // Persistence and History Methods
    saveGameState() {
        const gameState = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            gameMode: this.gameMode,
            board: this.board,
            currentPlayer: this.currentPlayer,
            lastMove: this.lastMove,
            moveHistory: this.moveHistory,
            gameStatus: this.gameStatus,
            humanColor: this.humanColor,
            botColor: this.botColor,
            botDifficulty: this.botDifficulty,
            whiteBotDifficulty: this.whiteBotDifficulty,
            blackBotDifficulty: this.blackBotDifficulty
        };
        
        localStorage.setItem('currentChessGame', JSON.stringify(gameState));
        return gameState;
    }
    
    loadGameState() {
        try {
            const savedState = localStorage.getItem('currentChessGame');
            if (savedState) {
                const gameState = JSON.parse(savedState);
                this.board = gameState.board;
                this.currentPlayer = gameState.currentPlayer;
                this.lastMove = gameState.lastMove;
                this.moveHistory = gameState.moveHistory || [];
                this.gameStatus = gameState.gameStatus;
                this.gameMode = gameState.gameMode;
                this.humanColor = gameState.humanColor;
                this.botColor = gameState.botColor;
                this.botDifficulty = gameState.botDifficulty || 5;
                this.whiteBotDifficulty = gameState.whiteBotDifficulty || 5;
                this.blackBotDifficulty = gameState.blackBotDifficulty || 7;
                
                this.setupElement.style.display = 'none';
                this.gameAreaElement.style.display = 'block';
                this.renderBoard();
                this.updateGameInfo();
                
                return true;
            }
        } catch (e) {
            console.error('Error loading game state:', e);
        }
        return false;
    }
    
    loadGameHistory() {
        try {
            const history = localStorage.getItem('chessGameHistory');
            this.gameHistory = history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Error loading game history:', e);
            this.gameHistory = [];
        }
    }
    
    saveGameToHistory(result = null) {
        const gameState = this.saveGameState();
        gameState.completed = true;
        gameState.result = result || this.gameStatus;
        this.gameHistory.unshift(gameState);
        
        // Keep only last 20 games
        if (this.gameHistory.length > 20) {
            this.gameHistory = this.gameHistory.slice(0, 20);
        }
        
        localStorage.setItem('chessGameHistory', JSON.stringify(this.gameHistory));
    }
    
    showHistory() {
        const modal = document.getElementById('history-modal');
        const historyList = document.getElementById('history-list');
        
        historyList.innerHTML = '';
        
        if (this.gameHistory.length === 0) {
            historyList.innerHTML = '<p style="color: #ecf0f1;">No games found</p>';
        } else {
            this.gameHistory.forEach((game, index) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const resultText = game.completed ? 
                    (game.result === 'checkmate' ? 
                        `Checkmate - ${game.currentPlayer === 'white' ? 'Black' : 'White'} wins!` :
                        game.result === 'stalemate' ? 'Stalemate - Draw' :
                        `Game ended: ${game.result}`) :
                    'In progress';
                
                item.innerHTML = `
                    <div class="history-info">
                        <strong>${new Date(game.timestamp).toLocaleDateString()} ${new Date(game.timestamp).toLocaleTimeString()}</strong><br>
                        <span>${game.gameMode.replace(/-/g, ' vs ').replace(/\b\w/g, l => l.toUpperCase())}</span><br>
                        <span style="color: ${game.completed ? '#e74c3c' : '#f39c12'}">${resultText}</span>
                    </div>
                    <div class="history-actions">
                        ${!game.completed ? `<button onclick="chessGame.resumeGame(${index})">Resume</button>` : ''}
                        <button onclick="chessGame.deleteGame(${index})">Delete</button>
                    </div>
                `;
                historyList.appendChild(item);
            });
        }
        
        modal.style.display = 'flex';
    }
    
    hideHistory() {
        document.getElementById('history-modal').style.display = 'none';
    }
    
    resumeGame(index) {
        const game = this.gameHistory[index];
        this.board = game.board;
        this.currentPlayer = game.currentPlayer;
        this.lastMove = game.lastMove;
        this.moveHistory = game.moveHistory || [];
        this.gameStatus = game.gameStatus;
        this.gameMode = game.gameMode;
        this.humanColor = game.humanColor;
        this.botColor = game.botColor;
        this.botDifficulty = game.botDifficulty || 5;
        this.whiteBotDifficulty = game.whiteBotDifficulty || 5;
        this.blackBotDifficulty = game.blackBotDifficulty || 7;
        
        this.setupElement.style.display = 'none';
        this.gameAreaElement.style.display = 'block';
        this.hideHistory();
        this.renderBoard();
        this.updateGameInfo();
        
        // If it's a bot's turn when resuming, make a move
        if (this.gameStatus === 'playing' || this.gameStatus === 'check') {
            if ((this.gameMode === 'human-vs-bot' && this.currentPlayer === this.botColor) ||
                this.gameMode === 'bot-vs-bot') {
                setTimeout(() => this.makeBotMove(), 500);
            }
        }
    }
    
    deleteGame(index) {
        this.gameHistory.splice(index, 1);
        localStorage.setItem('chessGameHistory', JSON.stringify(this.gameHistory));
        this.showHistory(); // Refresh the list
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) {
            console.log('No moves to undo');
            return;
        }
        
        if (this.isThinking) {
            console.log('Cannot undo while bot is thinking');
            return;
        }
        
        // In bot games, undo the last two moves (human + bot)
        const movesToUndo = this.gameMode === 'human-vs-bot' ? 2 : 1;
        
        for (let i = 0; i < movesToUndo && this.moveHistory.length > 0; i++) {
            const lastState = this.moveHistory.pop();
            this.board = lastState.board;
            this.currentPlayer = lastState.currentPlayer;
            this.lastMove = lastState.lastMove;
            this.gameStatus = lastState.gameStatus;
        }
        
        this.renderBoard();
        this.updateGameInfo();
    }
    
    switchSides() {
        if (this.gameMode !== 'human-vs-bot') {
            console.log('Can only switch sides in human vs bot mode');
            return;
        }
        
        if (this.isThinking) {
            console.log('Cannot switch sides while bot is thinking');
            return;
        }
        
        // Swap colors
        const oldHumanColor = this.humanColor;
        this.humanColor = this.botColor;
        this.botColor = oldHumanColor;
        
        this.renderBoard();
        this.updateGameInfo();
        
        // If it's now the bot's turn, make a move
        if (this.currentPlayer === this.botColor && (this.gameStatus === 'playing' || this.gameStatus === 'check')) {
            setTimeout(() => this.makeBotMove(), 500);
        }
    }
    
    flipBoard() {
        this.boardFlipped = !this.boardFlipped;
        this.renderBoard();
    }
    
    async showHint() {
        if ((this.gameStatus !== 'playing' && this.gameStatus !== 'check') || this.isThinking) {
            return;
        }
        
        // Temporarily show hint calculation
        const hintButton = document.getElementById('hint-move');
        const originalText = hintButton.textContent;
        hintButton.textContent = '💭 Thinking...';
        hintButton.disabled = true;
        
        try {
            // Use the bot's move finding algorithm to suggest a move
            const bestMove = await this.findBestMoveWithTimeout(this.currentPlayer, Math.min(this.botDifficulty + 2, 10));
            
            if (bestMove) {
                // Highlight the suggested move
                this.showHintHighlight(bestMove);
                
                // Show hint for 3 seconds
                setTimeout(() => {
                    this.renderBoard(); // Remove hint highlighting
                }, 3000);
            }
        } catch (error) {
            console.log('Error generating hint:', error);
        }
        
        hintButton.textContent = originalText;
        hintButton.disabled = false;
    }
    
    showHintHighlight(move) {
        const fromSquare = this.boardElement.children[move.fromRow * 8 + move.fromCol];
        const toSquare = this.boardElement.children[move.toRow * 8 + move.toCol];
        
        fromSquare.classList.add('hint-from');
        toSquare.classList.add('hint-to');
    }
    
    startGame() {
        console.log('startGame() method called');
        // Get settings from UI
        this.gameMode = document.getElementById('game-mode').value;
        console.log('Game mode:', this.gameMode);
        
        if (this.gameMode === 'human-vs-bot') {
            this.botDifficulty = parseInt(document.getElementById('bot-difficulty').value);
            const playerColor = document.getElementById('player-color').value;
            if (playerColor === 'random') {
                this.humanColor = Math.random() < 0.5 ? 'white' : 'black';
            } else {
                this.humanColor = playerColor;
            }
            this.botColor = this.humanColor === 'white' ? 'black' : 'white';
        } else if (this.gameMode === 'bot-vs-bot') {
            this.whiteBotDifficulty = parseInt(document.getElementById('white-bot-difficulty').value);
            this.blackBotDifficulty = parseInt(document.getElementById('black-bot-difficulty').value);
            this.humanColor = null; // No human player
            this.botColor = null; // Both are bots
        }
        
        // Initialize game
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameStatus = 'playing';
        this.isThinking = false;
        this.lastMove = null;
        
        // Show game area, hide setup
        this.setupElement.style.display = 'none';
        this.gameAreaElement.style.display = 'block';
        
        this.renderBoard();
        this.updateGameInfo();
        
        // If bot goes first or bot vs bot mode
        if ((this.gameMode === 'human-vs-bot' && this.botColor === 'white') || 
            this.gameMode === 'bot-vs-bot') {
            setTimeout(() => this.makeBotMove(), 500);
        }
    }
    
    backToSetup() {
        this.gameStatus = 'setup';
        this.setupElement.style.display = 'block';
        this.gameAreaElement.style.display = 'none';
    }
    
    resetGame() {
        if (this.gameMode === 'human-vs-bot') {
            // Randomize colors again if set to random
            const playerColorSelect = document.getElementById('player-color');
            if (playerColorSelect.value === 'random') {
                this.humanColor = Math.random() < 0.5 ? 'white' : 'black';
                this.botColor = this.humanColor === 'white' ? 'black' : 'white';
            }
        }
        
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameStatus = 'playing';
        this.isThinking = false;
        this.lastMove = null;
        this.moveHistory = [];
        this.renderBoard();
        this.updateGameInfo();
        
        // If bot goes first or bot vs bot mode
        if ((this.gameMode === 'human-vs-bot' && this.botColor === 'white') || 
            this.gameMode === 'bot-vs-bot') {
            setTimeout(() => this.makeBotMove(), 500);
        }
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
            board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
        }
        
        // Place other pieces
        const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: pieceOrder[i], color: 'black', hasMoved: false };
            board[7][i] = { type: pieceOrder[i], color: 'white', hasMoved: false };
        }
        
        return board;
    }
    
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        // Determine if board should be flipped (when human plays black OR manually flipped)
        const isFlipped = this.boardFlipped || (this.gameMode === 'human-vs-bot' && this.humanColor === 'black');
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Flip coordinates if playing as black
                const displayRow = isFlipped ? 7 - row : row;
                const displayCol = isFlipped ? 7 - col : col;
                
                const square = document.createElement('div');
                square.className = `square ${(displayRow + displayCol) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row; // Keep actual board coordinates
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.pieces[piece.color][piece.type];
                    
                    // Highlight king if in check
                    if (piece.type === 'king' && this.isKingInCheck(piece.color)) {
                        square.classList.add('king-in-check');
                    }
                }
                
                // Highlight last move
                if (this.lastMove && 
                    ((this.lastMove.fromRow === row && this.lastMove.fromCol === col) ||
                     (this.lastMove.toRow === row && this.lastMove.toCol === col))) {
                    square.classList.add('last-move');
                }
                
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                this.boardElement.appendChild(square);
            }
        }
        
        // Update board layout for flipped view
        if (isFlipped) {
            this.boardElement.style.transform = 'rotate(180deg)';
            // Rotate pieces back so they're right-side up
            const squares = this.boardElement.children;
            for (let square of squares) {
                square.style.transform = 'rotate(180deg)';
            }
        } else {
            this.boardElement.style.transform = 'none';
            const squares = this.boardElement.children;
            for (let square of squares) {
                square.style.transform = 'none';
            }
        }
    }
    
    handleSquareClick(event) {
        if ((this.gameStatus !== 'playing' && this.gameStatus !== 'check') || this.isThinking) return;
        
        // In bot vs bot mode, don't allow any human interaction
        if (this.gameMode === 'bot-vs-bot') {
            return;
        }
        
        // In bot mode, only allow human player moves
        if (this.gameMode === 'human-vs-bot' && this.currentPlayer === this.botColor) {
            return;
        }
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (this.selectedSquare) {
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                this.clearSelection();
                return;
            }
            
            // Try to move piece
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.clearSelection();
                this.updateGameInfo();
                
                // Bot move after human move - ensure bot responds even when put in check
                if (this.gameMode === 'human-vs-bot' && this.currentPlayer === this.botColor && 
                    (this.gameStatus === 'playing' || this.gameStatus === 'check')) {
                    setTimeout(() => this.makeBotMove(), 500);
                }
            } else {
                this.clearSelection();
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    this.selectSquare(row, col);
                }
            }
        } else {
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
            }
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.highlightSquare(row, col);
        this.highlightPossibleMoves(row, col);
    }
    
    clearSelection() {
        this.selectedSquare = null;
        this.renderBoard();
    }
    
    highlightSquare(row, col) {
        const square = this.boardElement.children[row * 8 + col];
        square.classList.add('selected');
    }
    
    highlightPossibleMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const targetSquare = this.boardElement.children[r * 8 + c];
                    const targetPiece = this.board[r][c];
                    
                    if (targetPiece && targetPiece.color !== piece.color) {
                        targetSquare.classList.add('enemy-piece');
                    } else if (!targetPiece) {
                        targetSquare.classList.add('possible-move');
                    }
                }
            }
        }
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        if (!this.isValidPieceMove(piece, fromRow, fromCol, toRow, toCol, targetPiece)) {
            return false;
        }
        
        return !this.wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol);
    }
    
    isValidPieceMove(piece, fromRow, fromCol, toRow, toCol, targetPiece) {
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol, targetPiece);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                // Normal king move
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                // Castling move
                if (absRowDiff === 0 && absColDiff === 2) {
                    return this.canCastle(piece, fromRow, fromCol, toRow, toCol);
                }
                return false;
            case 'knight':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
            default:
                return false;
        }
    }
    
    isValidPawnMove(piece, fromRow, fromCol, toRow, toCol, targetPiece) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Forward moves
        if (colDiff === 0 && !targetPiece) {
            // Single step forward
            if (rowDiff === direction) return true;
            
            // Double step from starting position
            if (fromRow === startRow && rowDiff === 2 * direction) {
                // Check if the path is clear (square in front must be empty)
                const middleRow = fromRow + direction;
                if (this.board[middleRow][fromCol] === null) {
                    return true;
                }
            }
        }
        
        // Diagonal captures
        if (colDiff === 1 && rowDiff === direction) {
            // Regular capture
            if (targetPiece) return true;
            // En passant capture
            if (this.isEnPassantCapture(fromRow, fromCol, toRow, toCol)) return true;
        }
        
        return false;
    }
    
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }
    
    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        if (rowDiff !== colDiff) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }
    
    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }
    
    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== null) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        let isCapture = !!capturedPiece;
        let isPromotion = false;
        let isCastling = false;
        let isEnPassant = false;
        
        // Save board state before making the move
        const gameStateBeforeMove = {
            board: this.board.map(row => row.map(piece => piece ? {...piece} : null)),
            currentPlayer: this.currentPlayer,
            lastMove: this.lastMove ? {...this.lastMove} : null,
            gameStatus: this.gameStatus,
            move: {fromRow, fromCol, toRow, toCol},
            capturedPiece: capturedPiece ? {...capturedPiece} : null
        };
        this.moveHistory.push(gameStateBeforeMove);
        
        // Check if this is a castling move
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            this.executeCastling(fromRow, fromCol, toRow, toCol);
            isCastling = true;
        } else if (piece.type === 'pawn' && this.isEnPassantCapture(fromRow, fromCol, toRow, toCol)) {
            // En passant capture
            this.executeEnPassant(fromRow, fromCol, toRow, toCol);
            isCapture = true;
            isEnPassant = true;
        } else {
            // Normal move
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
            piece.hasMoved = true;
            
            // Check for pawn promotion
            if (piece.type === 'pawn' && this.isPawnPromotion(toRow, piece.color)) {
                this.promotePawn(toRow, toCol);
                isPromotion = true;
            }
        }
        
        // Play appropriate sound
        if (isCastling) {
            this.playCastleSound();
        } else if (isPromotion) {
            this.playPromotionSound();
        } else if (isCapture) {
            this.playCaptureSound();
        } else {
            this.playMoveSound();
        }
        
        // Store last move for highlighting and en passant
        this.lastMove = {
            fromRow, fromCol, toRow, toCol,
            piece: piece.type,
            color: piece.color
        };
        
        this.renderBoard();
        this.switchPlayer();
        this.checkGameState();
        
        // Save game state after each move
        this.saveGameState();
    }
    
    executeCastling(kingRow, kingCol, newKingRow, newKingCol) {
        const king = this.board[kingRow][kingCol];
        const isKingside = newKingCol > kingCol;
        
        // Move king
        this.board[newKingRow][newKingCol] = king;
        this.board[kingRow][kingCol] = null;
        king.hasMoved = true;
        
        // Move rook
        if (isKingside) {
            // Kingside castling (O-O)
            const rook = this.board[kingRow][7];
            this.board[kingRow][5] = rook;
            this.board[kingRow][7] = null;
            rook.hasMoved = true;
        } else {
            // Queenside castling (O-O-O)
            const rook = this.board[kingRow][0];
            this.board[kingRow][3] = rook;
            this.board[kingRow][0] = null;
            rook.hasMoved = true;
        }
    }
    
    isEnPassantCapture(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece.type !== 'pawn') return false;
        
        // Must be diagonal move to empty square
        if (Math.abs(toCol - fromCol) !== 1 || this.board[toRow][toCol] !== null) return false;
        
        // Check if last move was a pawn moving 2 squares
        if (!this.lastMove) return false;
        if (this.lastMove.piece !== 'pawn') return false;
        if (Math.abs(this.lastMove.toRow - this.lastMove.fromRow) !== 2) return false;
        
        // The captured pawn must be adjacent and on the same row
        if (this.lastMove.toRow !== fromRow) return false;
        if (this.lastMove.toCol !== toCol) return false;
        
        return true;
    }
    
    executeEnPassant(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        
        // Move the capturing pawn
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.hasMoved = true;
        
        // Remove the captured pawn (it's on fromRow, toCol)
        this.board[fromRow][toCol] = null;
        
        // Check for pawn promotion after en passant
        if (this.isPawnPromotion(toRow, piece.color)) {
            this.promotePawn(toRow, toCol);
        }
    }
    
    isPawnPromotion(row, color) {
        // White pawns promote on row 0 (8th rank)
        // Black pawns promote on row 7 (1st rank)
        return (color === 'white' && row === 0) || (color === 'black' && row === 7);
    }
    
    promotePawn(row, col) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'pawn') {
            // Automatically promote to queen
            piece.type = 'queen';
        }
    }
    
    canCastle(king, kingRow, kingCol, newKingRow, newKingCol) {
        // King must not have moved
        if (king.hasMoved) return false;
        
        // King must not be in check
        if (this.isKingInCheck(king.color)) return false;
        
        const isKingside = newKingCol > kingCol;
        const rookCol = isKingside ? 7 : 0;
        const rook = this.board[kingRow][rookCol];
        
        // Rook must exist and not have moved
        if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
        
        // Path between king and rook must be clear
        const startCol = Math.min(kingCol, rookCol) + 1;
        const endCol = Math.max(kingCol, rookCol) - 1;
        for (let col = startCol; col <= endCol; col++) {
            if (this.board[kingRow][col] !== null) return false;
        }
        
        // King must not pass through or end up in check
        const direction = isKingside ? 1 : -1;
        for (let i = 0; i <= 2; i++) {
            const checkCol = kingCol + (i * direction);
            if (this.isSquareUnderAttack(kingRow, checkCol, king.color === 'white' ? 'black' : 'white')) {
                return false;
            }
        }
        
        return true;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }
    
    updateGameInfo() {
        this.currentPlayerElement.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        
        let statusText = 'Game in progress';
        if (this.isThinking) {
            statusText = 'Bot is thinking...';
        } else if (this.gameStatus === 'checkmate') {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            statusText = `Checkmate! ${winner} wins!`;
        } else if (this.gameStatus === 'check') {
            statusText = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} is in check!`;
        } else if (this.gameStatus === 'stalemate') {
            statusText = 'Stalemate! It\'s a draw!';
        }
        
        this.gameStatusElement.textContent = statusText;
        
        // Update game mode info
        if (this.gameMode === 'human-vs-bot') {
            this.gameModeInfoElement.textContent = `You: ${this.humanColor.charAt(0).toUpperCase() + this.humanColor.slice(1)} | Bot: Level ${this.botDifficulty}`;
        } else if (this.gameMode === 'bot-vs-bot') {
            this.gameModeInfoElement.textContent = `White Bot: Level ${this.whiteBotDifficulty} | Black Bot: Level ${this.blackBotDifficulty}`;
        } else {
            this.gameModeInfoElement.textContent = 'Human vs Human';
        }
    }
    
    // Bot AI Methods
    async makeBotMove() {
        // Bot should continue playing when game is active (playing or in check)
        if (this.gameStatus !== 'playing' && this.gameStatus !== 'check') {
            console.log('Bot cannot move - game status:', this.gameStatus);
            return;
        }
        
        // Check if current player should be controlled by bot
        const shouldBotPlay = this.gameMode === 'bot-vs-bot' || 
                             (this.gameMode === 'human-vs-bot' && this.currentPlayer === this.botColor);
        
        if (!shouldBotPlay) {
            console.log('Bot should not play - game mode:', this.gameMode, 'current player:', this.currentPlayer, 'bot color:', this.botColor);
            return;
        }
        
        this.isThinking = true;
        this.updateGameInfo();
        
        // Get difficulty for current player
        let currentBotDifficulty;
        if (this.gameMode === 'bot-vs-bot') {
            currentBotDifficulty = this.currentPlayer === 'white' ? this.whiteBotDifficulty : this.blackBotDifficulty;
        } else {
            currentBotDifficulty = this.botDifficulty;
        }
        
        // Simulate thinking time based on difficulty
        const thinkingTime = Math.max(500, (11 - currentBotDifficulty) * 200);
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        // Use timeout for bot calculation
        const bestMove = await this.findBestMoveWithTimeout(this.currentPlayer, currentBotDifficulty);
        
        if (bestMove) {
            this.makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
        }
        
        this.isThinking = false;
        this.updateGameInfo();
        
        // In bot vs bot mode, automatically make the next move after a short delay
        if (this.gameMode === 'bot-vs-bot' && (this.gameStatus === 'playing' || this.gameStatus === 'check')) {
            setTimeout(() => this.makeBotMove(), 750);
        }
    }
    
    async findBestMoveWithTimeout(color, difficulty) {
        return new Promise((resolve) => {
            // Set a timeout to prevent infinite thinking
            const timeout = setTimeout(() => {
                console.log('Bot thinking timeout, using basic move');
                const moves = this.getAllValidMoves(color);
                resolve(moves.length > 0 ? this.findBestMoveBasic(moves, color) : null);
            }, 5000); // 5 second timeout
            
            try {
                const bestMove = this.findBestMove(color, difficulty);
                clearTimeout(timeout);
                resolve(bestMove);
            } catch (error) {
                console.error('Bot thinking error:', error);
                clearTimeout(timeout);
                const moves = this.getAllValidMoves(color);
                resolve(moves.length > 0 ? moves[0] : null);
            }
        });
    }
    
    findBestMove(color, difficulty) {
        const moves = this.getAllValidMoves(color);
        if (moves.length === 0) return null;
        
        // Try opening book first for higher levels
        if (difficulty >= 7) {
            const openingMove = this.getOpeningMove(color);
            if (openingMove) return openingMove;
        }
        
        // For lower difficulties, add randomness
        if (difficulty <= 2) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        
        // For low-medium difficulties, use basic evaluation with some randomness
        if (difficulty <= 4) {
            const bestMoves = this.findTopMoves(moves, color, 3);
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        // For medium difficulties, use basic evaluation
        if (difficulty <= 6) {
            return this.findBestMoveBasic(moves, color);
        }
        
        // For higher difficulties, use minimax with reasonable depth
        let depth;
        switch(difficulty) {
            case 7: depth = 2; break;
            case 8: depth = 3; break;
            case 9: depth = 3; break;
            case 10: depth = 4; break;
            default: depth = 2;
        }
        
        return this.findBestMoveMinimax(moves, color, depth);
    }
    
    findBestMoveBasic(moves, color) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            let score = 0;
            
            // Prioritize captures
            const capturedPiece = this.board[move.toRow][move.toCol];
            if (capturedPiece) {
                score += this.pieceValues[capturedPiece.type] * 10;
            }
            
            // Add some randomness
            score += Math.random() * 5;
            
            // Avoid moves that put own king in check (already filtered in getAllValidMoves)
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    findBestMoveMinimax(moves, color, depth) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        // Order moves for better alpha-beta pruning
        const orderedMoves = this.orderMoves(moves, color);
        
        for (const move of orderedMoves) {
            // Make move temporarily
            const originalPiece = this.board[move.fromRow][move.fromCol];
            const capturedPiece = this.board[move.toRow][move.toCol];
            const originalHasMoved = originalPiece.hasMoved;
            const originalType = originalPiece.type;
            
            this.board[move.toRow][move.toCol] = originalPiece;
            this.board[move.fromRow][move.fromCol] = null;
            originalPiece.hasMoved = true;
            
            // Handle promotion in simulation
            if (originalPiece.type === 'pawn' && this.isPawnPromotion(move.toRow, originalPiece.color)) {
                originalPiece.type = 'queen';
            }
            
            // Evaluate position
            const score = this.minimax(depth - 1, false, color, -Infinity, Infinity);
            
            // Restore board
            this.board[move.fromRow][move.fromCol] = originalPiece;
            this.board[move.toRow][move.toCol] = capturedPiece;
            originalPiece.hasMoved = originalHasMoved;
            originalPiece.type = originalType; // Restore original piece type
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    minimax(depth, isMaximizing, botColor, alpha, beta) {
        if (depth === 0) {
            return this.evaluatePosition(botColor);
        }
        
        const currentColor = isMaximizing ? botColor : (botColor === 'white' ? 'black' : 'white');
        const moves = this.getAllValidMoves(currentColor);
        
        if (moves.length === 0) {
            if (this.isKingInCheck(currentColor)) {
                return isMaximizing ? -10000 : 10000; // Checkmate
            }
            return 0; // Stalemate
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const originalPiece = this.board[move.fromRow][move.fromCol];
                const capturedPiece = this.board[move.toRow][move.toCol];
                const originalHasMoved = originalPiece.hasMoved;
                const originalType = originalPiece.type;
                
                this.board[move.toRow][move.toCol] = originalPiece;
                this.board[move.fromRow][move.fromCol] = null;
                originalPiece.hasMoved = true;
                
                // Handle promotion in simulation
                if (originalPiece.type === 'pawn' && this.isPawnPromotion(move.toRow, originalPiece.color)) {
                    originalPiece.type = 'queen';
                }
                
                const evaluation = this.minimax(depth - 1, false, botColor, alpha, beta);
                
                this.board[move.fromRow][move.fromCol] = originalPiece;
                this.board[move.toRow][move.toCol] = capturedPiece;
                originalPiece.hasMoved = originalHasMoved;
                originalPiece.type = originalType;
                
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const originalPiece = this.board[move.fromRow][move.fromCol];
                const capturedPiece = this.board[move.toRow][move.toCol];
                const originalHasMoved = originalPiece.hasMoved;
                const originalType = originalPiece.type;
                
                this.board[move.toRow][move.toCol] = originalPiece;
                this.board[move.fromRow][move.fromCol] = null;
                originalPiece.hasMoved = true;
                
                // Handle promotion in simulation
                if (originalPiece.type === 'pawn' && this.isPawnPromotion(move.toRow, originalPiece.color)) {
                    originalPiece.type = 'queen';
                }
                
                const evaluation = this.minimax(depth - 1, true, botColor, alpha, beta);
                
                this.board[move.fromRow][move.fromCol] = originalPiece;
                this.board[move.toRow][move.toCol] = capturedPiece;
                originalPiece.hasMoved = originalHasMoved;
                originalPiece.type = originalType;
                
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    evaluatePosition(botColor) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const pieceValue = this.pieceValues[piece.type];
                    const positionValue = this.getPieceSquareValue(piece, row, col);
                    const totalValue = pieceValue + positionValue;
                    
                    if (piece.color === botColor) {
                        score += totalValue;
                    } else {
                        score -= totalValue;
                    }
                }
            }
        }
        
        // Add tactical bonuses
        score += this.evaluateTactics(botColor);
        score += this.evaluateKingSafety(botColor);
        score += this.evaluatePawnStructure(botColor);
        score += this.evaluatePromotionThreats(botColor);
        
        return score;
    }
    
    getPieceSquareValue(piece, row, col) {
        const table = this.pieceSquareTables[piece.type];
        if (!table) return 0;
        
        // Flip table for black pieces
        const tableRow = piece.color === 'white' ? row : 7 - row;
        return table[tableRow][col];
    }
    
    evaluateTactics(color) {
        let score = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Count attacked pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isSquareUnderAttack(row, col, color)) {
                        score += this.pieceValues[piece.type] * 0.1;
                    }
                }
            }
        }
        
        return score;
    }
    
    evaluateKingSafety(color) {
        const king = this.findKing(color);
        if (!king) return 0;
        
        let safety = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Penalty for king in center early game
        if (this.isEarlyGame() && (king.col >= 2 && king.col <= 5)) {
            safety -= 50;
        }
        
        // Bonus for castling
        if (king.col === 6 || king.col === 2) {
            safety += 30;
        }
        
        // Count attackers near king
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = king.row + dr;
                const c = king.col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (this.isSquareUnderAttack(r, c, opponentColor)) {
                        safety -= 10;
                    }
                }
            }
        }
        
        return safety;
    }
    
    evaluatePawnStructure(color) {
        let score = 0;
        
        for (let col = 0; col < 8; col++) {
            const pawns = [];
            for (let row = 0; row < 8; row++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'pawn' && piece.color === color) {
                    pawns.push(row);
                }
            }
            
            // Penalty for doubled pawns
            if (pawns.length > 1) {
                score -= 20 * (pawns.length - 1);
            }
            
            // Bonus for passed pawns
            if (pawns.length === 1) {
                const pawnRow = pawns[0];
                let isPassed = true;
                const direction = color === 'white' ? -1 : 1;
                
                for (let checkCol = Math.max(0, col - 1); checkCol <= Math.min(7, col + 1); checkCol++) {
                    for (let checkRow = pawnRow + direction; checkRow >= 0 && checkRow < 8; checkRow += direction) {
                        const checkPiece = this.board[checkRow][checkCol];
                        if (checkPiece && checkPiece.type === 'pawn' && checkPiece.color !== color) {
                            isPassed = false;
                            break;
                        }
                    }
                    if (!isPassed) break;
                }
                
                if (isPassed) {
                    const advancement = color === 'white' ? 7 - pawnRow : pawnRow;
                    score += advancement * 10;
                }
            }
        }
        
        return score;
    }
    
    isEarlyGame() {
        let pieceCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col]) pieceCount++;
            }
        }
        return pieceCount > 20; // Early game if most pieces still on board
    }
    
    evaluatePromotionThreats(color) {
        let score = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'pawn') {
                    const distanceToPromotion = piece.color === 'white' ? row : 7 - row;
                    
                    if (piece.color === color) {
                        // Exponential bonus for own pawns close to promotion
                        if (distanceToPromotion === 0) {
                            score += 800; // About to promote next move
                        } else if (distanceToPromotion === 1) {
                            score += 200; // Two moves away
                        } else if (distanceToPromotion === 2) {
                            score += 50; // Three moves away
                        }
                    } else {
                        // Exponential penalty for opponent pawns close to promotion
                        if (distanceToPromotion === 0) {
                            score -= 800; // Opponent about to promote - very bad!
                        } else if (distanceToPromotion === 1) {
                            score -= 200; // Must stop this pawn urgently
                        } else if (distanceToPromotion === 2) {
                            score -= 50; // Starting to be a concern
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    getOpeningMove(color) {
        // Simple opening book logic
        const moveCount = this.getMoveCount();
        if (moveCount > 10) return null; // Only use opening book for first few moves
        
        if (moveCount === 0 && color === 'white') {
            const openingMoves = ['e2e4', 'd2d4', 'g1f3'];
            const move = openingMoves[Math.floor(Math.random() * openingMoves.length)];
            return this.parseAlgebraicMove(move);
        }
        
        return null; // Simplified for now
    }
    
    getMoveCount() {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.hasMoved) count++;
            }
        }
        return Math.floor(count / 2); // Rough estimate
    }
    
    parseAlgebraicMove(move) {
        // Convert algebraic notation like 'e2e4' to board coordinates
        if (move.length !== 4) return null;
        
        const fromCol = move.charCodeAt(0) - 97; // 'a' = 0
        const fromRow = 8 - parseInt(move.charAt(1));
        const toCol = move.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(move.charAt(3));
        
        return { fromRow, fromCol, toRow, toCol };
    }
    
    findTopMoves(moves, color, count) {
        const scoredMoves = moves.map(move => ({
            move,
            score: this.evaluateMove(move, color)
        }));
        
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves.slice(0, count).map(item => item.move);
    }
    
    evaluateMove(move, color) {
        let score = 0;
        
        // Bonus for captures
        const capturedPiece = this.board[move.toRow][move.toCol];
        if (capturedPiece) {
            score += this.pieceValues[capturedPiece.type];
        }
        
        // Huge bonus for pawn promotion
        const movingPiece = this.board[move.fromRow][move.fromCol];
        if (movingPiece && movingPiece.type === 'pawn' && this.isPawnPromotion(move.toRow, color)) {
            score += this.pieceValues.queen - this.pieceValues.pawn; // Net gain from promotion
        }
        
        // Bonus for center control
        if ((move.toRow >= 3 && move.toRow <= 4) && (move.toCol >= 3 && move.toCol <= 4)) {
            score += 10;
        }
        
        // Small random factor
        score += Math.random() * 5;
        
        return score;
    }
    
    orderMoves(moves, color) {
        // Simple move ordering: captures first, then center moves
        return moves.sort((a, b) => {
            const scoreA = this.evaluateMove(a, color);
            const scoreB = this.evaluateMove(b, color);
            return scoreB - scoreA;
        });
    }
    
    getAllValidMoves(color) {
        const moves = [];
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                moves.push({ fromRow, fromCol, toRow, toCol });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    // Check/Checkmate detection methods (same as before)
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    isSquareUnderAttack(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === byColor) {
                    if (this.canPieceAttackSquare(piece, r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    canPieceAttackSquare(piece, fromRow, fromCol, toRow, toCol) {
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        
        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                return absColDiff === 1 && rowDiff === direction;
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return absRowDiff <= 1 && absColDiff <= 1;
            case 'knight':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
            default:
                return false;
        }
    }
    
    isKingInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        return this.isSquareUnderAttack(king.row, king.col, opponentColor);
    }
    
    wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol) {
        const originalPiece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Handle castling simulation
        if (originalPiece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            // For castling, we already check this in canCastle method
            return false;
        }
        
        this.board[toRow][toCol] = originalPiece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isKingInCheck(originalPiece.color);
        
        this.board[fromRow][fromCol] = originalPiece;
        this.board[toRow][toCol] = capturedPiece;
        
        return inCheck;
    }
    
    hasValidMoves(color) {
        return this.getAllValidMoves(color).length > 0;
    }
    
    checkGameState() {
        const inCheck = this.isKingInCheck(this.currentPlayer);
        const hasValidMoves = this.hasValidMoves(this.currentPlayer);
        const previousStatus = this.gameStatus;
        
        if (inCheck && !hasValidMoves) {
            this.gameStatus = 'checkmate';
            if (previousStatus !== 'checkmate') {
                this.playCheckmateSound();
                this.saveGameToHistory('checkmate');
            }
        } else if (!inCheck && !hasValidMoves) {
            this.gameStatus = 'stalemate';
            if (previousStatus !== 'stalemate') {
                this.saveGameToHistory('stalemate');
            }
        } else if (inCheck) {
            this.gameStatus = 'check';
            if (previousStatus !== 'check') {
                this.playCheckSound();
            }
        } else {
            this.gameStatus = 'playing';
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});