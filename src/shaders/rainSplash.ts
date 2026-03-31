/**
 * SkSL rain splash shader — ground-level expanding ripple rings.
 *
 * Grid of cells across the ground area. Each cell spawns a splash
 * on a staggered loop: a small ring expands outward while fading.
 * Two concentric rings per splash for a realistic ripple look.
 */
export const rainSplashShaderSource = `
uniform float uTime;
uniform float2 uResolution;
uniform float uIntensity;
uniform float uGroundTop;

float hash(float2 p) {
  float h = dot(p, float2(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

float hash2(float2 p) {
  float h = dot(p, float2(269.5, 183.3));
  return fract(sin(h) * 28617.3291);
}

// Single expanding ring at center, with given radius and thickness
float ring(float2 pos, float2 center, float radius, float thickness) {
  float d = length(pos - center);
  return smoothstep(thickness, 0.0, abs(d - radius));
}

// Splash at a grid cell: two concentric expanding rings
float splash(float2 fragCoord, float2 cellID, float2 cellSize) {
  // Random position within cell
  float px = hash(cellID) * cellSize.x;
  float py = hash2(cellID) * cellSize.y;
  float2 center = cellID * cellSize + float2(px, py);

  // Staggered cycle period (0.7–1.3s per cell)
  float period = mix(0.7, 1.3, hash(cellID * 3.7));

  // Time offset so all cells don't sync
  float offset = hash(cellID * 5.3) * period;

  // Current phase in cycle [0, 1]
  float t = fract((uTime + offset) / period);

  // Max radius for this splash
  float maxR = mix(3.0, 6.0, hash2(cellID * 2.1));

  // Outer ring: expands full range, fades across lifecycle
  float r1 = t * maxR;
  float alpha1 = (1.0 - t) * 0.4;
  float ring1 = ring(fragCoord, center, r1, 0.8) * alpha1;

  // Inner ring: expands slower, slightly delayed
  float t2 = max(0.0, t - 0.15) / 0.85;
  float r2 = t2 * maxR * 0.6;
  float alpha2 = (1.0 - t2) * 0.25;
  float ring2 = ring(fragCoord, center, r2, 0.6) * alpha2;

  // Density: ~60% of cells have splashes
  float density = hash(cellID * 11.0);
  if (density < 0.4) return 0.0;

  return (ring1 + ring2);
}

half4 main(float2 fragCoord) {
  if (fragCoord.y < uGroundTop) return half4(0.0);

  float a = 0.0;

  // Grid of splash cells
  float2 cellSize = float2(20.0, 18.0);
  float2 cellID = floor(fragCoord / cellSize);
  a += splash(fragCoord, cellID, cellSize);

  // Second offset grid for more density without visible grid pattern
  float2 offset2 = float2(10.0, 9.0);
  float2 cellID2 = floor((fragCoord + offset2) / cellSize);
  a += splash(fragCoord, cellID2 + float2(100.0, 100.0), cellSize);

  a = clamp(a * uIntensity, 0.0, 1.0);
  half3 splashColor = half3(0.7, 0.78, 0.88);
  return half4(splashColor * half(a), half(a));
}
`;
