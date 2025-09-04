// Conway's Game of Life Implementation
class GameOfLife {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
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
        
        // Colors
        this.aliveColor = '#667eea';
        this.deadColor = '#ffffff';
        this.gridColor = '#e0e0e0';
        
        // Initialize
        this.init();
        this.setupEventListeners();
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
        // Canvas click to toggle cells
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                this.grid[y][x] = this.grid[y][x] ? 0 : 1;
                this.draw();
                this.updateStats();
            }
        });
        
        // Canvas drag to paint cells
        let isDrawing = false;
        this.canvas.addEventListener('mousedown', () => isDrawing = true);
        document.addEventListener('mouseup', () => isDrawing = false);
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                if (this.grid[y][x] === 0) {
                    this.grid[y][x] = 1;
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
            this.animate();
        } else {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            btn.classList.remove('playing');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
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
        this.generation = 0;
        this.draw();
        this.updateStats();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
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
        
        for (let y = 0; y < oldSize; y++) {
            for (let x = 0; x < oldSize; x++) {
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
        
        // Place pattern in center of grid
        const offsetX = Math.floor((this.gridSize - pattern[0].length) / 2);
        const offsetY = Math.floor((this.gridSize - pattern.length) / 2);
        
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                this.grid[y + offsetY][x + offsetX] = pattern[y][x];
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
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife('gameCanvas');
    
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
});
