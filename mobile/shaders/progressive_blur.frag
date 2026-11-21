// A blur that is strongest at the top and fades to nothing further down, in one pass, for the
// top of the library (used as a backdrop filter: Flutter fills in uSize and uTexture).
#version 460 core

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uFull;   // full blur above this y (physical pixels)
uniform float uEnd;    // no blur below this y
uniform float uRadius; // radius of the full blur (physical pixels)
uniform sampler2D uTexture;

out vec4 fragColor;

const int TAPS = 40;
const float GOLDEN = 2.39996323;

void main() {
  vec2 p = FlutterFragCoord().xy;
  // Eases out slowly: most of the fade is a gentle tail, so there is no visible edge
  float t = clamp((uEnd - p.y) / max(uEnd - uFull, 1.0), 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  // Strong enough at the top to smooth away the thin gaps between photos, and easing to zero so
  // it ends without an edge
  float r = uRadius * t;
  if (r < 0.75) {
    fragColor = texture(uTexture, p / uSize);
    return;
  }
  // Samples spread over a disk on a golden-angle spiral, weighted like a gaussian
  vec4 sum = vec4(0.0);
  float total = 0.0;
  // A different turn of the spiral for every pixel: the sampling pattern becomes fine grain
  // instead of blotches and streaks
  float spin = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831853;
  float sigma = r * 0.5;
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i) + 0.5;
    float d = sqrt(fi / float(TAPS)) * r;
    float a = fi * GOLDEN + spin;
    vec2 o = vec2(cos(a), sin(a)) * d;
    float w = exp(-(d * d) / (2.0 * sigma * sigma));
    sum += texture(uTexture, clamp((p + o) / uSize, 0.0, 1.0)) * w;
    total += w;
  }
  fragColor = sum / total;
}
