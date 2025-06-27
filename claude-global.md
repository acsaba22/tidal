# Claude Global Interaction Style

## Interaction Style Preferences

**Collaborative Development:**
- Prefer **iterative, collaborative development** - making small changes, testing, then refining
- Want **minimal explanations** - just do the work, don't explain unless asked
- Use **interrupts** when going in wrong direction rather than letting finish
- Prefer **direct corrections** ("correct syntax") over verbose discussions
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
- **Constants at top** for easy tweaking and configuration
- **Immediate feedback** - real-time console logging to verify behavior
- **Physics-first thinking** - make the logic correct, then make it controllable

**Technical Preferences:**
- Always prefer editing existing files over creating new ones
- Never proactively create documentation files unless explicitly requested
- Follow existing code conventions and patterns in the project
- Focus on what was asked, nothing more, nothing less