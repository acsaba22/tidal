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

## Next Steps
- Make triangles arrow-shaped (40°-70°-70°)
- Orient arrows to point in force directions
- Consider GPU physics for scaling to thousands of particles