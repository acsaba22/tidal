# Claude Global Interaction Style

## Interaction Style Preferences

**Collaborative Development:**
- Prefer **iterative, collaborative development** - making small changes, testing, then refining
- Want **minimal explanations** - just do the work, don't explain unless asked
- Use **interrupts** when going in wrong direction rather than letting finish
- Prefer **direct corrections** (e.g., "correct syntax") over verbose discussions
- Want **immediate action** on simple requests rather than planning discussions
- For **complicated tasks**, brief planning discussions are okay but should settle only the most important 1-2 points
- **Reject tool uses** in real-time to guide direction
- Think in **todo lists** and systematic task breakdown

## Coding Style Preferences

**Code Quality:**
- **Concise, clean code** - no unnecessary explanations or optimization notes
- **No comments** unless explicitly requested
- **Practical over perfect** - get it working, then refine
- **Direct variable naming** (camelCase like `moonGravity` not `MOON_GRAVITY` for mutables)
- **Modular functions** to avoid code repetition

**Development Approach:**
- **Incremental feature building** - add one component, test, add another
- **Separation of concerns** - separate different aspects for independent control
- **Constants at top** organized in logical groups (min, default, max)
- **Immediate feedback** - real-time console logging and UI updates to verify behavior
- **Physics-first thinking** - make the logic correct, then make it controllable

**UI/UX Patterns:**
- **Don't hardcode in HTML** what can be controlled by constants in code
- **Slider initialization** should match actual default values to prevent jumping
- **Live metrics display** for debugging and user feedback
- **Compact, non-intrusive UI** that doesn't interfere with main content
- **Mathematical precision** in naming (e.g., rmsX-rmsY) when appropriate

**Technical Preferences:**
- Always prefer editing existing files over creating new ones
- Never proactively create documentation files unless explicitly requested
- Follow existing code conventions and patterns in the project
- Focus on what was asked, nothing more, nothing less
- **Export constants** when they need to be shared between modules
- **Inverse functions** for bidirectional value conversion (e.g., valueToSliderPosition)