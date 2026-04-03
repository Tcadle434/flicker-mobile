/**
 * SkSL fireflies shader — warm glowing dots that drift lazily and pulse.
 * 2 layers (foreground + background) for parallax depth.
 */
export const firefliesShaderSource = `
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

float hash3(float2 p) {
  float h = dot(p, float2(419.2, 371.9));
  return fract(sin(h) * 51367.1173);
}

// Evaluate a single firefly from a given cell at an arbitrary point
float singleFirefly(float2 cellID, float2 fragPos, float2 cellOrigin, float2 cellDim,
                    float seed, float glowMin, float glowMax,
                    float driftSpeed, float brightnessScale) {
  float2 id = float2(cellID.x + seed, cellID.y);

  // ~40% of cells are empty for natural sparsity
  float density = hash(float2(id.x * 13.0, id.y * 7.0));
  if (density < 0.40) return 0.0;

  // Firefly resting position in world space
  float baseX = cellOrigin.x + hash(id) * cellDim.x;
  float baseY = cellOrigin.y + hash2(id) * cellDim.y;

  // Gentle drift via sine waves
  float phaseX = hash3(id) * 6.2832;
  float phaseY = hash(float2(id.y, id.x + 3.0)) * 6.2832;
  float freqX = 0.3 + hash2(float2(id.x + 7.0, id.y)) * 0.5;
  float freqY = 0.2 + hash3(float2(id.y + 11.0, id.x)) * 0.4;

  float t = uTime * driftSpeed * uSpeed;
  float driftX = sin(t * freqX + phaseX) * cellDim.x * 0.3;
  float driftY = sin(t * freqY + phaseY) * cellDim.y * 0.25;

  float2 pos = float2(baseX + driftX, baseY + driftY);
  float dist = length(fragPos - pos);

  // Glow radius varies per firefly
  float radius = mix(glowMin, glowMax, hash(float2(id.y + 1.0, id.x + 2.0)));

  // Soft radial falloff
  float glow = exp(-dist * dist / (radius * radius));

  // Pulse on/off
  float pulsePhase = hash2(float2(id.x + 5.0, id.y + 9.0)) * 6.2832;
  float pulseFreq = 0.4 + hash3(float2(id.x + 13.0, id.y + 17.0)) * 0.8;
  float pulse = sin(t * pulseFreq + pulsePhase);
  pulse = pulse * 0.5 + 0.5;
  pulse = pulse * pulse;

  return glow * pulse * brightnessScale * uIntensity;
}

// Sample 3x3 neighborhood so glows are never clipped at cell edges
float fireflyLayer(float2 fragCoord, float2 cellDim, float seed,
                   float glowMin, float glowMax,
                   float driftSpeed, float brightnessScale) {
  float2 cellID = floor(fragCoord / cellDim);
  float a = 0.0;

  for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
    for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
      float2 nID = cellID + float2(dx, dy);
      float2 nOrigin = nID * cellDim;
      a += singleFirefly(nID, fragCoord, nOrigin, cellDim, seed,
                         glowMin, glowMax, driftSpeed, brightnessScale);
    }
  }

  return a;
}

half4 main(float2 fragCoord) {
  float a = 0.0;

  // Foreground: larger, brighter, faster drift
  a += fireflyLayer(fragCoord, float2(50.0, 50.0), 0.0,
                    4.0, 8.0, 1.0, 1.2);

  // Background: smaller, dimmer, slower drift
  a += fireflyLayer(fragCoord, float2(65.0, 65.0), 37.0,
                    3.0, 5.0, 0.5, 0.6);

  a = clamp(a, 0.0, 1.0);

  // Color: warm yellow-green blend per firefly cell
  float colorMix = hash(floor(fragCoord / float2(50.0, 50.0)));
  half3 warmYellow = half3(0.95, 0.90, 0.40);
  half3 warmGreen = half3(0.70, 0.95, 0.35);
  half3 col = mix(warmYellow, warmGreen, half(colorMix));

  return half4(col * half(a), half(a));
}
`;
