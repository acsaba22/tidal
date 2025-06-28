# Claude Context Notes

## Coding Style Preferences
- **Comments**: Concise, describe current state, not development history
- **Code**: Clean, minimal, to-the-point
- **Remove unnecessary explanations** and optimization notes after implementation

## Project Context
- Tidal forces physics simulation
- WebGL + TypeScript approach
- World coordinates: -1 to +1 range
- Arrow-shaped triangles represent force vectors

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
- **Triangle pointing**: Configurable via radio buttons (M, C, MC, E, MCE) with exponential pointiness (10^pointiness)

## Code Structure
```
src/
├── main.ts          # WebGL rendering + main loop + UI controls
├── physics.ts       # Physics simulation (Particle, PhysicalWorld classes)
└── types.ts         # Shared types/interfaces
```

## UI Design
- **HTML controls over WebGL canvas** - bottom overlay in 3×2 grid layout
- **Shape metrics display** - upper right corner shows live rmsX-rmsY values
- **Current controls**:
  - 5 sliders with 50 positions each (logarithmic scaling except pointiness)
  - Moon Mass (0.001 to 10.0, default 2.0)
  - Moon Strength Distance (5 to 2000, default 60) - for force magnitude
  - Moon Pointing Distance (5 to 2000, default 60) - for force direction  
  - Rotation Center Distance (0.1 to 50, default 5.0) - for centrifugal force center
  - Pointiness (-1 to +10, default 1.0) - exponential triangle sharpness
  - Radio buttons for triangle pointing: M, C, MC, E, MCE
- **Compact styling**: Small text, reduced spacing for non-intrusive overlay

## Shape Deformation Metrics
- **rmsX-rmsY**: Root mean square difference showing elongation
  - Positive = wider than tall, negative = taller than wide, ~0 = circular
  - Updates every 1000ms with averaged values
  - Displayed in UI and logged to console
- **meanX, meanY**: Center drift tracking (console only)

## Recent Accomplishments
- ✅ Radio button triangle pointing control with 5 force combinations
- ✅ Smooth 50-position sliders with proper initialization 
- ✅ Constants organized in groups of 3 (min, default, max)
- ✅ Real-time shape deformation metrics
- ✅ Live UI display of physics metrics
- ✅ No more slider jumping - positions match code defaults

## Future Considerations
- Code cleanup/refactoring for simplicity
- Additional physics visualizations