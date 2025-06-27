# Claude Context Notes

## Coding Style Preferences
- **Comments**: Concise, describe current state, not development history
- **Code**: Clean, minimal, to-the-point
- **Remove unnecessary explanations** and optimization notes after implementation

## Project Context
- Tidal forces physics simulation
- WebGL + TypeScript approach
- World coordinates: -1 to +1 range
- Arrow-shaped triangles will represent force vectors

## Technical Decisions
- Viewport transformation in vertex shader (not JavaScript)
- GPU optimization: use multiplication over division where possible
- Local npm dependencies, direct .bin/ paths preferred over npx

## Physics Design
- **Particles**: 32x32 grid with gravity + pressure + moon gravity + centrifugal forces
- **Central gravity**: F = k × r (linear with distance from origin) 
- **Pressure forces**: Linear spring F = k × (restDistance - distance) when distance < restDistance, else 0
- **Moon physics**: Separate mass, strength distance, pointing distance, rotation center
  - **Force magnitude**: Based on moonMass / strengthDistance²
  - **Force direction**: Points toward moonPointingDistance position
  - **Centrifugal force**: Linear with distance from rotationCenterDistance, x-direction only
- **Triangle pointing**: Shows combined moon gravity + centrifugal forces with exponential pointiness (10^pointiness)

## Code Structure
```
src/
├── main.ts          # WebGL rendering + main loop  
├── physics.ts       # Physics simulation (Particle, PhysicalWorld classes)
└── types.ts         # Shared types/interfaces
```

## UI Design
- **HTML controls over WebGL canvas** - bottom overlay in 3×2 grid layout
- **Current sliders** (5 total, logarithmic scaling except pointiness):
  - Moon Mass (0.001 to 10.0)
  - Moon Strength Distance (5 to 2000) - for force magnitude calculation
  - Moon Pointing Distance (5 to 2000) - for force direction  
  - Rotation Center Distance (0.1 to 50) - for centrifugal force center
  - Pointiness (-1 to +10) - exponential triangle sharpness (10^value)
- **Debug logging**: Console output for force magnitudes (scientific notation)
- **Compact styling**: Small text, reduced spacing for non-intrusive overlay

## Recent Implementation
- ✅ Moon physics system with 4 independent parameters
- ✅ 5-slider UI in 3×2 grid layout with real-time updates
- ✅ Triangle pointing based on combined forces
- ✅ Exponential pointiness control
- ✅ Force debugging with scientific notation

## Next Steps  
- Add radio buttons to choose which forces affect triangle pointing
- Consider additional force visualization options