export const DEFAULT_DATA = {
  objects: [
    {
      id: 'obj1',
      name: '木质 L 积木',
      voxels: [
        { x: 0, y: 0, z: 0, color: '#d97706', mat: 'wood' },
        { x: 1, y: 0, z: 0, color: '#d97706', mat: 'wood' },
        { x: 0, y: 1, z: 0, color: '#d97706', mat: 'wood' }
      ]
    },
    {
      id: 'obj2',
      name: '蓝水晶十字',
      voxels: [
        { x: 0, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: -1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 1, y: 0, z: 0, color: '#38bdf8', mat: 'glass' },
        { x: 0, y: 1, z: 0, color: '#38bdf8', mat: 'glass' }
      ]
    },
    {
      id: 'obj3',
      name: '紫宝石台阶',
      voxels: [
        { x: -1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 0, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 0, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 1, z: 0, color: '#8b5cf6', mat: 'gem' },
        { x: 1, y: 1, z: 1, color: '#8b5cf6', mat: 'gem' }
      ]
    }
  ],
  levels: [
    {
      id: 'lvl1',
      name: '基础旋转乐园',
      timeLimit: 70,
      speed: 4,
      scoreWin: 10,
      scoreLoss: 5,
      scoreSkip: -2,
      star1: 10,
      star2: 20,
      star3: 30,
      questions: [
        { type: 'match', obj1: 'obj1', obj2: 'obj1', rot1: [0, 0, 0, 1], rot2: [0.12, 0.5, -0.2, 0.84] },
        { type: 'mismatch', obj1: 'obj1', obj2: 'obj2', rot1: [0, 0, 0, 1], rot2: [0.3, -0.4, 0.45, 0.75] },
        { type: 'match', obj1: 'obj3', obj2: 'obj3', rot1: [0.18, 0.16, 0, 0.97], rot2: [-0.26, 0.44, 0.1, 0.85] }
      ]
    }
  ]
};
