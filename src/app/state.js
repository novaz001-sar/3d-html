import { loadData, loadFontScale, loadLanguage, loadMenuMusicEnabled } from '../services/storage.js';

export function createInitialState() {
  return {
    lang: loadLanguage(),
    fontScale: loadFontScale(),
    musicEnabled: loadMenuMusicEnabled(),
    screen: 'main',
    editorTab: 'objects',
    paused: false,
    showManual: false,
    data: loadData(),
    voxel: {
      name: '',
      color: '#d97706',
      mat: 'wood',
      layer: 0,
      voxels: [],
      editingId: null,
      previewQ: [0.25, -0.35, 0, 0.9]
    },
    logic: {
      currentPackIndex: -1,
      editingPack: null,
      editingQ: null,
      editingQIndex: -1
    },
    game: {
      level: null,
      qIndex: 0,
      score: 0,
      timeLeft: 0,
      timer: null,
      zoom: 1,
      leftQ: [0, 0, 0, 1],
      rightQ: [0, 0, 0, 1],
      leftAuto: 0,
      feedback: '',
      feedbackKind: 'good',
      lastT: 0
    },
    result: {
      stars: 0,
      score: 0
    }
  };
}
