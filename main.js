import BootScene from './scenes/BootScene.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import GameSelectScene from './scenes/GameSelectScene.js';
import FishMiniGame from './scenes/FishMiniGame.js';
import MouseMiniGame from './scenes/MouseMiniGame.js';
import MemoryMiniGame from './scenes/MemoryMiniGame.js';
import YarnMiniGame from './scenes/YarnMiniGame.js';
import TetrisMiniGame from './scenes/TetrisMiniGame.js';
import FlyMiniGame from './scenes/FlyMiniGame.js';
import MilkMiniGame from './scenes/MilkMiniGame.js';
import LootMiniGame from './scenes/LootMiniGame.js';
import BirdMiniGame from './scenes/BirdMiniGame.js';
import DreamMiniGame from './scenes/DreamMiniGame.js';
import IdCardScene from './scenes/IdCardScene.js';
import WardrobeScene from './scenes/WardrobeScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 360,
  parent: 'game-container',
  backgroundColor: '#16213e',
  pixelArt: true,
  antialias: false,
  scene: [
    BootScene, IntroScene, GameScene, GameSelectScene,
    FishMiniGame, MouseMiniGame, MemoryMiniGame, YarnMiniGame,
    TetrisMiniGame, FlyMiniGame, MilkMiniGame, LootMiniGame, BirdMiniGame,
    DreamMiniGame, IdCardScene, WardrobeScene,
  ],
  scale: {
    mode: Phaser.Scale.NONE,
  },
};

const game = new Phaser.Game(config);

// Global erişim için
window.catGame = game;
