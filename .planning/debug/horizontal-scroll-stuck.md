<objective>
Investigate issue: horizontal-scroll-stuck

**Summary:** The user added 2 videos to the "Our Project in motion" section intended for horizontal scrolling. When scrolling through this section, the page gets "stuck for a moment".
</objective>

<symptoms>
expected: Smooth scrolling through the "Our Project in motion" horizontal scroll section.
actual: Scrolling gets stuck for a moment when passing through that section.
errors: None reported.
reproduction: Scroll down to the "Our Project in motion" / horizontal scrolling section.
timeline: Started recently after adding 2 videos to this section.
</symptoms>

<mode>
symptoms_prefilled: true
goal: find_and_fix
</mode>

## ROOT CAUSE FOUND
**Issue:** The user experienced a completely "stuck" feeling while their mouse was hovering over the `.showcase-grid` section, being unable to scroll down vertically past it. Alternatively, they experienced stuttering when passing over the section.
**Root Cause:** 
1. **Windows Overflow Trap:** In Windows environments, hovering over a container with `overflow-x: auto` often natively captures the vertical mouse scroll wheel. Because there is no vertical scrolling to perform inside that container, the scroll event is "swallowed", and the page does not scroll down, creating a trapped or stuck feeling.
2. **Animation Thrashing:** As the video cards intersected the viewport, `app.js` scales them up. The CSS utilized `transition: all`, which caused the browser to recalculate heavy UI layers on the fly, physically hanging the browser main thread for a moment.

**Fixes Applied:** 
- **Reverted Wheel Masking:** Removed the previous JavaScript fix so your native vertical scrolling remains pure and un-hijacked.
- **Fixed The Native Scroll Trap:** Added `overflow-y: hidden;` to `.showcase-grid` in `styles.css`. This CSS property instructs the browser that vertical scrolling is unconditionally impossible in this container, cleanly forcing the vertical mouse wheel events to pass continuously to the main document page without getting trapped.
- **Performance Optimization:** Changed `transition: all` on the showcased cards to specific hardware-accelerated target properties (`opacity, filter, transform`) and added `will-change` hints. This ensures the scaling triggers smoothly on your graphics card instead of lagging your CPU.

## DEBUG COMPLETE
Your native vertical scrolling over the horizontal block has been fully restored and optimized.
