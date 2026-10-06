// ---------------------------------------------------------------------------
// Geometric primitives
//
// Every create* function returns a plain object:
//   { positions: Float32Array, colors: Float32Array, indices: Uint16Array }
// so it can be dropped straight into a WebGL buffer the same way the
// original cube data was used.
// ---------------------------------------------------------------------------

function makeGeometry(positions, colors, indices) {
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}

// ---- Cube -----------------------------------------------------------------
function createCube(size = 1) {
  const s = size;
  const positions = [
    -s, -s, -s,  // 0
     s, -s, -s,  // 1
     s,  s, -s,  // 2
    -s,  s, -s,  // 3
    -s, -s,  s,  // 4
     s, -s,  s,  // 5
     s,  s,  s,  // 6
    -s,  s,  s   // 7
  ];

  const colors = [
    1, 0, 0,  0, 1, 0,  0, 0, 1,  1, 1, 0,
    1, 0, 1,  0, 1, 1,  1, 1, 0,  1, 0, 1
  ];

  const indices = [
    // Front
    4, 5, 6,   4, 6, 7,
    // Back
    1, 0, 3,   1, 3, 2,
    // Top
    3, 7, 6,   3, 6, 2,
    // Bottom
    0, 1, 5,   0, 5, 4,
    // Right
    1, 2, 6,   1, 6, 5,
    // Left
    0, 4, 7,   0, 7, 3,
  ];

  return makeGeometry(positions, colors, indices);
}

// ---- Box (arbitrary width/height/depth, solid color) -----------------------
// Unlike createCube (a unit cube meant to be scaled via a transform matrix),
// this bakes the actual dimensions and a single solid color directly into
// the geometry. That's convenient for building hierarchical models (robot
// arm segments, fingers, etc.) where each segment's *own* length shouldn't
// be inherited as a scale by its children down the chain.
function createBox(w = 1, h = 1, d = 1, color = [0.7, 0.7, 0.7]) {
  const x = w / 2, y = h / 2, z = d / 2;
  const positions = [
    -x, -y, -z,  // 0
     x, -y, -z,  // 1
     x,  y, -z,  // 2
    -x,  y, -z,  // 3
    -x, -y,  z,  // 4
     x, -y,  z,  // 5
     x,  y,  z,  // 6
    -x,  y,  z   // 7
  ];

  const colors = [];
  for (let i = 0; i < 8; i++) colors.push(color[0], color[1], color[2]);

  const indices = [
    4, 5, 6,   4, 6, 7,
    1, 0, 3,   1, 3, 2,
    3, 7, 6,   3, 6, 2,
    0, 1, 5,   0, 5, 4,
    1, 2, 6,   1, 6, 5,
    0, 4, 7,   0, 7, 3,
  ];

  return makeGeometry(positions, colors, indices);
}

// Backwards-compatible module-level cube data (used by the original hw3.html)
const positions = createCube().positions;
const colors = createCube().colors;
const indices = createCube().indices;

// ---- Sphere (lat/long) -----------------------------------------------------
function createSphere(radius = 1, latBands = 20, longBands = 20) {
  const positions = [];
  const colors = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = lat * Math.PI / latBands;
    const sinTheta = Math.sin(theta), cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longBands; lon++) {
      const phi = lon * 2 * Math.PI / longBands;
      const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      colors.push(0.5 + 0.5 * x, 0.5 + 0.5 * y, 0.5 + 0.5 * z);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < longBands; lon++) {
      const first = lat * (longBands + 1) + lon;
      const second = first + longBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return makeGeometry(positions, colors, indices);
}

// ---- Cylinder ---------------------------------------------------------------
function createCylinder(radius = 1, height = 2, radialSegments = 20) {
  const positions = [];
  const colors = [];
  const indices = [];
  const halfH = height / 2;

  // side rings: for each segment, push a bottom vertex then a top vertex
  for (let i = 0; i <= radialSegments; i++) {
    const theta = i * 2 * Math.PI / radialSegments;
    const x = Math.cos(theta) * radius, z = Math.sin(theta) * radius;

    positions.push(x, -halfH, z);
    colors.push(1.0, 0.55, 0.1);

    positions.push(x, halfH, z);
    colors.push(1.0, 0.8, 0.25);
  }

  for (let i = 0; i < radialSegments; i++) {
    const bl = i * 2, tl = i * 2 + 1, br = (i + 1) * 2, tr = (i + 1) * 2 + 1;
    indices.push(bl, br, tl);
    indices.push(br, tr, tl);
  }

  // caps
  const bottomCenter = positions.length / 3;
  positions.push(0, -halfH, 0); colors.push(1.0, 0.55, 0.1);
  const topCenter = bottomCenter + 1;
  positions.push(0, halfH, 0); colors.push(1.0, 0.8, 0.25);

  for (let i = 0; i < radialSegments; i++) {
    const bl = i * 2, br = (i + 1) * 2;
    indices.push(bottomCenter, br, bl);

    const tl = i * 2 + 1, tr = (i + 1) * 2 + 1;
    indices.push(topCenter, tl, tr);
  }

  return makeGeometry(positions, colors, indices);
}

// ---- Cone -------------------------------------------------------------------
function createCone(radius = 1, height = 2, radialSegments = 20) {
  const positions = [];
  const colors = [];
  const indices = [];
  const halfH = height / 2;

  // apex
  positions.push(0, halfH, 0);
  colors.push(1, 1, 1);
  const apexIdx = 0;

  // base ring
  for (let i = 0; i <= radialSegments; i++) {
    const theta = i * 2 * Math.PI / radialSegments;
    const x = Math.cos(theta) * radius, z = Math.sin(theta) * radius;
    positions.push(x, -halfH, z);
    colors.push(0.25 + 0.5 * (0.5 + 0.5 * Math.cos(theta)), 0.25, 0.85);
  }

  for (let i = 1; i <= radialSegments; i++) {
    indices.push(apexIdx, i, i + 1);
  }

  // base cap
  const centerIdx = positions.length / 3;
  positions.push(0, -halfH, 0);
  colors.push(0.25, 0.25, 0.85);
  for (let i = 1; i <= radialSegments; i++) {
    indices.push(centerIdx, i + 1, i);
  }

  return makeGeometry(positions, colors, indices);
}

// ---- Torus --------------------------------------------------------------------
function createTorus(radius = 1, tubeRadius = 0.35, radialSegments = 24, tubularSegments = 24) {
  const positions = [];
  const colors = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j++) {
    const v = j * 2 * Math.PI / radialSegments;
    const cv = Math.cos(v), sv = Math.sin(v);

    for (let i = 0; i <= tubularSegments; i++) {
      const u = i * 2 * Math.PI / tubularSegments;
      const cu = Math.cos(u), su = Math.sin(u);

      const x = (radius + tubeRadius * cv) * cu;
      const y = tubeRadius * sv;
      const z = (radius + tubeRadius * cv) * su;

      positions.push(x, y, z);
      colors.push(0.5 + 0.5 * cu, 0.5 + 0.5 * sv, 0.85);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = j * (tubularSegments + 1) + i;
      const b = a + tubularSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return makeGeometry(positions, colors, indices);
}

// Lookup table used by the UI in hw3.html to add new objects by name.
const PRIMITIVE_FACTORY = {
  cube: () => createCube(0.7),
  sphere: () => createSphere(0.8, 20, 20),
  cylinder: () => createCylinder(0.6, 1.4, 20),
  cone: () => createCone(0.7, 1.4, 20),
  torus: () => createTorus(0.7, 0.28, 24, 24)
};
