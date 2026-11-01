/* ============================================================================
   SHADERS — GLSL ES 3.00 (WebGL2)

   Three passes:
     1. GRADIENT  -> renders the living mesh-gradient blob into a texture
     2. BLUR      -> separable gaussian, ping-ponged, to make the diffused copy
     3. COMPOSITE -> the optical circle: lens refraction, blur-inside-the-circle,
                     translucent veil, eclipse corona, hairline, grid, dither
   ========================================================================= */

/* Shared vertex shader — draws one full-screen triangle. */
const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/* 3D simplex noise (Ashima / Stefan Gustavson). Used for domain warping. */
const NOISE = `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

/* ---------------------------------------------------------------- PASS 1 ---
   The living mesh gradient.

   Every colour pole is a soft gaussian lump. The colour at any point is the
   weighted AVERAGE of the pole colours (weights = their falloffs), which is
   what makes it melt like a mesh gradient instead of stacking like layers.
   The same weights summed give the metaball field, which becomes the organic
   silhouette. The sample point is domain-warped by two octaves of simplex
   noise so the outline is irregular and slowly kneads itself.

   Output is PREMULTIPLIED (rgb*coverage, coverage) so that blurring it later
   does not drag colour in from the empty areas.
---------------------------------------------------------------------------- */
const FRAG_GRADIENT = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uAspect;

#define NPOLES __NPOLES__
// Pole positions, radii and colours are computed on the CPU each frame (orbits and
// breathing are constant across the screen, so evaluating them per pixel was pure
// waste). Two position sets: the silhouette barely moves, the colour poles orbit.
uniform vec2  uShapePos[NPOLES];
uniform vec2  uColorPos[NPOLES];
uniform float uPoleRad[NPOLES];
uniform vec3  uPoleCol[NPOLES];

uniform float uScale, uOffX, uOffY;
uniform float uShapeWarpAmp, uShapeWarpFreq, uShapeWarpSpeed;
uniform float uColorWarpAmp, uColorWarpFreq, uColorWarpSpeed;
uniform float uEdgeGain, uEdgeShape, uFalloff, uColorFalloff;
uniform vec2  uStretchDir;    // unit vector from the halo toward the pointer
uniform float uStretchAmt;    // 0 at rest

/* local cursor interaction — a soft field response, not a moving blob.
   uCurAmt is 0 at rest, so this costs nothing when unused. */
uniform vec2  uCurPos;
uniform float uCurAmt, uCurRadius, uCurWarp, uCurSat, uCurSpread;
uniform float uCurHue;   // degrees of temperature shift under the pointer
uniform float uFloorAt, uFloorSoft;   // p-space y below which the field is solid

${NOISE}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 sc = vec2(uv.x, 1.0 - uv.y);              // screen coords, y down
  vec2 p  = (sc - 0.5) * vec2(uAspect, 1.0);     // p-space
  p = (p - vec2(uOffX, uOffY)) / max(uScale, 0.001);

  // Elongate the halo along the direction of the pointer. Splitting p into
  // components along and across that direction and easing only the along
  // component stretches the shape without skewing it, so it reads as reaching
  // toward the cursor rather than sliding after it.
  if (uStretchAmt > 0.0001) {
    float along = dot(p, uStretchDir);
    vec2  perp  = p - along * uStretchDir;
    p = perp + uStretchDir * (along / (1.0 + uStretchAmt));
  }

  float t = uTime;

  // --- TWO independent domain warps ---------------------------------------
  // The silhouette gets a calm, slow one so the outline stays stable. The colour
  // field gets a larger, faster one of its own. Decoupling them is what makes the
  // colours swirl INSIDE the shape instead of the whole thing sliding around.
  vec2 ws;
  ws.x = snoise(vec3(p * uShapeWarpFreq,              t * uShapeWarpSpeed));
  ws.y = snoise(vec3(p * uShapeWarpFreq + 31.4,       t * uShapeWarpSpeed * 0.87 + 7.7));
  ws  += 0.32 * vec2(
        snoise(vec3(p * uShapeWarpFreq * 2.31 + 5.2,  t * uShapeWarpSpeed * 0.63 + 11.0)),
        snoise(vec3(p * uShapeWarpFreq * 2.31 - 2.7,  t * uShapeWarpSpeed * 0.51 + 3.0)));
  vec2 pShape = p + ws * uShapeWarpAmp;

  vec2 wc;
  wc.x = snoise(vec3(p * uColorWarpFreq + 12.9,       t * uColorWarpSpeed + 40.0));
  wc.y = snoise(vec3(p * uColorWarpFreq - 51.3,       t * uColorWarpSpeed * 0.79 + 17.0));
  wc  += 0.40 * vec2(
        snoise(vec3(p * uColorWarpFreq * 1.93 + 63.0, t * uColorWarpSpeed * 0.57 + 5.0)),
        snoise(vec3(p * uColorWarpFreq * 1.93 - 8.4,  t * uColorWarpSpeed * 0.44 + 29.0)));
  vec2 pColor = p + wc * uColorWarpAmp;

  // How strongly the cursor is felt here. A wide gaussian, so there is no
  // cursor-shaped edge anywhere — just a region of the field that responds.
  float cur = 0.0;
  if (uCurAmt > 0.001) {
    vec2  cd = p - uCurPos;
    float cl = length(cd);
    float cn = cl / max(uCurRadius, 1e-4);
    cur = exp(-cn * cn * 1.5) * uCurAmt;
    // draw the colour regions gently toward the cursor: zero exactly under it
    // and at the outer edge, so the field bends rather than following
    pColor -= (cd / max(cl, 1e-5)) * uCurWarp * cur * smoothstep(0.0, 0.5, cn);
  }

  // --- silhouette field ----------------------------------------------------
  float field = 0.0;
  for (int i = 0; i < NPOLES; i++){
    float r = max(uPoleRad[i], 0.001);
    float d = length(pShape - uShapePos[i]) / r;
    field += exp(-d * d * uFalloff);
  }

  // No hard boundary anywhere: this curve (a Weibull CDF) saturates toward 1
  // without a shoulder, and its tail falls off as gently as the gaussians do.
  float cover = 1.0 - exp(-pow(max(field * uEdgeGain * (1.0 + uCurSpread * cur), 0.0), uEdgeShape));

  // --- the mass below ------------------------------------------------------
  // The poles alone make a DISC, which is fine for a blob floating in space but
  // wrong for the Work gradient: there it is meant to read as the crown of a much
  // larger mass continuing below the viewport. Without this the disc's own bottom
  // and sides are visible, and the canvas edge slices its bottom into a straight
  // horizontal line. Below uFloorAt the coverage saturates to 1 across the full
  // width, so the crown arcs over a field that simply continues downward.
  // uFloorSoft <= 0 disables it entirely, which is how the hero and halo blobs —
  // which really are discs — opt out.
  if (uFloorSoft > 0.0) {
    cover = max(cover, smoothstep(uFloorAt - uFloorSoft, uFloorAt + uFloorSoft, pShape.y));
  }

  // --- colour field --------------------------------------------------------
  // Weighted average of the pole colours. uColorFalloff is separate from the
  // silhouette falloff on purpose: raising it keeps each colour core distinct
  // instead of everything averaging into one flat tone.
  vec3  acc  = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < NPOLES; i++){
    float r = max(uPoleRad[i], 0.001);
    float d = length(pColor - uColorPos[i]) / r;
    float w = exp(-d * d * uColorFalloff);
    acc  += uPoleCol[i] * w;
    wsum += w;
  }
  vec3 col = max(acc / max(wsum, 1e-5), vec3(0.0));

  // Richer where the cursor is, and the temperature shifts a few degrees with it.
  // uCurHue is deliberately tiny (single-digit degrees): enough to feel the tone
  // move cooler or warmer under the pointer, never enough to leave the palette.
  if (cur > 0.0) {
    float cl2 = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(cl2), col, 1.0 + uCurSat * cur);
    col = max(col, vec3(0.0));

    if (uCurHue != 0.0) {
      float a = radians(uCurHue * cur);
      float cs = cos(a), sn = sin(a);
      // luma-preserving hue rotation, so only the temperature moves — not the
      // brightness. Rotating in RGB like this avoids an HSV round trip and the
      // hue wrap that comes with it.
      vec3 rr = vec3(0.213 + cs*0.787 - sn*0.213,
                     0.715 - cs*0.715 - sn*0.715,
                     0.072 - cs*0.072 + sn*0.928);
      vec3 gg = vec3(0.213 - cs*0.213 + sn*0.143,
                     0.715 + cs*0.285 + sn*0.140,
                     0.072 - cs*0.072 - sn*0.283);
      vec3 bb = vec3(0.213 - cs*0.213 - sn*0.787,
                     0.715 - cs*0.715 + sn*0.715,
                     0.072 + cs*0.928 + sn*0.072);
      col = max(vec3(dot(col, rr), dot(col, gg), dot(col, bb)), vec3(0.0));
    }
  }

  fragColor = vec4(col * cover, cover);          // premultiplied
}`;

