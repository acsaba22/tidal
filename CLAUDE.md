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
- **Particles**: Grid → sphere via gravity + pressure forces
- **Central gravity**: F = k × r (linear with distance from origin) 
- **Pressure forces**: Linear spring F = k × (restDistance - distance) when distance < restDistance, else 0
- **Parameters**: restDistance = 0.01 (many small particles in -1..+1 area)
- **No particle mass** (all same), **no moon initially**
- **Optimization**: Start with x-coordinate sorting + early break for O(n²) → O(n log n), future spatial grid if needed

## Code Structure
```
src/
├── main.ts          # WebGL rendering + main loop  
├── physics.ts       # Physics simulation (Particle, PhysicalWorld classes)
└── types.ts         # Shared types/interfaces
```

## UI Design
- **HTML controls over WebGL canvas** - non-intrusive overlay approach
- **Input**: Sliders for physics parameters (gravity strength, spring constants, etc.)
- **Output**: Debug info (FPS, particle count, physics values)
- **Interaction**: Mouse/touch gestures for camera pan/zoom
- **Libraries considered**: lil-gui, dat.gui (for controls), simple HTML for debug display

## Next Steps  
- Implement physics.ts with Particle and PhysicalWorld classes
- Make triangles arrow-shaped (40°-70°-70°)
- Orient arrows to point in force directions
- Add HTML overlay for controls and debug info