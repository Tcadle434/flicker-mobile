export const DEV_RELAX_SESSION_CONFIG = {
  fadeSeconds: 1,
  stillSeconds: 3,
  returnSeconds: 0,
} as const;

export const DEV_RELAX_SESSION_MINUTES =
  DEV_RELAX_SESSION_CONFIG.stillSeconds / 60;
