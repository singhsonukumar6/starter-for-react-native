/**
 * LemoLearn Lottie Animation Data
 * Inline JSON animations so we don't need external files
 */

// Simple bouncing lemon animation
export const lemonBounce = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  assets: [] as any[],
  layers: [{
    ty: 4,
    nm: "circle",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60, s: [360] }] },
      p: { a: 1, k: [
        { t: 0, s: [100, 120, 0], e: [100, 80, 0], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
        { t: 15, s: [100, 80, 0], e: [100, 120, 0], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
        { t: 30, s: [100, 120, 0], e: [100, 80, 0], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
        { t: 45, s: [100, 80, 0], e: [100, 120, 0], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
        { t: 60, s: [100, 120, 0] }
      ]},
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [
        { t: 0, s: [100, 100, 100], e: [110, 90, 100] },
        { t: 15, s: [110, 90, 100], e: [100, 100, 100] },
        { t: 30, s: [100, 100, 100], e: [110, 90, 100] },
        { t: 45, s: [110, 90, 100], e: [100, 100, 100] },
        { t: 60, s: [100, 100, 100] }
      ]}
    },
    shapes: [{
      ty: "el",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [80, 80] }
    }, {
      ty: "fl",
      c: { a: 0, k: [1, 0.85, 0.2, 1] },
      o: { a: 0, k: 100 }
    }],
    ip: 0, op: 60, st: 0
  }]
};

// Confetti/celebration animation
export const celebration = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 90,
  w: 300,
  h: 300,
  assets: [] as any[],
  layers: Array.from({ length: 12 }, (_, i) => ({
    ty: 4,
    nm: `particle_${i}`,
    sr: 1,
    ks: {
      o: { a: 1, k: [{ t: 0, s: [0] }, { t: 10, s: [100] }, { t: 70, s: [100] }, { t: 90, s: [0] }] },
      r: { a: 1, k: [{ t: 0, s: [0], e: [360 + Math.random() * 360] }, { t: 90, s: [360 + Math.random() * 360] }] },
      p: { a: 1, k: [
        { t: 0, s: [150, 150, 0], e: [150 + (Math.random() - 0.5) * 250, 150 + (Math.random() - 0.5) * 250, 0] },
        { t: 90, s: [150 + (Math.random() - 0.5) * 250, 150 + (Math.random() - 0.5) * 250, 0] }
      ]},
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [{ t: 0, s: [0, 0, 100] }, { t: 15, s: [100, 100, 100] }, { t: 75, s: [100, 100, 100] }, { t: 90, s: [0, 0, 100] }] }
    },
    shapes: [{
      ty: "rc",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [10 + Math.random() * 8, 10 + Math.random() * 8] },
      r: { a: 0, k: 3 }
    }, {
      ty: "fl",
      c: { a: 0, k: [
        [1, 0.42, 0.42, 1],
        [1, 0.65, 0.15, 1],
        [0.42, 0.39, 1, 1],
        [0.30, 0.69, 0.31, 1],
        [1, 0.84, 0.31, 1],
        [0.26, 0.65, 0.85, 1],
      ][i % 6] },
      o: { a: 0, k: 100 }
    }],
    ip: 0, op: 90, st: Math.random() * 10
  }))
};

// Checkmark success animation
export const checkSuccess = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 40,
  w: 200,
  h: 200,
  assets: [] as any[],
  layers: [
    {
      ty: 4,
      nm: "circle_bg",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [0, 0, 100], e: [100, 100, 100] }, { t: 15, s: [100, 100, 100] }] }
      },
      shapes: [{
        ty: "el",
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [120, 120] }
      }, {
        ty: "fl",
        c: { a: 0, k: [0.30, 0.69, 0.31, 1] },
        o: { a: 0, k: 100 }
      }],
      ip: 0, op: 40, st: 0
    }
  ]
};

// Loading dots animation
export const loadingDots = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 40,
  assets: [] as any[],
  layers: [0, 1, 2].map((i) => ({
    ty: 4,
    nm: `dot_${i}`,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [25 + i * 35, 20, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [
        { t: 0 + i * 5, s: [80, 80, 100], e: [120, 120, 100] },
        { t: 10 + i * 5, s: [120, 120, 100], e: [80, 80, 100] },
        { t: 20 + i * 5, s: [80, 80, 100] },
        { t: 60, s: [80, 80, 100] }
      ]}
    },
    shapes: [{
      ty: "el",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [14, 14] }
    }, {
      ty: "fl",
      c: { a: 0, k: [0.42, 0.39, 1, 1] },
      o: { a: 0, k: 100 }
    }],
    ip: 0, op: 60, st: 0
  }))
};

// Fire/streak animation
export const fireStreak = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 120,
  assets: [] as any[],
  layers: [{
    ty: 4,
    nm: "flame",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 1, k: [
        { t: 0, s: [-3], e: [3] },
        { t: 15, s: [3], e: [-3] },
        { t: 30, s: [-3], e: [3] },
        { t: 45, s: [3], e: [-3] },
        { t: 60, s: [-3] }
      ]},
      p: { a: 0, k: [50, 60, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [
        { t: 0, s: [95, 95, 100], e: [105, 105, 100] },
        { t: 15, s: [105, 105, 100], e: [95, 95, 100] },
        { t: 30, s: [95, 95, 100], e: [105, 105, 100] },
        { t: 45, s: [105, 105, 100], e: [95, 95, 100] },
        { t: 60, s: [95, 95, 100] }
      ]}
    },
    shapes: [{
      ty: "el",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [60, 80] }
    }, {
      ty: "fl",
      c: { a: 0, k: [1, 0.42, 0.22, 1] },
      o: { a: 0, k: 100 }
    }],
    ip: 0, op: 60, st: 0
  }]
};
