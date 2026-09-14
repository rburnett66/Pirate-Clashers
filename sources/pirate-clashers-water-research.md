# Wheel water: research notes for the Pirate Clashers water prototype

**Status:** research plus a running prototype (`pirate-clashers-wheel-water.html`)
**Scope:** a cartoony water blanket of 64 × 12 points (originally 64 × 16; reduced by the owner, §6.8) drawn as 12 waterlines, driven by a noisy swell, where every point rides an invisible wheel coupled to its neighbors
**Also covers:** a review of the shared shader, afl_ext's "Very fast procedural ocean" (§5)

---

## 1. The short version

The "invisible wheel" idea is well-established physics. It shows up in three separate places:

- **Real water.** Particles under an ocean wave move on circles, and the circles shrink with depth.
- **Mechanics.** Chains of wheels or pendulums tied to their neighbors by springs are textbook systems for traveling waves and solitons.
- **Games.** Height-field water in games is the same coupled lattice under another name.

The key fact that ties them together: **a spring-mounted point is a wheel.** Plot a point's height against its velocity and it traces a circle. So the model is a grid of oscillators. Each one is pulled toward a noisy swell, and each one pulls on its four neighbors. Physicists call this a discrete Klein-Gordon lattice; game developers call it springs with spread. **The wheels move points vertically only** (owner direction). The wheel is the hidden phase of each point, and only its height reaches the screen.

The prototype renders all 16 lines in **one draw call with no vertex buffers**. For where the simulation should run, the honest answer at 64 × 16 is **the CPU, with the shader doing all the drawing**. The GPU path works and is in the prototype for measurement, but at this grid size it costs more than it saves (§7).

---

## 2. Where the wheel idea already exists

### 2.1 Real water particles ride wheels (Gerstner / trochoidal waves)

In Gerstner's wave, published in the early 1800s, every fluid particle travels a circle at constant angular speed. The circle's radius shrinks exponentially with depth. It is still the only known exact closed-form solution of the full nonlinear gravity-wave problem with a non-flat surface. Linear wave theory agrees: in deep water, orbits are circles that decay with depth and are negligible by about half a wavelength down. In shallower water they flatten into ellipses.

Two consequences matter for us:

- **The surface shape comes from the wheel, not from a sine.** A point on a circle gives a trochoid: sharp crests and flat troughs. That is the cartoony profile we want.
- **GPU Gems chapter 1 (Mark Finch, used in *Uru*) chose Gerstner waves for exactly this reason.** Pushing vertices toward each crest sharpens it and concentrates geometry where detail is needed. If the orbit is too large for the wavelength, the curve loops over itself, so steepness needs a cap.

If "16 deep" means rows *below* the surface rather than rows *into* the screen, this is the rule to use: wheel radius ∝ e^(−k·depth). See open question 1.

### 2.2 Wheels tied to neighbors: coupled rotor chains

- **Torsion-pendulum chains (sine-Gordon / Frenkel-Kontorova).** Pendulums hung on a shared wire, each coupled to its neighbors by a torsion spring, are an exact physical build of the discrete sine-Gordon equation. Physics labs build them. Driven and damped, they produce traveling kinks and **discrete breathers**: localized pulses of energy that stay in one place and throb. That behavior would suit big cartoon rogue swells.
- **Local Kuramoto model.** Phase oscillators ("pure wheels") nudge each other through the sine of their phase difference. Chains of these settle into **traveling phase waves**, called twisted states. On a ring with nearest-neighbor coupling, a q-twist is stable when |q| < n/4, so a 64-wide ring supports up to 15 wavelengths. The same math describes metachronal waves in cilia carpets, the rolling wave you see across rows of beating hairs.

The general dispersion relation for this family (the Klein-Gordon chain) is **Ω² = ω₀² + 4ω₁² sin²(k/2)**. ω₀ is each wheel's own natural rate, and ω₁ is the neighbor coupling. Everything in §3 follows from it.

### 2.3 Game water that is this lattice

- **Müller-Fischer, GDC 2008, "Fast Water Simulation for Games Using Height Fields."** The whole "hello world" is two arrays: velocity moves toward the average of four neighbors, velocity is multiplied by 0.99, and height moves by velocity. That is a coupled wheel grid with damping.
- **"Make a Splash With Dynamic 2D Water Effects" (Tuts+, 2012).** A row of vertical Hooke springs, where each spring pulls its neighbors. The neighbor pass repeats eight times for faster spread, and a spread value between 0 and 0.5 tunes it. This is the same on-site spring plus coupling as our model, used for side-view 2D water. It's the closest ancestor of what we're building.
- **Tessendorf, "Interactive Water Surfaces" (iWave).** It replaces the four-neighbor Laplacian with a convolution kernel that gives water-correct dispersion. Obstacles are just a mask grid. It is the upgrade path if splashes need more realistic ripple spreading.
- **Yuksel, House & Keyser, "Wave Particles" (SIGGRAPH 2007).** Waves are carried by particles, and the method is unconditionally stable and fast, with floating-object interaction. It is the natural fit later for ship wakes.
- **Evan Wallace, WebGL Water.** A GPU height-field simulation using a floating-point texture and ping-pong render targets, with caustics from GLSL derivatives. It is the reference for the GPU path in §7. Its original notes say it needed float textures and vertex texture fetch, and at launch only Chrome supported both.

---

## 3. The key insight: a spring is a wheel

Take one point with height h and velocity v, pulled back toward rest by a spring of natural angular frequency ω₀. Plot (h, v/ω₀) and the point goes round a circle. Its **phase angle** is where the point is in its bob, and its **radius** is how much energy it holds. Nothing extra is needed to get wheels; they are already in every spring.

Couple the springs to their neighbors and you have the lattice from §2.2:

```
ḧᵢⱼ = ω₀² (targetᵢⱼ − hᵢⱼ) + cₓ² (hᵢ₋₁ⱼ + hᵢ₊₁ⱼ − 2hᵢⱼ) + c_z² (hᵢⱼ₋₁ + hᵢⱼ₊₁ − 2hᵢⱼ) − damping
```

For art direction, each term has a plain meaning:

| Term | What it looks like on screen |
|---|---|
| **ω₀ (wheel stiffness)** | How tightly each point follows the swell, and how fast a disturbed point rings. Higher gives snappier, busier water. |
| **cₓ (neighbor pull, across)** | How fast energy travels sideways. A cannonball ring spreads at up to about cₓ columns per second. |
| **c_z (neighbor pull, between rows)** | How much the 16 lines drag each other. At 0 every line is independent; high values make the blanket move as one sheet. |
| **Damping** | How long splash rings last. In the prototype it only damps disturbances, not the swell itself (§4). |

**Dispersion is free, and it looks right.** With unit spacing the lattice obeys ω² = ω₀² + 4c² sin²(k/2). Wave groups travel slower than the crests inside them, so crests appear at the back of a group, roll through it, and vanish at the front. Real deep water behaves the same way, with group speed exactly half of crest speed. With the current prototype defaults (ω₀ = 3.5, cₓ = 6, swell length 24), swell-length waves have crest speed ≈ 14.6 columns/s and group speed ≈ 2.4 columns/s. The fastest splash energy moves at about 4.5 columns/s, so a cannonball ring takes roughly 7 seconds to reach mid-screen.