/* ---------------------------------------------------------------- PASS 2 ---
   Separable gaussian, 9 taps using hardware linear filtering (so 9 texture
   reads cover 17 texels). Run several times with a growing step to reach a
   very wide, very smooth blur cheaply.
---------------------------------------------------------------------------- */
const FRAG_BLUR = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uDir;      // (step,0) or (0,step), in texels

const float O[3] = float[3](0.0, 1.3846153846, 3.2307692308);
const float W[3] = float[3](0.2270270270, 0.3162162162, 0.0702702703);

void main(){
  vec2 uv  = gl_FragCoord.xy / uRes;
  vec2 tex = uDir / uRes;
  vec4 c = texture(uTex, uv) * W[0];
  c += texture(uTex, uv + tex * O[1]) * W[1];
  c += texture(uTex, uv - tex * O[1]) * W[1];
  c += texture(uTex, uv + tex * O[2]) * W[2];
  c += texture(uTex, uv - tex * O[2]) * W[2];
  fragColor = c;
}`;

/* ---------------------------------------------------------------- PASS 3 ---
   The optical circle. Order of operations matters here:

     1. work out the refraction offset (idle rim lens + pointer lens)
     2. sample the SHARP and the DIFFUSED gradient through that offset
     3. cross-fade to diffused strictly inside the circle SDF
     4. lay the translucent veil over the same region
     5. ADD the corona, but only where the blurred blob actually has coverage
        near the rim — so the glow appears on one side of the circle, not as
        a ring around the whole thing
     6. hairline rim, then the grid as a multiply on top of everything
     7. triangular dither, because big soft gradients band horribly at 8-bit
---------------------------------------------------------------------------- */
const FRAG_COMPOSITE = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform sampler2D uSharp;
uniform sampler2D uSoft;

uniform vec2  uRes;        // device px
uniform vec2  uCssRes;     // css px
uniform float uAspect;
uniform float uTime;
uniform vec3  uBg;

uniform vec2  uCircleC;    // p-space
uniform float uCircleR;
uniform float uBlurMix, uVeilAlpha, uStrokeAlpha, uStrokeMul, uStrokePx;
uniform vec3  uVeilCol;

uniform float uRefract, uRefractFalloff;

uniform vec2  uPtr;        // p-space, smoothed
uniform float uPtrActive;  // 0..1, eases out when the pointer leaves
uniform float uPtrRadius, uPtrStrength, uPtrBlur, uPtrLift;

// the big soft lens — separately and much more slowly eased than uPtr
uniform vec2  uLensPos;
uniform float uLensActive;
uniform float uLensRadius, uLensStrength, uLensPull, uLensBlur, uLensLift, uLensFeather;

uniform float uCoronaInt, uCoronaSpread, uCoronaOuter, uCoronaOuterW;
uniform float uCoronaBias, uCoronaSat, uCoronaGamma;

uniform float uSmearInt, uSmearRadius, uSmearReach, uSmearRimWidth, uSmearSat;
uniform int   uSmearTaps;

/* page-load intro */
uniform float uCircleDraw;   // 0..1, stroke traced clockwise from 12 o'clock
uniform float uStrokeDrawMul; // how dark the stroke is WHILE being traced
uniform float uCircleFill;   // 0..1, the optical treatment coming in behind it
uniform float uHaloFade;     // 0..1

uniform float uGridMargin, uGridAlpha, uGridWidth;  // css px
uniform int   uGridCols;

uniform float uDither;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 sc = vec2(uv.x, 1.0 - uv.y);
  vec2 p  = (sc - 0.5) * vec2(uAspect, 1.0);

  // one device pixel, expressed in p-space — used for anti-aliasing widths
  float px = 1.0 / uRes.y;

  // ------------------------------------------------ circle signed distance
  vec2  cp = p - uCircleC;
  float r  = length(cp);
  float d  = r - uCircleR;               // < 0 inside
  vec2  n  = cp / max(r, 1e-5);

  // ------------------------------------------------ 1. refraction offsets
  // Idle lens: zero at the centre, ramps hard toward the rim. This is what
  // makes it read as a thick piece of glass rather than a masked blur.
  float rn   = clamp(r / max(uCircleR, 1e-5), 0.0, 1.0);
  float lens = pow(rn, uRefractFalloff);
  float insideHard = step(d, 0.0);
  vec2  refr = -n * uRefract * lens * insideHard * uCircleFill;

  // Pointer lens: a soft travelling bulge. Zero exactly under the cursor and
  // at its outer edge, peaking in between — so it pushes the gradient around
  // rather than dragging it along with the mouse.
  vec2  mv  = p - uPtr;
  float md  = length(mv);
  float mn  = md / max(uPtrRadius, 1e-5);
  float mw  = exp(-mn * mn * 2.2) * uPtrActive;
  vec2  mdir = mv / max(md, 1e-5);
  refr += mdir * uPtrStrength * mw * smoothstep(0.0, 0.45, mn);

  // ---- THE BIG LENS ------------------------------------------------------
  // A genuine optical displacement of the gradient underneath, not an overlay.
  // The profile t*(1-t^2)^2 is zero at the centre, zero at the outer edge and
  // smooth throughout, so there is no ring, no ripple and nothing whose shape
  // betrays the cursor position — just a wide, soft swell that the gradient
  // bends around. It is gated to the circle but feathered across the rim, and
  // its position is eased far more slowly than the cursor itself.
  vec2  lv = p - uLensPos;
  float ld = length(lv);
  float lt = clamp(ld / max(uLensRadius, 1e-5), 0.0, 1.0);
  float lprof = lt * pow(1.0 - lt * lt, 2.0) * 6.75;     // peaks ~1.0 near lt=0.45
  float lgate = smoothstep(uLensFeather, -uLensFeather, d);  // soft across the rim
  float lw = lprof * lgate * uLensActive;
  vec2  ldir = lv / max(ld, 1e-5);
  refr += ldir * uLensStrength * uLensPull * lw;

  vec2 duv = vec2(refr.x / uAspect, -refr.y);   // p-space -> uv (y is flipped)

  // ------------------------------------------------ 2. sample both versions
  vec4 gs = texture(uSharp, uv + duv) * uHaloFade;   // premultiplied, so this is a fade
  vec4 gb = texture(uSoft,  uv + duv) * uHaloFade;

  // ------------------------------------------------ 3. blur inside the circle
  float aa     = max(px * 1.2, 1e-5);
  float inside = 1.0 - smoothstep(-aa, aa, d);        // precise circular edge
  // the blur follows the displacement, so the whole thing moves as one optical
  // event rather than a sharp overlay sliding over a static blur
  float mixAmt = clamp((uBlurMix * inside + uPtrBlur * mw + uLensBlur * lw) * uCircleFill, 0.0, 1.0);

  vec4 g = mix(gs, gb, mixAmt);
  vec3 col = uBg * (1.0 - g.a) + g.rgb;               // premultiplied over bg

  // ------------------------------------------------ 4. translucent veil
  col = mix(col, uVeilCol, inside * uVeilAlpha * uCircleFill);

  // slight local lift under the pointer, like a highlight rolling over glass
  col += uPtrLift * mw * inside;
  col += uLensLift * lw;

  // ------------------------------------------------ 5. eclipse corona
  // Sample the diffused blob AT THE RIM so the glow inherits whatever colour
  // happens to be behind that part of the edge, and is absent everywhere the
  // blob is not.
  //
  // * uHaloFade, for the same reason gs/gb carry it above: this is a SECOND,
  // independent sample of the gradient, so without the fade the corona ignored
  // the intro entirely and burned at full strength from the very first frame --
  // a ring of light hanging in empty space before the circle it belongs to had
  // been traced, and before the gradient lighting it was even visible. The
  // texture is premultiplied, so this scales rim.a (the energy gate) while
  // rim.rgb/rim.a leaves the glow's COLOUR untouched: it fades up in intensity
  // without washing out through grey on the way in.
  vec2 rimUv = uv + duv - vec2(n.x / uAspect, -n.y) * (d * 0.65);
  vec4 rim   = texture(uSoft, rimUv) * uHaloFade;

  float dd      = d + uCoronaBias;
  float sIn     = max(uCoronaSpread, 1e-4);
  float sOut    = sIn * max(uCoronaOuter, 1.0);
  float ringIn  = exp(-(dd * dd) / (sIn  * sIn));
  float ringOut = exp(-(dd * dd) / (sOut * sOut)) * uCoronaOuterW;
  float ring    = ringIn + ringOut;

  vec3  rimCol = rim.rgb / max(rim.a, 1e-4);          // un-premultiply
  float rimLum = dot(rimCol, vec3(0.2126, 0.7152, 0.0722));
  vec3  glowCol = mix(vec3(rimLum), rimCol, uCoronaSat);

  // gate by coverage AND by how hot it is, so only the dense part of the blob
  // lights the edge up
  float energy = pow(clamp(rim.a, 0.0, 1.0), uCoronaGamma);
  col += max(glowCol, vec3(0.0)) * ring * energy * uCoronaInt;

  // ------------------------------------------------ 5b. cursor smear
  // The SDFLensBlur treatment. Light living near the circle's rim is gathered
  // along the line running from this pixel toward the cursor, so it stretches
  // into a wing that wraps the contour. Gated by rim proximity (not by the
  // cursor alone) which is why it hugs the edge instead of being a round blob.
  //
  // Note this is driven purely by pointer POSITION — measured off the reference,
  // the smear is exactly as bright when the cursor is still as when it races.
  if (uSmearInt > 0.0 && uPtrActive > 0.001) {
    vec2  toC  = uPtr - p;
    float dC   = length(toC);
    float prox = exp(-(dC * dC) / max(uSmearRadius * uSmearRadius, 1e-5));
    if (prox > 0.002) {
      vec3  sacc = vec3(0.0);
      float swsum = 0.0;
      for (int i = 0; i < 24; i++) {
        if (i >= uSmearTaps) break;
        float f  = (float(i) + 0.5) / float(uSmearTaps);
        vec2  sp = p + toC * f * uSmearReach;            // march toward the cursor
        vec2  su = vec2(sp.x / uAspect + 0.5, 0.5 - sp.y);
        vec4  sg = texture(uSoft, su) * uHaloFade;   // same gate as the corona
        float sd = length(sp - uCircleC) - uCircleR;     // distance to the rim there
        float rw = exp(-(sd * sd) / max(uSmearRimWidth * uSmearRimWidth, 1e-5));
        float w  = 1.0 - f;                              // taper toward the cursor
        sacc  += sg.rgb * rw * w;
        swsum += w;
      }
      vec3 sm = sacc / max(swsum, 1e-4);
      float sl = dot(sm, vec3(0.2126, 0.7152, 0.0722));
      sm = mix(vec3(sl), sm, uSmearSat);
      col += max(sm, vec3(0.0)) * uSmearInt * prox * uPtrActive;
    }
  }

  // ------------------------------------------------ 6. hairline + grid
  float sw     = max(uStrokePx * px * (uRes.y / uCssRes.y), px);
  float stroke = 1.0 - smoothstep(0.0, sw * 1.5, abs(d));

  // Trace the rim clockwise from 12 o'clock. atan(cp.x, -cp.y) is 0 at the top and
  // increases clockwise, so normalising it to 0..1 gives the fraction drawn.
  float ang = atan(cp.x, -cp.y) * 0.1591549;
  if (ang < 0.0) ang += 1.0;
  float drawn = max(smoothstep(uCircleDraw, uCircleDraw - 0.035, ang),
                    step(1.0, uCircleDraw));
  // darker while it is being traced, easing to the resting hairline as the
  // optical treatment comes in behind it
  float sMul = mix(uStrokeDrawMul, uStrokeMul, uCircleFill);
  col = mix(col, col * sMul, stroke * uStrokeAlpha * drawn);

  // ------------------------------------------------ 7. dither
  float n1 = hash21(gl_FragCoord.xy + fract(uTime) * 71.3);
  float n2 = hash21(gl_FragCoord.xy + 13.7 + fract(uTime) * 29.1);
  col += (n1 - n2) * (uDither / 255.0);               // triangular PDF

  fragColor = vec4(col, 1.0);
}`;

