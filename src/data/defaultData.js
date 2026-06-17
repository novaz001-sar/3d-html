export const DEFAULT_DATA = {
  objects: [
    {
      id: 'hook-a',
      name: 'Hook Cat A',
      voxels: [
        { x: 0, y: 0, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 1, y: 0, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 0, y: 1, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 0, y: 1, z: 1, color: '#ffb24d', mat: 'wood' }
      ]
    },
    {
      id: 'hook-b',
      name: 'Hook Cat B',
      voxels: [
        { x: 0, y: 0, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 1, y: 0, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 0, y: 1, z: 0, color: '#ffb24d', mat: 'wood' },
        { x: 1, y: 0, z: 1, color: '#ffb24d', mat: 'wood' }
      ]
    },
    {
      id: 'bridge-a',
      name: 'Moon Bridge A',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 0, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: -1, y: 1, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 1, y: 1, z: 0, color: '#38bdf8', mat: 'glass' }
      ]
    },
    {
      id: 'bridge-b',
      name: 'Moon Bridge B',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 0, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: -1, y: 1, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 1, y: 0, z: 1, color: '#38bdf8', mat: 'glass' }
      ]
    },
    {
      id: 'paw-stack-a',
      name: 'Paw Stack A',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 1, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 1, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 1, z: 1, color: '#8b5cf6', mat: 'gem' }
      ]
    },
    {
      id: 'paw-stack-b',
      name: 'Paw Stack B',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 1, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 1, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 1, z: 1, color: '#8b5cf6', mat: 'gem' }
      ]
    },
    {
      id: 'star-arch-a',
      name: 'Star Arch A',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 0, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 1, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: -1, y: 1, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 1, y: 1, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 0, y: 1, z: 1, color: '#ff6aa2', mat: 'gem' },
        { x: 0, y: 2, z: 1, color: '#ff6aa2', mat: 'gem' }
      ]
    },
    {
      id: 'star-arch-b',
      name: 'Star Arch B',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 0, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 1, y: 0, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: -1, y: 1, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 1, y: 1, z: 0, color: '#ff6aa2', mat: 'gem' },
        { x: 0, y: 1, z: 1, color: '#ff6aa2', mat: 'gem' },
        { x: 1, y: 2, z: 1, color: '#ff6aa2', mat: 'gem' }
      ]
    }
  ],
  levels: [
    {
      id: 'lvl1',
      name: 'Tiny Orbit',
      timeLimit: 70,
      speed: 4,
      scoreWin: 10,
      scoreLoss: 5,
      scoreSkip: -2,
      star1: 10,
      star2: 20,
      star3: 30,
      questions: [
        { type: 'match', obj1: 'hook-a', obj2: 'hook-a', rot1: [0, 0, 0, 1], rot2: [0.12, 0.5, -0.2, 0.84] },
        { type: 'mismatch', obj1: 'hook-a', obj2: 'hook-b', rot1: [0.18, 0.16, 0, 0.97], rot2: [0.3, -0.4, 0.45, 0.75] },
        { type: 'match', obj1: 'bridge-a', obj2: 'bridge-a', rot1: [0.22, -0.1, 0.2, 0.95], rot2: [-0.26, 0.44, 0.1, 0.85] }
      ]
    },
    {
      id: 'lvl2',
      name: 'Mirror Paws',
      timeLimit: 85,
      speed: 5,
      scoreWin: 12,
      scoreLoss: 6,
      scoreSkip: -3,
      star1: 18,
      star2: 36,
      star3: 54,
      questions: [
        { type: 'match', obj1: 'bridge-a', obj2: 'bridge-a', rot1: [0.2, 0.3, -0.1, 0.92], rot2: [-0.18, 0.45, 0.24, 0.84] },
        { type: 'mismatch', obj1: 'bridge-a', obj2: 'bridge-b', rot1: [0.34, -0.18, 0.22, 0.89], rot2: [-0.28, 0.38, -0.16, 0.87] },
        { type: 'match', obj1: 'paw-stack-a', obj2: 'paw-stack-a', rot1: [0.1, 0.42, 0.12, 0.89], rot2: [0.38, -0.24, 0.2, 0.87] },
        { type: 'mismatch', obj1: 'paw-stack-a', obj2: 'paw-stack-b', rot1: [-0.22, 0.34, 0.18, 0.9], rot2: [0.28, 0.2, -0.36, 0.87] },
        { type: 'match', obj1: 'hook-b', obj2: 'hook-b', rot1: [0.26, -0.16, 0.34, 0.88], rot2: [-0.36, 0.18, 0.26, 0.87] }
      ]
    },
    {
      id: 'lvl3',
      name: 'Twin Star Trial',
      timeLimit: 105,
      speed: 6,
      scoreWin: 15,
      scoreLoss: 8,
      scoreSkip: -4,
      star1: 30,
      star2: 60,
      star3: 90,
      questions: [
        { type: 'mismatch', obj1: 'star-arch-a', obj2: 'star-arch-b', rot1: [0.36, -0.22, 0.18, 0.88], rot2: [-0.16, 0.48, 0.24, 0.83] },
        { type: 'match', obj1: 'star-arch-a', obj2: 'star-arch-a', rot1: [0.18, 0.44, -0.28, 0.83], rot2: [0.42, -0.14, 0.3, 0.85] },
        { type: 'mismatch', obj1: 'paw-stack-a', obj2: 'paw-stack-b', rot1: [-0.34, 0.26, 0.22, 0.87], rot2: [0.2, -0.46, 0.18, 0.84] },
        { type: 'mismatch', obj1: 'bridge-b', obj2: 'bridge-a', rot1: [0.24, 0.24, -0.38, 0.86], rot2: [-0.28, 0.36, 0.2, 0.86] },
        { type: 'match', obj1: 'paw-stack-b', obj2: 'paw-stack-b', rot1: [0.4, -0.2, 0.28, 0.85], rot2: [-0.18, 0.24, 0.44, 0.84] },
        { type: 'match', obj1: 'bridge-b', obj2: 'bridge-b', rot1: [-0.24, 0.42, 0.12, 0.86], rot2: [0.34, -0.26, 0.3, 0.84] },
        { type: 'mismatch', obj1: 'hook-a', obj2: 'hook-b', rot1: [0.22, 0.5, -0.18, 0.82], rot2: [-0.42, 0.16, 0.28, 0.85] }
      ]
    }
  ]
};
