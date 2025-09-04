# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a pure JavaScript implementation of Conway's Game of Life that runs entirely in the browser. There are no build tools, dependencies, or compilation steps required. Simply open `index.html` in any modern browser to run the simulation.

## Architecture

The codebase follows a minimalist approach with vanilla JavaScript:

- **Single class architecture**: All game logic resides in the `GameOfLife` class in `src/game.js`
- **HTML5 Canvas rendering**: Direct pixel manipulation for efficient grid visualization
- **Toroidal topology**: The grid edges wrap around, creating a seamless infinite surface
- **Event-driven interactions**: Mouse and keyboard inputs handled through DOM event listeners
- **No external dependencies**: Runs directly from the file system without any server

## Development Workflow

### Running the Application
```bash
# Option 1: Direct file access
# Simply open index.html in your browser

# Option 2: Local server (for live reload)
python -m http.server 8000  # Python 3
# or
python -m SimpleHTTPServer 8000  # Python 2
# Then navigate to http://localhost:8000
```

### Making Changes
1. Edit files directly (no compilation needed)
2. Refresh browser to see changes
3. Use browser DevTools console for debugging

## Key Components

### GameOfLife Class (`src/game.js`)
- **Constructor**: Initializes canvas, grid state, and default parameters
- **Core methods**:
  - `step()`: Calculates next generation using Conway's rules
  - `countNeighbors()`: Implements toroidal neighbor counting
  - `draw()`: Renders grid to canvas
  - `animate()`: Frame-based animation loop using requestAnimationFrame

### Pattern System
Patterns are defined as 2D arrays in the `loadPattern()` method (lines 319-389). To add new patterns:
```javascript
patterns['pattern-name'] = [
    [0, 1, 0],
    [1, 1, 1],
    // ... more rows
];
```

### Grid Management
- Grid is stored as a 2D array of 0s (dead) and 1s (alive)
- Uses double-buffering technique (`grid` and `nextGrid`) to prevent race conditions
- Resizing preserves existing pattern centered in new grid

## Testing

The `tests/` directory exists but currently contains no implemented tests. For future testing:
- Consider browser-based testing with Jasmine or Mocha
- Alternatively, extract core logic for Node.js-based unit testing
- Key areas to test: neighbor counting, rule application, edge wrapping

## Common Modifications

### Adding New Patterns
Edit the `patterns` object in `loadPattern()` method (line 322):
```javascript
patterns['my-pattern'] = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1]
];
```
Then add corresponding option to the HTML select element.

### Changing Visual Style
Modify properties in the constructor (lines 19-21):
```javascript
this.aliveColor = '#667eea';  // Living cell color
this.deadColor = '#ffffff';   // Dead cell color  
this.gridColor = '#e0e0e0';   // Grid line color
```

### Adjusting Default Settings
Update initial values in the constructor (lines 8-16):
```javascript
this.gridSize = 50;   // Default grid dimensions
this.fps = 10;        // Default animation speed
```

## Performance Considerations

- Canvas rendering is optimized by only drawing changed cells
- Grid size above 100×100 may impact performance on slower devices
- Animation uses `requestAnimationFrame` for smooth 60fps capability
