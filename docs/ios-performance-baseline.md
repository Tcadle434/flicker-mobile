# iOS Performance Baseline

Use a release or TestFlight-equivalent build as the source of truth. Use a dev build only when you need the temporary diagnostics layer.

## Diagnostics Flag

Enable temporary diagnostics in development with:

```bash
EXPO_PUBLIC_PERF_DIAGNOSTICS=1
```

The diagnostics layer logs:
- scene focus/blur and mount/unmount
- render counts for the main hot screens and scenes
- active frame-clock count
- active interval count for session timers and adaptive polling
- active wander timer count
- adaptive loop start/stop/tick
- weather fetch count
- location fetch count
- audio scene transitions

## Manual Scenarios

Record each scenario for 5 minutes on the same physical iPhone:

1. Home idle with audio on
2. Home idle muted
3. Tent idle with audio on
4. Focus session idle with audio on
5. Focus session idle muted
6. Recovery check: complete a session, return home, idle for 5 minutes, confirm adaptive polling stays stopped

## Instruments

Capture these traces for the baseline device:

1. Time Profiler
2. Core Animation
3. Energy Log
4. Metal System Trace

Only run JS-specific profiling if Time Profiler shows the JS thread as a major idle contributor.

## Acceptance Checks

- Home idle does not trigger weather or location fetches.
- Returning home after a completed session leaves adaptive polling stopped.
- Offscreen home, tent, and session scenes report zero active frame clocks.
- Offscreen scenes report zero active wander timers.
- Home, tent, and focus idle energy impact is materially lower than the pre-fix baseline.
