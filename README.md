# Conway's Game of Life

An interactive web-based implementation of Conway's Game of Life, a cellular automaton devised by mathematician John Conway.

## 🎯 Overview

Conway's Game of Life is a zero-player game that evolves based on its initial state, requiring no further input. The game consists of a grid of cells that can be either alive or dead. Each cell interacts with its eight neighbors according to a set of rules that determine the next generation.

## 📜 Rules

The universe of the Game of Life is an infinite, two-dimensional orthogonal grid of square cells. Each cell can be in one of two states: **alive** or **dead**. Every cell interacts with its eight neighbors (horizontally, vertically, and diagonally adjacent cells) according to the following rules:

1. **Birth**: Any dead cell with exactly 3 live neighbors becomes a live cell
2. **Survival**: Any live cell with 2 or 3 live neighbors survives
3. **Overpopulation**: Any live cell with more than 3 live neighbors dies
4. **Underpopulation**: Any live cell with fewer than 2 live neighbors dies

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or build process required!

### Running the Simulation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/conways-game-of-life.git
cd conways-game-of-life
```

2. Open the `index.html` file in your web browser:
   - Double-click the file
   - Or right-click and select "Open with" → Your browser
   - Or drag and drop the file into your browser

3. That's it! The simulation is ready to use.

## 🎮 Features

### Interactive Controls

- **Play/Pause**: Start or stop the simulation
- **Step**: Advance the simulation by one generation
- **Clear**: Reset the grid to empty state
- **Random**: Generate a random pattern
- **Speed Control**: Adjust simulation speed (1-60 FPS)
- **Grid Size**: Change the grid dimensions (10×10 to 100×100)

### Pattern Library

Select from pre-defined patterns including:
- **Glider**: A small pattern that travels across the grid
- **Blinker**: Oscillates between two states
- **Toad**: A period-2 oscillator
- **Beacon**: Another period-2 oscillator
- **Pulsar**: A period-3 oscillator with striking symmetry
- **Pentadecathlon**: A period-15 oscillator
- **Gosper Glider Gun**: Generates an infinite stream of gliders

### Interactive Drawing

- **Click** on cells to toggle them between alive/dead
- **Click and drag** to draw patterns
- The grid wraps around edges (toroidal topology)

## 📁 Project Structure

```
conways-game-of-life/
├── index.html          # Main HTML file
├── src/
│   ├── game.js        # Game logic and interactions
│   └── styles.css     # Styling and animations
├── tests/             # Test files (to be implemented)
├── docs/              # Documentation
└── README.md          # This file
```

## 🎨 Customization

The game appearance can be customized by modifying the CSS variables in `src/styles.css`:

- Cell colors
- Grid colors
- Animation speeds
- UI theme

## 🧪 Common Patterns

### Still Lifes
Patterns that don't change from generation to generation:
- Block (2×2)
- Beehive
- Loaf
- Boat

### Oscillators
Patterns that return to their original state after a fixed number of generations:
- Blinker (period 2)
- Toad (period 2)
- Beacon (period 2)
- Pulsar (period 3)

### Spaceships
Patterns that travel across the grid:
- Glider
- Lightweight spaceship (LWSS)
- Middleweight spaceship (MWSS)
- Heavyweight spaceship (HWSS)

## 🔬 Mathematical Background

The Game of Life is Turing complete, meaning it can simulate any computational model. It has been proven that patterns exist that can perform any calculation that a computer can perform.

## 📚 Resources

- [Wikipedia - Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
- [LifeWiki - Pattern Database](https://conwaylife.com/wiki/Main_Page)
- [Golly - Advanced Game of Life Simulator](http://golly.sourceforge.net/)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new patterns
- Improve the UI/UX
- Optimize the simulation algorithm
- Add new features

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- John Conway (1937-2020) for creating this fascinating cellular automaton
- The Game of Life community for discovering and cataloging patterns

---

**Enjoy exploring the fascinating world of cellular automata!** 🦠✨