**The nonlinear variant is one line away.** Replace the linear spring with a pendulum term (sin of the displacement) and the lattice becomes the sine-Gordon chain from §2.2, with breathers and solitons. It is worth a toggle later for over-the-top rogue waves.

---

## 4. The model in the prototype

**Swell target.** Each point is pulled toward `target = swellHeight × (swell(x, z, t) + noise × valueNoise)`. `swell` is the exp(sin) wave stack with derivative drag from the reviewed shader (§5), evaluated per lattice point. Its directions are confined to a ±0.45 rad cone around +x, because the camera is side-on and waves should cross the screen. The stack is re-centered by subtracting 0.4658, the mean of exp(sin x − 1), so a bigger swell doesn't raise the sea. Noise is value noise over (column, row, time) built on Dave Hoskins' sine-free hash, which avoids the precision artifacts of `fract(sin(...))` on mobile GPUs.

**Damping toward the swell's velocity.** Damping pulls each point's velocity toward the target's own velocity, not toward zero. The swell passes through undamped, and only disturbances (splashes, noise jitter) decay. The damping is implicit, v ← (v + a·dt + d·dt·v_target) / (1 + d·dt), so it can never destabilize the integrator.

**Edges.** Columns use clamped neighbors, and the outer 3 columns get extra "sponge" damping so rings don't bounce back from the screen edge. The lattice deliberately does **not** wrap: the swell's 1.18× frequency layers aren't periodic over 64 columns, so a wrap would show a seam. Columns 0–1 and 62–63 sit just off-screen.

**Splashes.** A cannonball is a Gaussian velocity kick (radius 1.8 columns, flattened between rows). Taps and a random timer both produce them.

**Integrator and stability.** Semi-implicit (symplectic) Euler at a fixed 60 Hz tick with 2 substeps, so 120 Hz. The explicit stability bound is dt·ω_max < 2, where ω_max² = ω₀² + 4cₓ² + 4c_z². At defaults ω_max ≈ 15.1 rad/s and dt·ω_max ≈ 0.13, a 16× margin. Even with every slider at maximum the margin is about 8×. A headless run of the CPU path at default and extreme slider settings stayed numerically stable, with no NaNs. One case needs care: with minimum damping and no coupling, repeated splashes add energy faster than it drains, so heights climb until the renderer's height clamp takes over.

**Rendering state.** Each point stores height, velocity, the current target, and its sharpness (the size of its neighbor Laplacian). The renderer uses these to decide where line noise goes (§6.1).

| Default | Value | Default | Value |
|---|---|---|---|
| Wheel stiffness ω₀ | 3.5 rad/s | Swell length | 24 columns |
| Crest height | 0.73 | Keep peaks pointed | 1.0 (§6.10) |
| Flatten between crests | 0.45 (§6.11) | Crests start above | 0.3 |
| Neighbor pull across cₓ | 6 col/s | Swell speed | 1.8 rad/s |
| Neighbor pull between rows c_z | 2.5 | Swell layers | 4 |
| Damping | 0.35 /s | Wave drag | 0.42 |
| Edge sponge | 6 /s | Noise | 0.5 |
| Peak sharpness k | 4 (§6.10) | Curve detail | 3 points per column |
| Crest, depth and height controls | §6.1–6.2 | | |

---

## 5. Review: the shader you shared

**What it is.** The pasted code is the second half of **"Very fast procedural ocean" by afl_ext** (Shadertoy MdXyzX, one of the most-viewed water shaders on the site). The paste starts partway into `aces_tonemap`, so the wave, raymarch, normal and atmosphere functions weren't included. I reviewed them against the published version. The source header reads "afl_ext 2017-2024, MIT License", so it is usable in a commercial game with attribution. The prototype credits it where the wave function is used.

### 5.1 How it works

1. **Wave shape.** Each wave is `exp(sin(x) − 1)`: sharp peaks at 1, broad flat troughs at about 0.135. That is trochoid-like, without Gerstner's horizontal displacement.
2. **Derivative drag.** After each wave is sampled, the sample position is pushed along the wave direction by that wave's slope before the next wave is sampled. Small waves bunch up on the crests of big ones. This single line is why the result looks alive instead of like summed sines. In spirit it's a coupling between wave layers, the frequency-domain cousin of our neighbor coupling.
3. **Layer rules.** Each layer's weight is 0.8× the last, frequency is ×1.18, time rate is ×1.07 (a cheap stand-in for dispersion), and the direction comes from `sin/cos` of an iterator stepped by 1232.399963, which scatters directions pseudo-randomly.
4. **Bounded raymarch.** The ray is clipped between planes at the top and bottom of the wave range, then marched with an adaptive step equal to the height gap. Marching uses 12 wave layers, and normals use 36.
5. **Shading.** Normals flatten toward straight up with distance to suppress far-field shimmer. Schlick Fresnel uses F0 = 0.04, reflections come from a very cheap analytic sky, subsurface scattering is faked from hit depth, and a fitted ACES curve does tone mapping.

### 5.2 Cost

This is a **per-pixel** effect. Worst case per water pixel is up to 64 march steps × 12 wave layers, plus 3 normal samples × 36 layers, which is several hundred exp/sin/cos evaluations. At full resolution on a DPR-3 phone that means millions of pixels. It is fast for what it draws, but not a mobile gameplay background at native resolution. The author has said openly that it is a deliberate approximation built for speed, not physical accuracy. That is fine for us, because we're going cartoony anyway.

### 5.3 What we take

| Idea | Where it went |
|---|---|
| exp(sin) wave shape | The swell target in the simulation |
| Derivative drag between layers | Same. It is the main reason the swell looks organic with only 3 layers |
| 0.8 / 1.18 / 1.07 layer rules | Same, with directions narrowed to a cone for the side-on camera |
| Mean-centering (new) | Subtract 0.4658 so raising swell height doesn't lift the sea |
| Fewer layers for cheap passes, more for detail | Planned: fewer layers on back rows (row LOD) |
| Flatten detail with distance | Planned: back rows get less noise |

**The cost trick is where it's evaluated.** We run the wave function **per lattice point, not per pixel**: 1,024 points × 3 layers. That changes the cost by several orders of magnitude.

### 5.4 What we leave

- **The raymarch, sky model, Fresnel and ACES.** The target look is flat, banded toon water, closer to Wind Waker's flat-shaded sea than to photoreal reflection. Toon shading is a few color bands and a crest line.
- **Pure analytic heights.** The shader's ocean is a function of (x, z, t) only. Nothing can splash it, nothing propagates, and neighbors don't affect each other. That is the part your wheel idea adds.

### 5.5 Where the original could still earn a place

