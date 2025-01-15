
# Star Battle Puzzle Solver

An interactive web application for creating and solving Star Battle puzzles. This project provides both puzzle creation and solving modes, along with an intelligent hint system to help users learn solving strategies.

You can test the app [here](https://star-battle-solver.replit.app/)

## Features

- **Draw Mode**: Create custom Star Battle puzzles by drawing region boundaries
- **Solve Mode**: Solve puzzles with interactive star placement and validation
- **Intelligent Hint System**: Get targeted hints using various solving strategies including:
  - Basic row/column deductions
  - Sandwich patterns
  - Region-based deductions
  - Multi-unit constraints
  - Special shape patterns (L-shapes, T-shapes, squares)
  - Single line region analysis
  - 6-cell rectangle patterns

## Getting Started

1. Open the project in Replit
2. Run `npm install` to install dependencies
3. Use `npm run dev` to start the development server

## How to Play

1. **Draw Mode**:
   - Click cell boundaries to create regions
   - Save your puzzle when complete
   - Load example puzzles to see how they work

2. **Solve Mode**:
   - Click cells to place stars
   - Use the hint system when stuck
   - Validate your solution
   - Stars cannot be adjacent (even diagonally)
   - Each row and column must have exactly 2 stars
   - Each region must have exactly 2 stars

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Use the Issues tab to report bugs
- Include steps to reproduce the issue
- Share screenshots if possible
- Mention any console errors

### Suggesting New Hint Strategies

If you discover a new solving pattern:
1. Create an issue with tag "New Strategy"
2. Describe the pattern with examples
3. Explain why it's a valid deduction
4. Include sample puzzle scenarios

### Code Contributions

1. Fork the project on Replit
2. Make your changes
3. Test thoroughly
4. Submit a pull request with:
   - Clear description of changes
   - Screenshots/examples if relevant
   - Any new hint strategies documented

## Project Structure

```
client/src/
├── components/game/    # Core game components
├── lib/               # Game logic and state management
│   ├── solver-logic.ts   # Hint generation
│   ├── game-state.ts    # Game state management
│   └── example-puzzles.ts # Puzzle definitions
└── pages/             # Application pages
```

## License

MIT License - Feel free to use and modify the code while maintaining attribution.

## Acknowledgments

Thanks to all contributors and puzzle enthusiasts who help make this project better!
