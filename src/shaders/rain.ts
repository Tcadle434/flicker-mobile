/**
 * SkSL rain shader — 2D grid-cell rain with 3 parallax layers.
 * Each cell is a unique tile in a scrolling grid. Every cell gets its own
 * random drop position, length, and brightness — no two drops share a track.
 */
export const rainShaderSource = `
uniform float uTime;
uniform float2 uResolution;
uniform float uIntensity;
uniform float uSpeed;
uniform float uAngle;

float hash(float2 p) {
  float h = dot(p, float2(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

float hash2(float2 p) {
  float h = dot(p, float2(269.5, 183.3));
  return fract(sin(h) * 28617.3291);
}

// Single raindrop within a 2D grid cell.
float drop(float2 cellID, float2 cellLocal, float2 cellDim, float seed) {
  float2 id = float2(cellID.x + seed, cellID.y);

  // Should this cell have a drop? ~30% empty
  float density = hash(float2(id.x * 13.0, id.y * 7.0));
  if (density < 0.30) return 0.0;

  // Random X position of drop within cell
  float dropX = hash(id) * cellDim.x;

  // Horizontal mask — soft ~1.5px
  float dx = abs(cellLocal.x - dropX);
  float mask = smoothstep(1.5, 0.0, dx);

  // Drop starts at random Y, extends downward
  float dropY = hash2(id) * cellDim.y * 0.5;
  float dy = cellLocal.y - dropY;

  // Drop length varies 10–35px per cell
  float dropLen = mix(10.0, 35.0, hash(float2(id.y, id.x)));

  // Leading edge: ramps up over first 2px
  float leading = smoothstep(0.0, 2.0, dy);
  // Tail fade: ramps down from 1→0 as dy goes from 0→dropLen
  float tail = 1.0 - smoothstep(0.0, dropLen, dy);

  float alpha = leading * tail;

  // Per-drop brightness
  float brightness = mix(0.5, 1.0, hash2(float2(id.y + 5.0, id.x)));

  return mask * alpha * brightness;
}

float rainLayer(float2 fragCoord, float cellW, float cellH, float speed, float opacity, float seed) {
  float shear = tan(uAngle);
  float vel = speed * uSpeed;

  // Shear for wind angle
  float2 st = fragCoord;
  st.x -= st.y * shear;

  // Scroll the grid downward
  st.y -= uTime * vel;

  // Determine cell
  float2 cellSize = float2(cellW, cellH);
  float2 cellID = floor(st / cellSize);
  float2 cellLocal = st - cellID * cellSize;

  float a = 0.0;

  // Current cell
  a += drop(cellID, cellLocal, cellSize, seed);
  // Cell above — drop tails can cross the boundary
  a += drop(cellID - float2(0.0, 1.0), cellLocal + float2(0.0, cellH), cellSize, seed);

  return a * opacity * uIntensity;
}

half4 main(float2 fragCoord) {
  float a = 0.0;

  // Foreground: tight grid, fast, most visible
  a += rainLayer(fragCoord, 7.0, 45.0, 150.0, 0.55, 0.0);

  // Midground
  a += rainLayer(fragCoord, 11.0, 55.0, 100.0, 0.35, 37.0);

  // Background: wide grid, slow, subtle
  a += rainLayer(fragCoord, 16.0, 70.0, 65.0, 0.22, 71.0);

  a = clamp(a, 0.0, 1.0);
  half3 rainColor = half3(0.75, 0.82, 0.92);
  return half4(rainColor * half(a), half(a));
}
`;
