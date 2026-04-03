/**
 * SkSL snow shader — delicate, wandering snowflakes like Google AI Studio.
 * Uses the fireflies pattern: each flake has unique sine-wave drift on both axes
 * for organic, swirling motion with a gentle net downward fall.
 * 3 parallax layers for depth.
 */
export const snowShaderSource = `
uniform float uTime;
uniform float2 uResolution;
uniform float uIntensity;
uniform float uSpeed;

float hash(float2 p) {
  float h = dot(p, float2(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

float hash2(float2 p) {
  float h = dot(p, float2(269.5, 183.3));
  return fract(sin(h) * 28617.3291);
}

float hash3(float2 p) {
  float h = dot(p, float2(419.2, 371.9));
  return fract(sin(h) * 51367.1173);
}

float hash4(float2 p) {
  float h = dot(p, float2(571.3, 223.1));
  return fract(sin(h) * 37159.8473);
}

// Single snowflake evaluated from a given cell
float singleFlake(float2 cellID, float2 fragPos, float2 cellOrigin, float2 cellDim,
                  float seed, float radiusMin, float radiusMax,
                  float driftSpeed, float brightnessScale) {
  float2 id = float2(cellID.x + seed, cellID.y);

  // ~30% of cells empty
  float density = hash(float2(id.x * 13.0, id.y * 7.0));
  if (density < 0.30) return 0.0;

  // Flake resting position in world space
  float baseX = cellOrigin.x + hash(id) * cellDim.x;
  float baseY = cellOrigin.y + hash2(id) * cellDim.y;

  // --- Swirling drift via multiple sine waves (organic, random wandering) ---
  float phaseX1 = hash3(id) * 6.2832;
  float phaseX2 = hash(float2(id.y + 3.0, id.x + 7.0)) * 6.2832;

  // Each flake gets unique frequencies so they don't move in sync
  float freqX1 = 0.15 + hash2(float2(id.x + 7.0, id.y)) * 0.25;
  float freqX2 = 0.35 + hash3(float2(id.y + 11.0, id.x)) * 0.3;

  float t = uTime * driftSpeed * uSpeed;

  // Sum of 2 sine waves on X → organic horizontal swirl
  float driftX = sin(t * freqX1 + phaseX1) * cellDim.x * 0.35
               + sin(t * freqX2 + phaseX2) * cellDim.x * 0.2;

  float2 pos = float2(baseX + driftX, baseY);
  float dist = length(fragPos - pos);

  // Per-flake radius — small, delicate dots
  float radius = mix(radiusMin, radiusMax, hash(float2(id.y + 1.0, id.x + 2.0)));

  // Soft circular glow
  float glow = exp(-dist * dist / (radius * radius));

  // Gentle twinkle — very subtle brightness pulse
  float twinklePhase = hash2(float2(id.x + 5.0, id.y + 9.0)) * 6.2832;
  float twinkleFreq = 0.3 + hash3(float2(id.x + 13.0, id.y + 17.0)) * 0.5;
  float twinkle = sin(t * twinkleFreq + twinklePhase) * 0.15 + 0.85;

  return glow * twinkle * brightnessScale * uIntensity;
}

// Sample 3x3 neighborhood so glow isn't clipped at cell edges
// Grid scrolls downward for steady falling; per-flake sine for swirl
float snowLayer(float2 fragCoord, float2 cellDim, float fallSpeed,
                float seed, float radiusMin, float radiusMax,
                float driftSpeed, float brightnessScale) {
  float vel = fallSpeed * uSpeed;

  // Scroll grid downward — this is the actual falling motion
  float2 st = fragCoord;
  st.y -= uTime * vel;

  float2 cellID = floor(st / cellDim);
  float a = 0.0;

  for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
    for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
      float2 nID = cellID + float2(dx, dy);
      float2 nOrigin = nID * cellDim;
      a += singleFlake(nID, st, nOrigin, cellDim, seed,
                       radiusMin, radiusMax, driftSpeed, brightnessScale);
    }
  }

  return a;
}

half4 main(float2 fragCoord) {
  float a = 0.0;

  // Foreground: slightly larger, faster fall, more swirl
  a += snowLayer(fragCoord, float2(55.0, 55.0), 28.0,
                 0.0, 1.5, 3.0, 0.8, 0.7);

  // Midground
  a += snowLayer(fragCoord, float2(70.0, 70.0), 18.0,
                 37.0, 1.0, 2.0, 0.5, 0.45);

  // Background: tiny, slowest fall, faint
  a += snowLayer(fragCoord, float2(85.0, 85.0), 12.0,
                 71.0, 0.8, 1.5, 0.3, 0.3);

  a = clamp(a, 0.0, 1.0);

  // Pure white, very clean
  half3 snowColor = half3(0.95, 0.96, 0.98);
  return half4(snowColor * half(a), half(a));
}
`;