A menu or title-screen sea. It could also serve as the **analytic function for ship bob** if gameplay ever needs water heights with zero stored state. For lockstep PvP that function would need deterministic math (§7.3).

---

## 6. Rendering the waterlines efficiently (16 rows at the time; now 12)

**One draw call, no buffers.** The vertex shader decodes `gl_VertexID` into (row, fill-or-line, sub-segment, quad corner) and reads heights from the 64 × 16 state texture with `texelFetch`. No vertex data is uploaded, ever. Rows draw back to front: each row's fill, then its line, so painter's order does the layering without a depth buffer.

**Smooth curves from 64 points.** On a wide phone screen, 64 samples look polygonal. The vertex shader evaluates Catmull-Rom between the 4 nearest columns, at 3 points per column by default.

**Thick lines as triangles.** Browsers generally clamp `gl.lineWidth` to 1 pixel (ANGLE's maximum is 1.0), so each waterline segment is extruded into a quad in pixel space. It is overlapped slightly along the tangent to hide joins and anti-aliased in the fragment shader from the distance to its center. Width scales with row perspective.

**Overdraw control.** A naive version fills each row down to the bottom of the screen, stacking up to 16 full-screen layers at the bottom. Each row's fill instead stops just below the lowest point the next row forward can reach (base line minus 2.6 × amplitude), which cuts overdraw to about 2 layers. On mobile this is the single largest rendering saving.

**Height only.** Points never move sideways; x comes from the column alone (owner direction, replacing an earlier crest-lean experiment). The "Show the wheels" toggle draws the wheel as a crank: the spoke tip goes round the wheel using height and velocity, and a short arm carries only its height across to the water point.

**Look.** Row colors blend through three stops: deep cobalt in front, turquoise in the middle, pale aqua at the horizon. The wave body is soft gradients only (owner direction), and the white crest is a separate stroke gated by height (§6.1).

### 6.1 Look target: the reference render

The owner's reference image (a pirate battle key art, ships ignored for now) sets the water look. It shows a saturated turquoise field, darker cobalt in the foreground and pale aqua at the horizon. Foreground crests carry white foam with spray and navy shadow beneath.

**Owner rules, in the order given:**

1. The wheels change vertex height only, never horizontal position.
2. Line noise is minimal at low, smooth points and highest at peaks and wherever adjacent points differ sharply.
3. The blue shades in the wave body are blurred. White crests are thick and continuous at the peaks and not visible in the troughs.

**How the prototype implements them.**

*White crests come from a height mask:*

```
crest = smoothstep(crestStart, crestFull, height / swellHeight)
```

With the defaults (start 0.15, full 0.45), measured on the headless copy of the simulation with the sharper-peak settings from §6.2, white begins on roughly the top 23% of the sea and reaches full thickness on the top 6%. Crest half-width is base width × thickness × crest, so a crest swells to full width at the peak and tapers smoothly to nothing before the trough. There are no breakup gaps, so crests stay continuous. Line segments that are entirely in troughs collapse to zero area in the vertex shader and cost no pixels.

*Noise rides on crests only.* Energy from neighbor sharpness and splash disturbance (the simulation writes the Laplacian into the state texture's spare channel) roughens crest edges, adds a small vertical wobble and throws spray flecks. All of it is multiplied by the crest mask, so troughs stay clean.

*The wave body is soft gradients with no hard bands:*

- a light tint that decays exponentially below the surface, stronger under crests;
- a smooth darkening further down the face;
- a soft navy Gaussian shadow tucked under each crest.

A single softness control scales every falloff distance.

| Control | Default | Effect |
|---|---|---|
| Crests start at height | 0.15 | Below this height a line is invisible |
| Full thickness at height | 0.45 | Above this height a crest is at full width and pure white |
| Crest thickness | 2.2× | Peak width multiplier on the 3 px base |
| Ragged edges at sharp spots | 0.5 | Edge noise, scaled by sharpness energy and crest mask |
| Crest wobble | 0.8 px | Vertical-only jitter where energetic |
| Spray flecks | 0.5, 9 px high | Dots above crests, flickering about 5 times a second |
| Gradient softness | 0.8 | Scales all body gradient distances |
| Shadow under crests | 0.7 | Strength of the soft navy shadow |

Noise coordinates are screen x (scaled by row perspective) plus row and time, so nothing slides sideways; the noise boils in place.

### 6.2 Depth, verticality and peak shape

**Owner direction.** Infer more depth, with control over how scale falls off from the farthest row to the nearest. Make peaks sharper and give more control over verticality: tall waves on the bottom rows, flatter water in the distance.

**Depth: a per-row table instead of a fixed formula.** JavaScript computes three 16-entry tables whenever a depth slider moves and uploads them as uniform arrays:

- **Scale** (size of everything on the row) falls from 1 at the nearest row to *farthest row scale* at the back. *Scale falloff* blends linear falloff (0) with perspective falloff 1/(1 + k·t) (1), both hitting the same far value.
- **Resting height** places rows between *nearest row height* and *horizon height*. Gaps are proportional to row scale, as on a receding plane, so the back rows bunch up. At defaults the front gap is 4× the back gap.
- **Wave height** is base height × scale × a verticality multiplier running from *nearest* to *farthest* along a falloff curve. At defaults the front row's waves are about 15× taller on screen than the back row's.

Scale also drives crest width, noise size, spray size and color haze, so all depth cues move together. The CSS sky gradient follows the horizon slider.

**Peak shape: two controls.**

- *Peak sharpness* (simulation). Each swell wave becomes exp(k·(sin x − 1)), so k = 1 is the reviewed shader's original and higher k gives narrower peaks with flatter troughs. The wave's mean over a period is e^(−k)·I₀(k), computed in JavaScript and subtracted so sharper waves don't raise the sea.
- *Peak pinch* (drawing only). Rendered height adds pinch × swell × max(height/swell, 0)², which stretches wave tops without touching troughs or the simulation.

**Why the wheel defaults changed.** The neighbor coupling smooths sharp targets. Measured on a headless copy of the simulation, the original wheel settings (ω₀ = 2.4, cₓ = 7) kept about 70% of the target's peak curvature. Stiffer wheels with slightly less neighbor pull (ω₀ = 3.5, cₓ = 6) keep about 83% and still spread splash rings.

I also tried coupling neighbors on each point's deviation from the swell instead of its full height. That kept more than 100% of peak sharpness but resonated, with heights about 3× the target, so it was left out.

| Control | Default |
|---|---|
| Farthest row scale | 0.22 |
| Scale falloff (linear 0 to perspective 1) | 0.5 |
| Horizon height / nearest row height (NDC) | 0.22 / −0.62 |
| Wave height, nearest / farthest rows | 1.6× / 0.5× |
| Height falloff curve | 1.0 (linear in row) |
| Peak sharpness k | 2.5 |
| Peak pinch | 0.8 |

### 6.3 Cannonball impacts and the hull test

**Owner direction.** Cannonballs should hit with much more vertical impact, with limited horizontal spread and 3× the spray. A boat hull should be tested in the water, with foamy white cresting on its curved hull.

**The foam channel.** The state texture's spare channel now holds **foam** (0–1.5, decaying with a 1.2 s life) instead of sharpness. The renderer recomputes sharpness from the same four texels it already reads for the curve, so nothing was lost.

**Cannonball.** An impact is three things applied at once:

- a narrow **upward** velocity kick (radius 0.8 columns) instead of the old wide downward push;
- a wider foam zone (radius 4 columns);
- inside that foam zone, sideways neighbor pull is cut by 95% and damping rises by 3/s, so the column of water goes up and down in place instead of radiating a ring.

Measured on a mirror of the lattice over three seconds after impact:

| Setting | Height at impact | Largest height 6+ columns away | Vertical-to-sideways ratio |
|---|---|---|---|
| Old splash (downward kick, radius 1.8) | 0.50 up / −1.11 down | 0.26 | 4.2 |
| Narrow upward kick only | 2.36 | 0.49 | 4.8 |
| Narrow kick with a narrow foam zone | 2.94 | 0.59 | 5.0 |
| **Shipped: narrow kick, 4-column foam zone, 95% decouple, +3 damping** | **2.04** | **0.21** | **9.8** |

The key was making the foam zone wider than the kick. With a narrow zone, energy escaped the decoupled area almost immediately.

**Spray and whitewater.** Foam turns a line white wherever it is present, even in a trough, and fattens it by up to 60%. Foam spray is 3× the crest spray, in both dot density (capped at full) and reach. Peak pinch is now capped at one swell height, so tall impacts don't overshoot into flat-topped clipping, and the height clamp was raised to 3.2.

**Hull test (simulation).** One row carries a hull (defaults: row 2, center column 30, half length 9).

- Under the hull, water is pulled toward the hull level minus draft × a curved bottom profile, sqrt(1 − x²).
- Just past bow and stern, water is lifted by 0.6 × draft, forming bow and stern waves.
- The rows either side feel 35% of this.
- Hull level is the swell's mean over the hull plus half the local disturbance. The known draft dip is added back so the hull can't sink into its own hollow, and cannonball hits nudge it.
- Foam is generated at bow, stern and hull edges, proportional to 0.5 plus how fast the water moves against the swell.

A 40-second mirror run with the swell, the hull and an impact beside the bow every 5 seconds stayed stable. Hull level ranged 0.02–0.30, and the tallest point was 2.2. Bow foam averaged 1.1 (saturated) at a foam rate of 1.2, so the default is 0.6, which averages about 0.6.

**Hull test (rendering).**

- **Draw order.** The hull draws between the rows behind it and its own row, as one extra draw call. Its own row's fill then covers the submerged part, and the row's white foam line crosses the hull at the waterline.
- **Reading the water.** The hull reads the state texture itself, so there is still no CPU readback. It bobs on the hull level and tilts from the difference between its bow and stern halves.
- **Silhouette.** Cartoon side view: swept-up deck, rounded bottom, raked bow, planks, gold rail, three gun ports, dark outline.
- **Waterline.** For each hull pixel the shader evaluates the same water curve the sea draws at that screen column.
- **Foam.** Above the waterline it paints a torn white foam band, wrapping 3 px past the outline. The band climbs higher where the hull curves at bow and stern and grows with local foam. Its bottom is shaded cyan, with bubbles.
- **Wet wood and spray.** A darker wet band sits above the foam, and spray dots come off the ends.
- **Test controls.** A "Fire at the hull" button drops cannonballs along the hull's row.

| Control | Default |
|---|---|
| Vertical impact | 16 |
| Impact width / foam zone width | 0.8 / 4 columns |
| Limit sideways spread | 0.95 |
| Damping inside foam | 3 /s |
| Foam life | 1.2 s |
| Hull row / position / half length | 2 / 30 / 9 |
| Hull draft / push | 0.6 / 25 |
| Foam made at the hull / foam climbing the hull | 0.6 / 1.0 |

### 6.4 Screen independence (aspect ratio and width)

**Problem the owner reported.** The water looked very different depending on screen shape and width.

**Causes.**

1. **Columns stretched and squashed independently of height.** The 60 visible columns always spanned the full screen width, while row positions and wave heights were fractions of screen height. Wave steepness (height ÷ column width) therefore tracked the aspect ratio: 1.43 on 16:9, 1.07 on 21:9, 1.91 on 4:3, and 5.5 on a portrait phone.
2. **Sizes in CSS pixels.** Line widths, spray, foam bands, noise frequency and the hull's foam were measured in CSS pixels, while the geometry scaled with the screen. A wider screen made lines relatively thinner and noise relatively denser.
3. **Noise pinned to screen pixels.** Some noise coordinates came from screen pixels, so resizing changed the pattern.

**Fix: one camera, one scale.** Everything is now in **world units**, where 1 unit is 1 lattice column:

- row positions, wave heights, hull size and the tap-to-splash mapping;
- noise coordinates, anchored to world x rather than screen pixels.

The screen only chooses one pixels-per-unit number, used for both axes.

- **Fit rule.** Show 60 columns across. On screens wider than 2.4:1, fit height instead, and the outermost sea segments stretch flat past the lattice so the sides never show a gap.
- **Vertical anchor.** The bottom of the view stays a fixed world distance below the nearest row. Extra height on taller screens becomes sky; the CSS sky gradient is recomputed from the camera.
- **Sizes.** Pixel-style sizes (line width, spray, foam, planks) are "reference pixels" at a 1600×900 view, scaled by the camera. Only anti-aliasing stays in real device pixels.
- **Sliders.** Horizon and nearest-row sliders keep their old numbers; they are now read as positions on the 16:9 reference view.

**Check.** The same camera math was projected at six screen shapes:

| Screen | Old wave height ÷ column | New wave height ÷ column | New line ÷ column | Columns shown |
|---|---|---|---|---|
| 1600×900 (16:9) | 1.43 | 1.43 | 0.11 | 60 |
| 2532×1170 (phone landscape) | 1.18 | 1.43 | 0.11 | 60 |
| 3440×1440 (21:9) | 1.07 | 1.43 | 0.11 | 60 |
| 1024×768 (4:3) | 1.91 | 1.43 | 0.11 | 60 |
| 1170×2532 (phone portrait) | 5.52 | 1.43 | 0.11 | 60 |
| 5120×1440 (32:9) | 0.72 | 1.43 | 0.11 | 88.9 |

Wave shape, crest thickness, noise and spray are now identical relative to the sea on every screen. What changes is only how much sky shows, and on extreme widths, how much flat sea extends past the lattice.

**Consequence to decide (open question 5).** In portrait the sea correctly keeps its shape, but it occupies only the bottom 16% or so of the screen under a tall sky. If portrait must be supported, the choice is between that, a portrait-specific layout (zoom in and show fewer columns), or locking the game to landscape as the GDD proposes.

### 6.5 Flying cannonballs, hull rocking, calm base and bow wave

**Owner direction.** Launch small black cannonballs from the right toward the left and trigger the impact when they hit the water. Let the boat rock fore and aft a small amount, have the hull damp the waves at its base, and make the front of the boat raise a natural crest as if it were moving.

**Cannonballs, still shader-only.**

- **Launch (JavaScript).** JavaScript only records each launch: start point just past the right edge of the view, velocity, launch time, target row. It solves the arc so the ball reaches the row's rest height at the target column after about 0.9–1.3 s, with gravity 22 units/s².
- **Hit window.** It also computes, analytically, the short window when the ball is inside that row's possible wave band. That is the only time it can hit.
- **Uploads.** Up to 8 balls travel as two uniform arrays, re-uploaded only when a ball launches.
- **Hit detection (simulation shader).** In every substep, each texel checks each ball in its window: was the ball above the water at its previous position a substep ago, and is it at or below the water now? "Water" means the drawn surface, including peak pinch. Every texel evaluates the same test, so the whole impact lands in one substep with no state and no readback.
- **The first version missed balls on steep water.** On a mirror run, 2 of 20 balls never registered. Both landed where the water changes steeply between columns, one at the hull's stern edge. A ball moves about a quarter column per substep, so the water under it could rise faster than it fell, and a one-column test never saw it above the surface. Testing the previous height against the previous column's water, rolled back one substep by its velocity, fixed it: 20 of 20 hit, each exactly once.
- **Drawing.** Balls are black with a highlight and a 3-ghost smoke trail. The vertex shader hides a ball as soon as it is below the water at its column.
- **Firing.** Taps, random fire, "Fire at the hull" and "Fire a volley" all launch balls instead of dropping instant splashes.

**Hull motion.**

- **Rocking.** Pitch follows the water's bow-to-stern slope × rock amount (0.5), clamped to ±5°, plus a gentle idle sway of 20% of the maximum. The simulation's hull level slopes by the same rock amount, so water and drawn hull stay aligned.
- **Calm base.** Under the hull, damping rises by 3/s and the damping target drops toward 40% of the swell's velocity, so the hull visibly calms the water at its base. Neighboring rows get 35%.
- **Bow wave, as if moving toward +x:**
  - a crest just ahead of the bow;
  - a trough along the side behind it;
  - both swept back by 1–1.2 columns on the rows either side, for a wake-like diagonal;
  - a small stern bump.

  The crest grows by up to 2.5× when the bow dips below the hull's middle, so it pulses naturally as the hull rocks. The bow crest makes 1.5× foam, and foam climbs the hull 1.4× higher at the bow than at the stern (0.6×).

**Mirror check.** A 40-second run had the swell, the hull and 20 balls fired across rows 0–5, including onto the hull. All balls hit exactly once and nothing blew up: the tallest point was 2.3 units, and the bow crest stood about 0.7 above the swell. Hull level stayed within 0.01–0.30, and bow foam averaged 0.55.

| Control | Default |
|---|---|
| Ball size | 0.45 columns |
| Rock with the water / max rock angle | 0.5 / 5° |
| Calm water at the hull base | 3 /s |
| Bow wave | 0.8 |

### 6.6 Keeping waves and impacts in fewer rows

**Owner direction.** Wave and cannonball impacts should be isolated to fewer rows. **Scale:** 50 ft of width is about 1.5 rows, so one row is about 33 ft deep.

**Why impacts spread across rows.** Three leaks:

1. **Wide kicks and foam across rows.** The kick's row radius (0.8) reached ±1 row at 21%, and the foam's row radius (1.2) reached ±1 row at 50%.
2. **Unchecked between-row coupling.** Neighbor pull between rows carried every disturbance into the next row, then the next. The foam zone cut sideways coupling but not row coupling.
3. **Wide hull influence.** The hull pushed the rows either side at 35%.

**Fix, in feet.**

- **Kick and foam width across rows are set in feet.** A Gaussian whose width at half strength is 50 ft (1.5 rows) has radius 0.90 rows, reaching 29% one row away and 0.7% two rows away.
- **Row isolation for disturbances only.** Between rows, the swell's own row-to-row shape stays fully coupled, but the part of the height that differs from the swell is coupled at only 20% (isolation 0.8). The swell passes between rows as before, while splashes and hull waves mostly stay in their row. This is stable because it only removes stiffness, and measured on the mirror it left the swell unchanged: identical height percentiles, peak sharpness kept 85% versus 83%.
- **Hull beam in feet.** The default is 35 ft, about 1 row. Its push on neighboring rows drops from 35% to 8%, which also shrinks the bow wave's diagonal sweep.
- **Foam whitening needs more foam.** A line now turns white between foam 0.15 and 0.6 (was 0.05 to 0.5), and cannonball spray uses the same threshold. Faint foam on neighbor rows no longer whitens whole lines or throws full spray.

**Measured on a mirror of the lattice.** Flat sea, one impact, peak height per row over 4 seconds, as a share of the impact row:

| Setting | Impact row | ±1 row | ±2 rows | ±3 rows | Foam ±1 / ±2 |
|---|---|---|---|---|---|
| Before | 2.04 | 25% | 5% | 3% | 0.50 / 0.06 |
| 50 ft footprint only | 2.06 | 30% | 6% | 3% | 0.29 / 0.01 |
| **50 ft footprint + row isolation 0.8 (shipped)** | **2.24** | **26%** | **1%** | **0%** | **0.29 / 0.01** |

The impact now covers its own row plus a partial neighbor on each side, matching about 1.5 rows, and nothing reaches two rows away. The full mirror run (swell, hull, 20 cannonballs) stayed stable: every ball hit exactly once, the tallest point was 2.55, and bow foam averaged 0.57.

| Control | Default |
|---|---|
| Impact width across rows | 50 ft |
| Foam width across rows | 50 ft |
| Keep impacts in their row | 0.8 |
| Hull beam across rows | 35 ft |

### 6.7 White splash particles at the impact point

**Owner direction.** A white particle splash at the point of cannonball impact.

**Knowing where and when a ball hit, still shader-only.** The simulation already detects hits, but nothing kept a record of them. A tiny second pass (8×1 float texture, one texel per ball slot, ping-ponged) now runs just before each simulation substep, reading the same pre-step water:

- **On a hit.** It runs the identical crossing test and records the hit x, the drawn water height there, age 0, and the row.
- **Otherwise.** It keeps the previous record and adds the substep to its age.

Age is stored instead of a timestamp so half-float textures stay precise. The cost is one extra draw of 8 pixels per substep, and there is still no GPU readback.

**The splash.** Up to 64 droplets per impact slot are drawn in one attribute-less call.

- **Randomness.** Each droplet's values are hashed from its slot, its index and the hit position, so every splash is different.
- **Mix of shapes.** 30% are chunky "column" blobs launched near vertical; 70% are smaller droplets thrown in a wider fan. All lean slightly toward the ball's travel, right to left.
- **Motion.** Droplets follow gravity arcs, stretch slightly along their motion, shrink and fade over their life, and vanish once they fall back below the hit height.
- **Scale.** Speed, size and gravity scale with the row, so far splashes read as far.
- **Look.** White with a thin pale-blue rim, so droplets read against both the sky and white foam.
- **Draw order.** Splashes draw after the sea and hull and before the balls.

This adds to the existing foam spray and white foam lines at the impact; it doesn't replace them.

**Bug caught during wiring.** Uploading the impact pass's uniforms switched the active GL program partway through the simulation's uniform upload, so five hull and impact settings would have silently failed to reach the simulation. A stricter mock WebGL context, which tracks the active program and flags uniforms set on the wrong one, found it. The mock was confirmed on a deliberately broken copy, and the fixed page runs clean through 260 frames plus every slider and button handler.

| Control | Default |
|---|---|
| Splash droplets | 48 per impact |
| Splash height (launch speed) | 16 units/s at the nearest row |
| Droplet size | 0.6 columns at the nearest row |
| Splash life | 1.0 s |

### 6.8 Twelve rows, and swells that only carry a few rows

**Owner direction.** Swells should carry across only 3 rows in the foreground and a single row from mid to far. Reduce the total rows from 16 to 12.

**Why every swell spanned the whole blanket.** The swell was one continuous function of column and row. Its wave directions stayed within ±0.45 rad of straight across the screen, so the pattern changed only slowly from row to row. The between-row coupling then tied rows together further. Measured on a mirror of the simulation, the height along neighboring rows correlated at **0.96–0.99 for every pair of adjacent rows**, all the way to the horizon.

**Swell groups.**

- **Grouping.** Rows 0–2 form one foreground swell group. From row 3 back, every row is its own group. Both sizes are sliders.
- **Inside a group.** The swell varies smoothly across its rows exactly as before.
- **Between groups.** Each group gets its own swell phase (per layer), heading (±0.25 rad), speed (±10%) and horizontal offset, plus its own noise, so neighboring groups aren't copies of each other.
- **Coupling.** Between-row pull across a group boundary is cut to 5%, applied to both the swell and disturbance parts, so groups don't drag each other back into sync. Within a group, coupling is unchanged, including the row isolation for impacts from §6.6.

**Measured on the mirror.** Correlation of height between adjacent rows, averaged over 15 seconds after warm-up:

| Row pair | 16 rows, before | 12 rows, grouped |
|---|---|---|
| 0–1 | 0.99 | 0.98 |
| 1–2 | 0.97 | 0.97 |
| 2–3 (foreground group edge) | 0.97 | 0.37 |
| 3–4 | 0.97 | 0.00 |
| 4–5 through 10–11 | 0.96–0.97 | −0.22 to 0.27 |

The foreground swell now spans exactly rows 0–2, and each mid-to-far row moves on its own. The remaining 0.3 at the group edge is chance similarity between two independent swells of the same wavelength, not coupling: with zero coupling it was still 0.28.

**Twelve rows.** The lattice, textures, row tables and every shader's row arrays are now 12 rows (64 × 12 = 768 texels). The rows span the same distance from the nearest row to the horizon, so each row covers more depth; the 33 ft per row scale from §6.6 still sets impact and hull widths. The hull row slider now tops out at row 8. Swell height statistics per row are unchanged, so the white-crest thresholds still hold.

| Control | Default |
|---|---|
| Rows a swell spans, foreground | 3 |
| Rows a swell spans, mid to far | 1 |
| Pull between separate swells | 0.05 |

### 6.9 Combining shaders

**Question from the owner.** Can any of the shaders be combined?

**Three could, and the other separations are load-bearing.** Programs went from 7 to 5, and a steady frame went from 9 draws and about 51 GL calls to 6 draws and about 32, with the same vertex count and the same picture.

**1. The impact-record pass folded into the simulation.** It was a separate program writing its own 8×1 ping-ponged float texture, one draw per substep (2 per frame). The state texture is now 64×13: rows 0–11 are the sea and row 12 holds the impact records. The simulation shader branches on the row. This removes a program, two textures, two framebuffers, two draws per frame and a texture-unit binding. It also closes a correctness gap: the kick and its record are now written by the same pass from the same pre-step water, so they cannot disagree.

**2. Cannonballs and splash droplets became one particles program.** Both were camera-facing quads built from `gl_VertexID` and both read the same state texture. They are now one program and one draw, with splash vertices first and ball vertices second, which is also the order they must paint in. A `vKind` varying picks the look in the fragment shader: droplet, chunky blob, iron ball, smoke trail.

**3. Shared code extracted.** `hash12`, `vnoise`, `toNdc` and `drawnHeight` were copied across up to five shaders each. They now live in one block that shaders pull in with an `// #include common` line, spliced in at compile time. The two that needed uniforms take them as arguments instead. This is about correctness as much as tidiness: the noise decides foam and line energy in both the simulation and the renderer, and `drawnHeight` decides both where a cannonball hits and where it is drawn, so a divergence would mean balls visibly passing through the water. Total shader source dropped from 920 to 839 lines.

**Not combined, and why.**

- **Sea and hull.** Their draw order interleaves (rows behind, hull, rows in front), which one draw could express by vertex order. But their fragment shaders are large and unrelated, and merging them would raise register use on the single heaviest fragment shader in the frame, for a saving of one draw call. Not worth it without profiling on real devices.
- **The wheels overlay.** It draws lines, not triangles, so it cannot share a draw with anything. It is also debug-only and off by default.
- **The simulation and the renderers.** They run at different rates (120 Hz versus once per frame) and to different targets. Keeping them apart is the whole reason a frame does only two simulation draws.

| | Before | After |
|---|---|---|
| Programs | 7 | 5 |
| Draws per frame | 9 | 6 |
| GL calls per steady frame | ~51 | ~32 |
| Float textures / framebuffers | 4 / 4 | 2 / 2 |
| Shader source lines | 920 | 839 |

**Verified.** All shaders compile, the strict mock (which tracks the active program and flags uniforms set on the wrong one) runs clean through 260 frames plus every slider and button, and the mirror run of the simulation still has all 20 cannonballs hitting exactly once with unchanged heights and foam.

### 6.10 Pointier crests at the same height

**Owner direction.** Change the maths so crests are more pointed. Not necessarily higher, just sharper.

**Why raising peak sharpness used to make waves bigger.** Each swell wave is exp(k·(sin x − 1)), and the sum was only re-centred by subtracting the mean. As k rose, the crest grew relative to the rest of the sea: peak-above-mean went from 0.53 at k = 1 to 0.83 at k = 6. So the sharpness control doubled as a height control, which is the opposite of what was asked.

**Fix 1: peak-normalise the swell.** The wave is now divided by (peak − mean) = 1 − e^(−k)·I₀(k), computed in JavaScript. The crest height is then fixed at the "Crest height" setting no matter what k is, and k changes only the shape. The default crest height is 0.73 so the sea is exactly the size it was before.

With that normalisation, k is a pure sharpness dial. Crest half-width, measured as a fraction of one wavelength at half the crest height:

| Peak sharpness k | 1 | 2.5 (old default) | **4 (new default)** | 6 | 8 |
|---|---|---|---|---|---|
| Crest half-width | 12.9% | 9.7% | **8.1%** | 6.8% | 6.0% |
| Water level between crests | −0.87 | −0.37 | **−0.26** | −0.20 | −0.17 |
| Apex curvature | 3.3 | 7.5 | **12.6** | 20.2 | 28.3 |

Sharper k also lifts the water between crests, which is what makes the crests read as spikes standing out of flatter water rather than as a rolling sine.

**Fix 2: default sharpness 2.5 → 4.** Not 6 or 8, because of what the lattice does to the target. Measured on a mirror of the simulation, the fraction of the target's apex curvature that survives the neighbour coupling is 84% at k = 2.5, **97% at k = 4**, and only 75% at k = 6. Past k ≈ 4 the target's crest gets narrower than the lattice can carry at one point per column, and the coupling smooths away what it gains.

**Fix 3: stop the drawn curve rounding the apex off.** Between lattice columns the renderer uses Catmull-Rom, which is smooth by construction and rounds any corner. Where the lattice bends hard, it now leans toward straight lines between points, which keeps the corner exactly as the simulation made it. A "Keep peaks pointed" slider controls this; the local curvature that drives it is already computed for the line-noise energy, so it costs nothing extra.

Measured on a modelled crest, rendered apex curvature, peak height unchanged:

| | k = 2.5 | k = 4 | k = 6 |
|---|---|---|---|
| Catmull-Rom (before) | 0.3 | 0.4 | 0.6 |
| **Blended (shipped)** | **0.6** | **1.0** | **1.3** |
| Pure straight lines | 0.7 | 1.0 | 1.3 |

The blend recovers essentially all of the corner at sharp points while staying smooth everywhere else.

**Peak pinch is now the honest name.** The existing pinch control does raise wave tops, so its default drops from 0.8 to 0.4 and its label says so. The three new sharpness levers do the job without adding height.

**Retuning that followed.** Because the swell is peak-normalised, heights expressed as a fraction of crest height all scale by about 1.37. The white-crest thresholds moved from 0.15/0.45 to **0.21/0.62**, which the mirror confirms still puts white on the top 22% of the sea and full white on the top 6% — the same look as before. Absolute wave height is unchanged (peak 0.77 versus 0.80), and the full mirror run with the hull and 20 cannonballs is unchanged and stable.

| Control | Default |
|---|---|
| Crest height | 0.73 |
| Peak sharpness | 4 (range 1–8) |
| Keep peaks pointed | 1.0 |
| Peak pinch (raises tops) | 0.4 |

### 6.11 Flat water between crests: a height tone curve

**Owner direction.** Same goal as §6.10, reached by tuning: keep nice peaks, but make the space between crests a smooth curve that is very flat.

**Why raising peak sharpness alone can't get there.** Sharpness k narrows the crest and lifts the water between crests, but §6.10 showed the lattice stops repaying it past k ≈ 4: at k = 6 only 75% of the target's apex sharpness survives, against 97% at k = 4. Crest width and trough flatness were tied to the same dial, and the dial had a ceiling.

**Separate the two with a tone curve on height.** Drawn height now passes through a gain that ramps from *flatten* up to 1 across a band starting at *crests start above*:

```
gain(u) = mix(flatten, 1, smoothstep(from, from + 0.25, u))
drawn   = amp * (u * gain(u) + pinch * clamp(u*gain, 0, 1)^2)
```

- Anything crest-high sits above the ramp at gain 1, so **crest height is untouched**.
- Everything below is squashed toward flat, troughs included, leaving a smooth shallow curve.
- The ramp itself adds slope, so crest flanks get much steeper.
- It is monotonic (smallest slope 0.05 across every setting tested), so height order never changes and the crest mask, the cannonball hit test and the picture all still agree.

**Measured on one modelled crest at k = 4, crest height fixed at 1.00:**

| | Steepest flank | Crest half-width | Between-crest ripple |
|---|---|---|---|
| No tone curve | 1.48 | 8.1% of a wavelength | 0.023 |
| flatten 0.3, from 0.35 | **4.10** | 7.6% | 0.007 |
| flatten 0.3, from 0.5 | **4.86** | 6.4% | 0.007 |

Flanks get about 2.8× steeper at the same peak height, and the water between crests is 3× smoother. Apex curvature itself is unchanged, which is the point: the peak keeps the shape §6.10 gave it, and its surroundings drop away from it.

**Measured on the real sea (mirror run, k = 4):** at the shipped default of flatten 0.45 / from 0.3, the roughness of the lower 80% of the surface drops from 0.189 to **0.084**, while the peak stays at exactly 1.45. Pushing flatten to 0.3 takes it to 0.056, and the sliders allow that.

**Two supporting changes.**

1. **Corner-keeping is now gated to crests.** §6.10's "keep peaks pointed" leaned toward straight lines wherever the lattice bent hard, which could facet the water between crests. It now also requires the point to be crest-high, so the space between crests stays a smooth curve.
2. **The white-crest mask moved onto the drawn height.** It read the raw simulation height, so flattening would have left white lines on water that had been squashed flat. Reading the drawn height means white follows the shape on screen no matter how the tone curve is tuned. Thresholds were re-measured to 0.10 and 0.73, which the mirror confirms still puts white on the top 22% and full white on the top 6%.

**Cleanup this forced.** Drawn height existed in four places: the shared function plus two inline copies in the sea and hull shaders. They are now all the shared function, which is what makes the tone curve apply consistently to the picture, the hull waterline and where cannonballs land.

**Tuning guide.**

| To get | Change |
|---|---|
| Flatter water between crests | Lower *Flatten between crests* (0.45 → 0.3) |
| Fewer, more isolated peaks | Raise *Crests start above* (0.3 → 0.5) |
| A narrower crest | Raise *Peak sharpness* toward 4, then *Crests start above* |
| A more pointed tip | Raise *Keep peaks pointed* |
| Taller crests | Raise *Crest height*; *Peak sharpness* no longer does this |

| Control | Default |
|---|---|
| Flatten between crests | 0.45 (1 = off) |
| Crests start above | 0.3 |
| White starts / full white at drawn height | 0.10 / 0.73 |

## 7. Where the simulation should run

You asked for a WebGL shader for performance. **Rendering is 100% shader in the prototype.** For the simulation step, measuring beat assuming, so the prototype has a CPU/GPU toggle. Here is what the research says.

### 7.1 The GPU path (ping-pong float textures)

- **It needs render-to-float.** 32-bit float render targets need `EXT_color_buffer_float` on WebGL2. The half-float extension is broadly available (Baseline since 2023, iOS Safari 14+). In 2020 Khronos documented iOS devices exposing only half-float render targets.
- **Half floats are too coarse for this integrator.** A 16-bit float has about 10 bits of mantissa, so near |h| ≈ 1 the smallest representable change is about 0.001. A typical per-step height change at 120 Hz is about 0.015, so rounding error is several percent of every step. It shows up as drift and buzzing. The prototype warns about this when only half floats are available.
- **Gameplay can't cheaply read it.** Ships need to sample water height to bob, and projectiles need it to splash. Reading a float texture back with `readPixels` stalls the CPU until the GPU catches up. That is the classic way to lose frames.
- **It isn't deterministic.** GPU float math differs between devices, which breaks the design document's lockstep PvP assumption.

### 7.2 The CPU path

- **Cost.** Measured headless on a 2.1 GHz Xeon core, one 60 Hz tick (two substeps over 1,024 points) takes about **0.34 ms**. Almost all of that is evaluating the swell target, which is why the target is computed once per tick and interpolated across substeps. The lattice update itself is a rounding error. Expect roughly 2–3× longer on a mid-range phone; that still has to be verified on a device.
- **Upload.** One `texSubImage2D` of a 64 × 16 RGBA float texture per frame, about 16 KB.
- **Gameplay reads heights directly** from the typed arrays, with no stall.
- **Deterministic if built for it.** Plain +, −, × and ÷ on doubles give identical results everywhere. `Math.sin`, `Math.cos` and `Math.exp` do **not**: MDN documents that their precision is implementation-dependent, and Rapier's determinism guide specifically warns against them. For an authoritative build, replace them with a sine table or fixed-point versions. The rendering can keep using GPU trig because it's cosmetic.

### 7.3 Recommendation

**Run the simulation on the CPU and do all rendering in the shader, at 64 × 16.** Keep the GPU simulation pass for two cases:

- the grid grows by one to two orders of magnitude (for example 512 × 128);
- a purely cosmetic layer nobody reads back, such as extra foam detail.

The prototype's toggle lets you confirm this on the target phones instead of taking my word for it.

**Decision for the tech prototype (owner):** round-off drift doesn't matter at prototype stage, so a shader-only build exists as well: `pirate-clashers-wheel-water-shader-only.html`. The simulation runs as a fragment pass over two ping-pong float textures, and JavaScript only sets uniforms, swaps textures and issues draw calls. It resets the sea with a shader pass too, so nothing about the water is computed on the CPU. The CPU recommendation above still applies if water heights start driving gameplay.

**Design document impact (§5.1 and §13).** The GDD currently says the simulation and the water shader evaluate the same analytic wave function. With coupled wheels, the water is now state, not a function. The equivalent guarantee is **"the shader renders the simulation's state."** The player still sees exactly what gameplay uses, and determinism moves to the CPU step. That section of the GDD should be updated.

---

## 8. Next experiments

1. **Row LOD.** Fewer swell layers and less line noise on back rows. This is the practical form of the reviewed shader's distance flattening.
2. **Sine-Gordon toggle.** A pendulum on-site term for breathers, giving big throbbing cartoon swells.
3. **Ship coupling.** Sample 2–3 hull points from the arrays for bob and pitch, and let the hull push down on nearby wheels so ships make their own rings.
4. **Wave-particle wakes** for a moving or recoiling ship.
5. **Foam memory.** Use the spare alpha channel as foam that accumulates on big disturbances and fades over a second or two.
6. **iWave kernel** if splash rings need more water-like spreading than the 4-neighbor Laplacian gives.
7. **Deterministic trig** for the authoritative simulation build.

---

## 9. Open questions

| # | Question | Assumption in the prototype |
|---|---|---|
| 1 | Are the 16 rows lines receding **into the screen** or layers **below the surface**? | Into the screen, drawn as layered lines. If below the surface, wheel radius should decay as e^(−k·depth) per row, and row coupling becomes vertical. |
| 2 | Does the water need to wrap horizontally (endless scrolling)? | No wrap; edges are sponged and sit off-screen. Wrapping needs a swell with wavelengths that divide 64. |
| 3 | Which phones are the performance targets? | None fixed; test the CPU/GPU toggle on them. |
| 4 | Do water heights drive gameplay (ship bob, splash detection) in the vertical slice? | Yes, per GDD §5.1, which is why §7 recommends the CPU simulation. |
| 5 | Must portrait screens be supported? | No; the sea keeps its shape under a tall sky, and landscape is the target per the GDD. |

---

## Sources

- Gerstner wave, circular orbits and exponential decay: Constantin et al., arxiv.org/html/1204.4987; Henry, arxiv.org/pdf/1303.2816; Coastal Engineering Proceedings, icce-ojs-tamu.tdl.org/icce/article/view/905
- Deep-water orbits vanish near half a wavelength and become ellipses in shallow water: US patent 8084873
- Torsion-pendulum sine-Gordon chains and breathers: English, *The sine-Gordon Model and its Applications* (Springer, 2014), link.springer.com/chapter/10.1007/978-3-319-06722-3_5; arxiv.org/html/1508.07152; arxiv.org/pdf/1305.0613
- Klein-Gordon chain dispersion relation: arxiv.org/pdf/solv-int/9902005; arxiv.org/pdf/nlin/0104025
- Local Kuramoto model and twisted-state stability: arxiv.org/pdf/2212.06559; arxiv.org/pdf/2412.15136; arxiv.org/pdf/2012.11741
- Müller-Fischer, GDC 2008: media.gdcvault.com/gdc08/slides/S6509i1.pdf
- Tuts+ dynamic 2D water: gamedevelopment.tutsplus.com/tutorials/make-a-splash-with-dynamic-2d-water-effects--gamedev-236
- Tessendorf, Interactive Water Surfaces: people.computing.clemson.edu/~jtessen/reports/papers_files/Interactive_Water_Surfaces.pdf
- Canabal et al., Dispersion Kernels for Water Wave Simulation: dl.acm.org/doi/10.1145/2980179.2982415
- Yuksel, House & Keyser, Wave Particles: cemyuksel.com/research/waveparticles
- Evan Wallace, WebGL Water: madebyevan.com; experiments.withgoogle.com/webgl-water-simulation
- Finch, GPU Gems ch. 1: developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
- afl_ext, Very fast procedural ocean (MIT): shadertoy.com/view/MdXyzX; technique walkthrough: github.com/MiniMax-AI/skills (shader-dev/techniques/water-ocean.md)
- Dave Hoskins, Hash without Sine: shadertoy.com/view/4djSRW; Jarzynski & Olano, Hash Functions for GPU Rendering: jcgt.org/published/0009/03/02
- Stylized water references: 80.lv/articles/how-to-build-stylized-water-shader-design-implementation-for-nimue; danielilett.com/2020-04-05-tut5-3-urp-stylised-water
- Float render targets: developer.mozilla.org/docs/Web/API/EXT_color_buffer_float; web-platform-dx.github.io/web-features-explorer/features/ext-color-buffer-half-float; github.com/KhronosGroup/WebGL/issues/3093; webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html
- Thick lines in WebGL: cesium.com/blog/2013/04/22/robust-polyline-rendering-with-webgl; webglfundamentals.org/webgl/lessons/webgl-points-lines-triangles.html
- Determinism of Math functions: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math; rapier.rs/docs/user_guides/javascript/determinism
