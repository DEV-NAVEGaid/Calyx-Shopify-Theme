/*
 * An animated, grainy gradient drawn with WebGL — no libraries.
 *
 * Three colors from CSS custom properties (`--grain-color-top`, `-middle`,
 * `-bottom`) blend from top to bottom. Slow noise bends the bands so they
 * drift, the pointer nudges them, and film grain sits on top. The top edge
 * stays the plain top color so it meets the page above without a seam.
 *
 * Draws only while on screen; for reduced motion it draws a single still
 * frame. Without WebGL the element stays empty and the CSS gradient behind
 * it shows instead.
 */

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pointer_strength;
uniform vec3 u_top;
uniform vec3 u_middle;
uniform vec3 u_bottom;

float random(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  float a = random(cell);
  float b = random(cell + vec2(1.0, 0.0));
  float c = random(cell + vec2(0.0, 1.0));
  float d = random(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

// Three octaves of noise: soft, slow-moving shapes.
float layeredNoise(vec2 point) {
  float total = 0.0;
  float weight = 0.55;
  for (int octave = 0; octave < 3; octave++) {
    total += weight * valueNoise(point);
    point = point * 2.1 + 3.7;
    weight *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 point = vec2(uv.x * aspect, uv.y);
  float time = u_time * 0.06;

  // Bend the vertical position with drifting noise so the bands flow.
  float driftA = layeredNoise(point * 1.4 + vec2(time, -time * 0.6));
  float driftB = layeredNoise(point * 2.3 - vec2(time * 0.8, time * 0.3) + 11.0);
  float height = uv.y + (driftA - 0.5) * 0.38 + (driftB - 0.5) * 0.16;

  // The pointer lifts the colors under it, fading with distance.
  vec2 pointer = vec2(u_pointer.x * aspect, u_pointer.y);
  float nearPointer = exp(-4.0 * distance(point, pointer));
  height += nearPointer * 0.14 * u_pointer_strength;

  // The deep color stays low; the middle color carries most of the footer.
  vec3 color = mix(u_bottom, u_middle, smoothstep(-0.05, 0.45, height));
  color = mix(color, u_top, smoothstep(0.45, 0.9, height));

  // Keep the top edge clean so the footer meets the page without a line.
  float topFade = smoothstep(0.78, 0.96, uv.y);
  color = mix(color, u_top, topFade);

  // Film grain, strongest on the darker lower part.
  float grain = random(gl_FragCoord.xy + fract(u_time * 7.0) * 113.0) - 0.5;
  color += grain * 0.09 * (1.0 - topFade);

  gl_FragColor = vec4(color, 1.0);
}
`;

// Normalizes any CSS color (hex, rgb, named) through a 2D canvas.
function cssColorToRgb(value, fallback) {
  const context = document.createElement("canvas").getContext("2d");
  context.fillStyle = fallback;
  context.fillStyle = value.trim() || fallback;
  const normalized = context.fillStyle;

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  }

  const channels = normalized.match(/[\d.]+/g) ?? [0, 0, 0];
  return channels.slice(0, 3).map((channel) => Number(channel) / 255);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

class GrainGradient extends HTMLElement {
  #canvas = null;
  #gl = null;
  #uniforms = {};
  #frame = 0;
  #visible = false;
  #startTime = performance.now();
  #pointer = { x: 0.5, y: -1, targetX: 0.5, targetY: -1, strength: 0, targetStrength: 0 };
  #resizeObserver = null;
  #intersectionObserver = null;
  #reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  connectedCallback() {
    this.#canvas = document.createElement("canvas");
    this.append(this.#canvas);

    if (!this.#setUpWebGL()) {
      this.#canvas.remove();
      return;
    }

    this.#resizeObserver = new ResizeObserver(() => this.#resize());
    this.#resizeObserver.observe(this);

    this.#intersectionObserver = new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting;
      if (this.#visible) {
        this.#requestFrame();
      }
    });
    this.#intersectionObserver.observe(this);

    this.parentElement.addEventListener("pointermove", this.#onPointerMove);
    this.parentElement.addEventListener("pointerleave", this.#onPointerLeave);
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
    this.#resize();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#frame);
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    this.parentElement?.removeEventListener("pointermove", this.#onPointerMove);
    this.parentElement?.removeEventListener("pointerleave", this.#onPointerLeave);
    document.removeEventListener("visibilitychange", this.#onVisibilityChange);
    this.#gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }

  // The loop stops while the tab is hidden; pick it up again on return.
  #onVisibilityChange = () => {
    if (!document.hidden && this.#visible) {
      this.#requestFrame();
    }
  };

  #setUpWebGL() {
    const gl = this.#canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) {
      return false;
    }

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) {
      return false;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return false;
    }
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    for (const name of ["u_resolution", "u_time", "u_pointer", "u_pointer_strength", "u_top", "u_middle", "u_bottom"]) {
      this.#uniforms[name] = gl.getUniformLocation(program, name);
    }

    this.#gl = gl;
    this.#readColors();
    return true;
  }

  #readColors() {
    const styles = getComputedStyle(this);
    const gl = this.#gl;
    gl.uniform3fv(this.#uniforms.u_top, cssColorToRgb(styles.getPropertyValue("--grain-color-top"), "#ffffff"));
    gl.uniform3fv(this.#uniforms.u_middle, cssColorToRgb(styles.getPropertyValue("--grain-color-middle"), "#e7e2f8"));
    gl.uniform3fv(this.#uniforms.u_bottom, cssColorToRgb(styles.getPropertyValue("--grain-color-bottom"), "#4a3aa8"));
  }

  #resize() {
    // Cap the pixel ratio: the grain reads well without paying for 3x screens.
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(this.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.clientHeight * ratio));
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width;
      this.#canvas.height = height;
      this.#gl.viewport(0, 0, width, height);
    }
    this.#requestFrame(true);
  }

  #onPointerMove = (event) => {
    const box = this.getBoundingClientRect();
    this.#pointer.targetX = (event.clientX - box.left) / box.width;
    this.#pointer.targetY = 1 - (event.clientY - box.top) / box.height;
    this.#pointer.targetStrength = 1;
    this.#requestFrame();
  };

  #onPointerLeave = () => {
    this.#pointer.targetStrength = 0;
  };

  #requestFrame(force = false) {
    if (this.#frame && !force) {
      return;
    }
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame((now) => this.#draw(now));
  }

  #draw(now) {
    this.#frame = 0;
    const gl = this.#gl;
    const pointer = this.#pointer;

    // Ease the pointer so the colors follow it smoothly.
    pointer.x += (pointer.targetX - pointer.x) * 0.06;
    pointer.y += (pointer.targetY - pointer.y) * 0.06;
    pointer.strength += (pointer.targetStrength - pointer.strength) * 0.04;

    const seconds = this.#reducedMotion ? 0 : (now - this.#startTime) / 1000;
    gl.uniform2f(this.#uniforms.u_resolution, this.#canvas.width, this.#canvas.height);
    gl.uniform1f(this.#uniforms.u_time, seconds);
    gl.uniform2f(this.#uniforms.u_pointer, pointer.x, pointer.y);
    gl.uniform1f(this.#uniforms.u_pointer_strength, this.#reducedMotion ? 0 : pointer.strength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (this.#visible && !this.#reducedMotion && !document.hidden) {
      this.#requestFrame();
    }
  }
}

if (!customElements.get("grain-gradient")) {
  customElements.define("grain-gradient", GrainGradient);
}