/* ---------------------------------------------------------------- PASS 3b ---
   Flat composite for the Work section's gradient. No circle, no corona, no
   lens — just the gradient over the background, the same vertical grid drawn
   as a multiply so it continues seamlessly out of the hero, and dither.
---------------------------------------------------------------------------- */
const FRAG_FLAT = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform sampler2D uTex;    // blurred
uniform sampler2D uSharp;  // unblurred, for the local softness change
uniform vec2  uRes, uCssRes;
uniform vec3  uBg;
uniform float uTime, uDither, uAspect;
uniform vec2  uCurPos;
uniform float uCurAmt, uCurRadius, uCurBlur;
uniform float uGridMargin, uGridAlpha, uGridWidth;
uniform int   uGridCols;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 g  = texture(uTex, uv);

  // ease the softness around the interaction point, so the field tightens or
  // loosens where it is touched rather than just changing colour
  if (uCurAmt > 0.001 && abs(uCurBlur) > 0.001) {
    vec2  sc2 = vec2(uv.x, 1.0 - uv.y);
    vec2  pp  = (sc2 - 0.5) * vec2(uAspect, 1.0);
    float cn  = length(pp - uCurPos) / max(uCurRadius, 1e-4);
    float cf  = exp(-cn * cn * 1.5) * uCurAmt;
    g = mix(g, texture(uSharp, uv), clamp(uCurBlur * cf, 0.0, 1.0));
  }

  // Output PREMULTIPLIED and transparent: this canvas spans the whole section, so
  // if it painted the background it would cover the hero as the section scrolls
  // up. Everything it does not draw stays see-through to the page behind.
  vec3  col = g.rgb;
  float alpha = g.a;

  vec2  sc = vec2(uv.x, 1.0 - uv.y);
  float fx = sc.x * uCssRes.x;
  float span  = uCssRes.x - uGridMargin * 2.0;
  float step_ = span / float(max(uGridCols, 1));
  float line = 0.0;
  for (int i = 0; i <= 16; i++){
    if (i > uGridCols) break;
    float lx = uGridMargin + step_ * float(i);
    float hw = uGridWidth * 0.5;
    line = max(line, 1.0 - smoothstep(hw - 0.5, hw + 0.5, abs(fx - lx)));
  }
  // the grid as its own translucent black layer rather than a multiply, so the
  // lines are still drawn where the canvas is otherwise transparent
  float lineA = uGridAlpha * line;
  col   *= (1.0 - lineA);
  alpha  = alpha * (1.0 - lineA) + lineA;

  float n1 = hash21(gl_FragCoord.xy + fract(uTime) * 71.3);
  float n2 = hash21(gl_FragCoord.xy + 13.7 + fract(uTime) * 29.1);
  col += (n1 - n2) * (uDither / 255.0) * alpha;

  fragColor = vec4(col, alpha);
}`;
