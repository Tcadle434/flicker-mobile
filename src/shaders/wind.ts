/**
 * SkSL wind wisps shader — soft translucent streaks drifting horizontally.
 * 3 layers at different speeds for parallax depth.
 */
export const windShaderSource = `
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

// A single wisp: elongated horizontal streak with a gentle sine curve
float singleWisp(float2 cellID, float2 fragPos, float2 cellOrigin, float2 cellDim,
                 float seed, float lengthMin, float lengthMax,
                 float thicknessMin, float thicknessMax, float opacity) {
  float2 id = float2(cellID.x + seed, cellID.y);

  // ~60% cells empty — sparse, occasional wisps
  float density = hash(float2(id.x * 13.0, id.y * 7.0));
  if (density < 0.60) return 0.0;

  // Wisp center position in world space
  float cx = cellOrigin.x + hash(id) * cellDim.x;
  float cy = cellOrigin.y + hash2(id) * cellDim.y;

  // Wisp length and thickness
  float wispLen = mix(lengthMin, lengthMax, hash3(id));
  float thickness = mix(thicknessMin, thicknessMax, hash(float2(id.y + 3.0, id.x + 7.0)));

  // Slight angle variation per wisp (-8 to +8 degrees)
  float tilt = (hash2(float2(id.x + 11.0, id.y + 5.0)) - 0.5) * 0.28;

  // Rotate fragment relative to wisp center
  float cs = cos(tilt);
  float sn = sin(tilt);
  float2 delta = fragPos - float2(cx, cy);
  float lx = delta.x * cs + delta.y * sn;   // along wisp
  float ly = -delta.x * sn + delta.y * cs;  // perpendicular

  // Sine curve — wisp isn't a straight line, it undulates softly
  float waveFreq = 0.04 + hash3(float2(id.x + 1.0, id.y + 2.0)) * 0.03;
  float waveAmp = thickness * 2.5;
  float t = uTime * uSpeed;
  float wavePhase = hash(float2(id.y + 9.0, id.x + 13.0)) * 6.2832;
  ly -= sin(lx * waveFreq + t * 1.5 + wavePhase) * waveAmp;

  // Horizontal extent: very gradual taper at both ends
  float halfLen = wispLen * 0.5;
  float xFade = smoothstep(halfLen, halfLen * 0.3, abs(lx));

  // Vertical (thickness) falloff: wider gaussian for softer, more diffuse edges
  float yFade = exp(-ly * ly / (thickness * thickness * 2.0));

  // Per-wisp lifecycle fade — wisps slowly breathe in and out
  float lifePhase = hash2(float2(id.x + 17.0, id.y + 23.0)) * 6.2832;
  float lifeFreq = 0.08 + hash3(float2(id.y + 7.0, id.x + 3.0)) * 0.10;
  float life = sin(t * lifeFreq + lifePhase) * 0.5 + 0.5;
  // Steeper smoothstep so wisps spend more time fully invisible
  life = smoothstep(0.3, 0.7, life);

  return xFade * yFade * life * opacity * uIntensity;
}

// Sample 3x3 neighborhood to avoid edge clipping
float windLayer(float2 fragCoord, float2 cellDim, float driftSpeed,
                float lengthMin, float lengthMax,
                float thicknessMin, float thicknessMax,
                float opacity, float seed) {
  float vel = driftSpeed * uSpeed;

  // Scroll horizontally
  float2 st = fragCoord;
  st.x -= uTime * vel;
  // Slight vertical drift so wisps aren't perfectly horizontal
  st.y += uTime * vel * 0.05;

  float2 cellID = floor(st / cellDim);
  float a = 0.0;

  for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
    for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
      float2 nID = cellID + float2(dx, dy);
      float2 nOrigin = nID * cellDim;
      a += singleWisp(nID, st, nOrigin, cellDim, seed,
                      lengthMin, lengthMax, thicknessMin, thicknessMax, opacity);
    }
  }

  return a;
}

half4 main(float2 fragCoord) {
  float a = 0.0;

  // Foreground: longer, thicker, faster — but sparse
  a += windLayer(fragCoord, float2(200.0, 90.0), 65.0,
                 60.0, 120.0, 2.5, 4.0, 0.35, 0.0);

  // Midground
  a += windLayer(fragCoord, float2(240.0, 100.0), 45.0,
                 45.0, 90.0, 2.0, 3.0, 0.22, 37.0);

  // Background: shortest, thinnest, slowest
  a += windLayer(fragCoord, float2(280.0, 120.0), 28.0,
                 30.0, 60.0, 1.5, 2.5, 0.15, 71.0);

  a = clamp(a, 0.0, 1.0);

  // Soft white with a very slight cool tint
  half3 col = half3(0.90, 0.93, 0.97);

  return half4(col * half(a), half(a));
}
`;
