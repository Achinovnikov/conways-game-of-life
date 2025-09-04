// Conway's Game of Life Implementation v1.1
class GameOfLife {
    constructor(canvasId) {
        try {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Unable to get 2D context from canvas');
            }
        } catch (error) {
            console.error('Failed to initialize canvas:', error);
            throw error;
        }
        
        // Game state
        this.gridSize = 50;
        this.cellSize = 10;
        this.grid = [];
        this.nextGrid = [];
        this.isRunning = false;
        this.generation = 0;
        this.animationId = null;
        this.fps = 10;
        this.lastFrameTime = 0;
        
        // History for undo/redo (v1.1)
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Performance optimization (v1.1)
        this.useOptimizedRendering = false;
        this.changedCells = new Set();
        
        // Colors
        this.aliveColor = '#667eea';
        this.deadColor = '#ffffff';
        this.gridColor = '#e0e0e0';
        
        // Initialize
        this.init();
        this.setupEventListeners();
        this.loadFromLocalStorage(); // v1.1
    }
    
    init() {
        // Set canvas size
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
        
        // Initialize grids
        this.grid = this.createEmptyGrid();
        this.nextGrid = this.createEmptyGrid();
        
        // Draw initial state
        this.draw();
    }
    
    createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }
    
    setupEventListeners() {
        // Canvas interaction state
        let isDrawing = false;
        let hasMovedWhileDrawing = false;
        
        // Touch support (v1.1)
        const isTouchDevice = 'ontouchstart' in window;
        
        // Canvas mousedown - start drawing
        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            hasMovedWhileDrawing = false;
            
            // Immediately draw on the clicked cell
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                // Store the initial state for consistent drawing
                this.drawingState = this.grid[y][x] === 0 ? 1 : 0;
                this.grid[y][x] = this.drawingState;
                this.draw();
                this.updateStats();
            }
        });
        
        // Canvas mouseup - stop drawing
        this.canvas.addEventListener('mouseup', (e) => {
            if (!hasMovedWhileDrawing) {
                // If no movement occurred, treat as a click toggle
                const rect = this.canvas.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left) / this.cellSize);
                const y = Math.floor((e.clientY - rect.top) / this.cellSize);
                
                if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                    // Toggle back if it was just a click without movement
                    this.grid[y][x] = this.grid[y][x] ? 0 : 1;
                    this.draw();
                    this.updateStats();
                }
            }
            isDrawing = false;
        });
        
        // Document mouseup - ensure drawing stops even if mouse leaves canvas
        document.addEventListener('mouseup', () => {
            isDrawing = false;
        });
        
        // Canvas mousemove - draw while dragging
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            hasMovedWhileDrawing = true;
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                // Use consistent drawing state during drag
                if (this.grid[y][x] !== this.drawingState) {
                    this.grid[y][x] = this.drawingState;
                    this.draw();
                    this.updateStats();
                }
            }
        });
        
        // Control buttons
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('stepBtn').addEventListener('click', () => {
            this.step();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clear();
        });
        
        document.getElementById('randomBtn').addEventListener('click', () => {
            this.randomize();
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.fps = parseInt(e.target.value);
            speedValue.textContent = this.fps;
        });
        
        // Grid size slider
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        const gridSizeValue = document.getElementById('gridSizeValue');
        const gridSizeValue2 = document.getElementById('gridSizeValue2');
        gridSizeSlider.addEventListener('input', (e) => {
            const newSize = parseInt(e.target.value);
            gridSizeValue.textContent = newSize;
            gridSizeValue2.textContent = newSize;
            this.resizeGrid(newSize);
        });
        
        // Pattern selector
        document.getElementById('patternSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPattern(e.target.value);
                e.target.value = '';
            }
        });
        
        // v1.1: Touch event support
        if (isTouchDevice) {
            this.setupTouchEvents();
        }
        
        // v1.1: Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // v1.1: Auto-save
        setInterval(() => this.saveToLocalStorage(), 5000);
    }
    
    togglePlayPause() {
        this.isRunning = !this.isRunning;
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');
        const btn = document.getElementById('playPauseBtn');
        
        if (this.isRunning) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
            btn.classList.add('playing');
            this.lastFrameTime = 0;  // Reset frame timing
            this.animate();
        } else {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            btn.classList.remove('playing');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;  // Clear the reference
            }
        }
    }
    
    animate(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastFrameTime;
        const frameInterval = 1000 / this.fps;
        
        if (deltaTime >= frameInterval) {
            this.step();
            this.lastFrameTime = currentTime - (deltaTime % frameInterval);
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    step() {
        // Calculate next generation
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const neighbors = this.countNeighbors(x, y);
                const currentState = this.grid[y][x];
                
                // Apply Conway's rules
                if (currentState === 1) {
                    // Live cell
                    this.nextGrid[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
                } else {
                    // Dead cell
                    this.nextGrid[y][x] = (neighbors === 3) ? 1 : 0;
                }
            }
        }
        
        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
        
        this.generation++;
        this.draw();
        this.updateStats();
    }
    
    countNeighbors(x, y) {
        let count = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const nx = x + j;
                const ny = y + i;
                
                // Check boundaries (toroidal topology - wrapping edges)
                const wrappedX = (nx + this.gridSize) % this.gridSize;
                const wrappedY = (ny + this.gridSize) % this.gridSize;
                
                count += this.grid[wrappedY][wrappedX];
            }
        }
        
        return count;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.deadColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.gridSize; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw cells
        this.ctx.fillStyle = this.aliveColor;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }
    
    clear() {
        this.isRunning = false;
        document.querySelector('.play-icon').style.display = 'inline';
        document.querySelector('.pause-icon').style.display = 'none';
        document.getElementById('playPauseBtn').classList.remove('playing');
        
        this.grid = this.createEmptyGrid();
        this.nextGrid = this.createEmptyGrid();  // Also reset nextGrid to prevent stale data
        this.generation = 0;
        this.draw();
        this.updateStats();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;  // Clear the reference
        }
    }
    
    randomize() {
        this.clear();
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = Math.random() > 0.7 ? 1 : 0;
            }
        }
        
        this.draw();
        this.updateStats();
    }
    
    resizeGrid(newSize) {
        const wasRunning = this.isRunning;
        if (wasRunning) {
            this.togglePlayPause();
        }
        
        // Save current pattern (centered)
        const oldGrid = this.grid;
        const oldSize = this.gridSize;
        
        this.gridSize = newSize;
        this.cellSize = Math.floor(500 / newSize);
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
        
        // Create new grids
        this.grid = this.createEmptyGrid();
        this.nextGrid = this.createEmptyGrid();
        
        // Copy old pattern to center of new grid
        const offsetX = Math.floor((newSize - oldSize) / 2);
        const offsetY = Math.floor((newSize - oldSize) / 2);
        
        // Determine the range to copy based on grid sizes
        const startY = Math.max(0, -offsetY);
        const endY = Math.min(oldSize, newSize - offsetY);
        const startX = Math.max(0, -offsetX);
        const endX = Math.min(oldSize, newSize - offsetX);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const newX = x + offsetX;
                const newY = y + offsetY;
                if (newX >= 0 && newX < newSize && newY >= 0 && newY < newSize) {
                    this.grid[newY][newX] = oldGrid[y][x];
                }
            }
        }
        
        this.draw();
        this.updateStats();
    }
    
    loadPattern(patternName) {
        this.clear();
        
        const patterns = {
            glider: [
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1]
            ],
            blinker: [
                [1, 1, 1]
            ],
            toad: [
                [0, 1, 1, 1],
                [1, 1, 1, 0]
            ],
            beacon: [
                [1, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 1, 1],
                [0, 0, 1, 1]
            ],
            pulsar: [
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0]
            ],
            pentadecathlon: [
                [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
                [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
                [0, 0, 1, 0, 0, 0, 0, 1, 0, 0]
            ],
            'glider-gun': [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ]
        };
        
        const pattern = patterns[patternName];
        if (!pattern) return;
        
        // Check if pattern is too large for the grid
        if (pattern.length > this.gridSize || pattern[0].length > this.gridSize) {
            console.warn(`Pattern "${patternName}" is too large for the current grid size`);
            return;
        }
        
        // Place pattern in center of grid
        const offsetX = Math.floor((this.gridSize - pattern[0].length) / 2);
        const offsetY = Math.floor((this.gridSize - pattern.length) / 2);
        
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (y + offsetY < this.gridSize && x + offsetX < this.gridSize) {
                    this.grid[y + offsetY][x + offsetX] = pattern[y][x];
                }
            }
        }
        
        this.draw();
        this.updateStats();
    }
    
    updateStats() {
        // Update generation counter
        document.getElementById('generation').textContent = this.generation;
        
        // Count population
        let population = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                population += this.grid[y][x];
            }
        }
        document.getElementById('population').textContent = population;
    }
    
    // v1.1: New methods for enhanced functionality
    
    setupTouchEvents() {
        let touchDrawing = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchDrawing = true;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((touch.clientX - rect.left) / this.cellSize);
            const y = Math.floor((touch.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                this.drawingState = this.grid[y][x] === 0 ? 1 : 0;
                this.grid[y][x] = this.drawingState;
                this.draw();
                this.updateStats();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!touchDrawing) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((touch.clientX - rect.left) / this.cellSize);
            const y = Math.floor((touch.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                if (this.grid[y][x] !== this.drawingState) {
                    this.grid[y][x] = this.drawingState;
                    this.draw();
                    this.updateStats();
                }
            }
        });
        
        this.canvas.addEventListener('touchend', () => {
            touchDrawing = false;
            this.saveToHistory();
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 's':
                    if (!e.ctrlKey) {
                        this.step();
                    } else {
                        e.preventDefault();
                        this.exportPattern();
                    }
                    break;
                case 'c':
                    this.clear();
                    break;
                case 'r':
                    this.randomize();
                    break;
                case 'z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.redo();
                    }
                    break;
                case 'o':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.importPattern();
                    }
                    break;
            }
        });
    }
    
    saveToHistory() {
        try {
            // Remove any states after current index
            this.history = this.history.slice(0, this.historyIndex + 1);
            
            // Add current state
            const state = {
                grid: JSON.parse(JSON.stringify(this.grid)),
                generation: this.generation
            };
            
            this.history.push(state);
            
            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            } else {
                this.historyIndex++;
            }
            
            this.updateUndoRedoButtons();
        } catch (error) {
            console.error('Failed to save to history:', error);
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.grid = JSON.parse(JSON.stringify(state.grid));
            this.generation = state.generation;
            this.draw();
            this.updateStats();
            this.updateUndoRedoButtons();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.grid = JSON.parse(JSON.stringify(state.grid));
            this.generation = state.generation;
            this.draw();
            this.updateStats();
            this.updateUndoRedoButtons();
        }
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }
    
    saveToLocalStorage() {
        try {
            const state = {
                grid: this.grid,
                generation: this.generation,
                gridSize: this.gridSize,
                fps: this.fps,
                timestamp: Date.now()
            };
            localStorage.setItem('gameOfLifeState', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gameOfLifeState');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Check if saved state is recent (within 24 hours)
                if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
                    this.grid = state.grid;
                    this.generation = state.generation;
                    this.gridSize = state.gridSize;
                    this.fps = state.fps;
                    
                    // Update UI
                    this.resizeGrid(this.gridSize);
                    const speedSlider = document.getElementById('speedSlider');
                    if (speedSlider) {
                        speedSlider.value = this.fps;
                        document.getElementById('speedValue').textContent = this.fps;
                    }
                    
                    this.draw();
                    this.updateStats();
                    this.saveToHistory();
                    
                    console.log('Game state restored from local storage');
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }
    
    exportPattern() {
        try {
            // Find bounding box of pattern
            let minX = this.gridSize, maxX = 0;
            let minY = this.gridSize, maxY = 0;
            
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (this.grid[y][x] === 1) {
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            // Extract pattern
            const pattern = [];
            for (let y = minY; y <= maxY; y++) {
                const row = [];
                for (let x = minX; x <= maxX; x++) {
                    row.push(this.grid[y][x]);
                }
                pattern.push(row);
            }
            
            // Create download
            const data = {
                name: `pattern_${Date.now()}`,
                pattern: pattern,
                author: 'User',
                date: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('Pattern exported successfully');
        } catch (error) {
            console.error('Failed to export pattern:', error);
        }
    }
    
    importPattern() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.pattern) {
                        this.clear();
                        const pattern = data.pattern;
                        
                        // Center pattern
                        const offsetX = Math.floor((this.gridSize - pattern[0].length) / 2);
                        const offsetY = Math.floor((this.gridSize - pattern.length) / 2);
                        
                        for (let y = 0; y < pattern.length; y++) {
                            for (let x = 0; x < pattern[y].length; x++) {
                                if (y + offsetY < this.gridSize && x + offsetX < this.gridSize) {
                                    this.grid[y + offsetY][x + offsetX] = pattern[y][x];
                                }
                            }
                        }
                        
                        this.draw();
                        this.updateStats();
                        this.saveToHistory();
                        
                        console.log(`Pattern "${data.name}" imported successfully`);
                    }
                } catch (error) {
                    console.error('Failed to import pattern:', error);
                    alert('Invalid pattern file');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Optimized rendering for large grids
    optimizedDraw() {
        if (this.changedCells.size === 0) {
            return; // Nothing to update
        }
        
        // Only redraw changed cells
        this.changedCells.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            
            // Clear cell
            this.ctx.fillStyle = this.deadColor;
            this.ctx.fillRect(
                x * this.cellSize,
                y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
            
            // Draw grid lines
            this.ctx.strokeStyle = this.gridColor;
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(
                x * this.cellSize,
                y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
            
            // Draw cell if alive
            if (this.grid[y][x] === 1) {
                this.ctx.fillStyle = this.aliveColor;
                this.ctx.fillRect(
                    x * this.cellSize + 1,
                    y * this.cellSize + 1,
                    this.cellSize - 2,
                    this.cellSize - 2
                );
            }
        });
        
        this.changedCells.clear();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife('gameCanvas');
    
    // Make game instance globally accessible for debugging
    window.gameInstance = game;
    
    // v1.1: Add event listeners for new buttons
    document.getElementById('undoBtn')?.addEventListener('click', () => game.undo());
    document.getElementById('redoBtn')?.addEventListener('click', () => game.redo());
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        game.saveToLocalStorage();
        alert('Game state saved!');
    });
    document.getElementById('loadBtn')?.addEventListener('click', () => {
        game.loadFromLocalStorage();
        alert('Game state loaded!');
    });
    document.getElementById('exportBtn')?.addEventListener('click', () => game.exportPattern());
    document.getElementById('importBtn')?.addEventListener('click', () => game.importPattern());
    
    // Check if there's a saved state to load
    const hasSavedState = localStorage.getItem('gameOfLifeState');
    if (!hasSavedState) {
        // Add some initial pattern for demo
        const centerX = Math.floor(game.gridSize / 2);
        const centerY = Math.floor(game.gridSize / 2);
        
        // Create a small glider
        game.grid[centerY][centerX + 1] = 1;
        game.grid[centerY + 1][centerX + 2] = 1;
        game.grid[centerY + 2][centerX] = 1;
        game.grid[centerY + 2][centerX + 1] = 1;
        game.grid[centerY + 2][centerX + 2] = 1;
        
        game.draw();
        game.updateStats();
    }
    
    // Save initial state to history
    game.saveToHistory();
    
    // Show version info in console
    console.log('🎮 Conway\'s Game of Life v1.1');
    console.log('✨ New features: Touch support, Auto-save, Undo/Redo, Import/Export');
    console.log('⌨️ Press H for help with keyboard shortcuts');
});
