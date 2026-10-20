import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import Menu from './scenes/Menu.js';
import PlayerSelect from './scenes/PlayerSelect.js';
import Instructions from './scenes/Instructions.js';
import RoundResult from './scenes/RoundResult.js';
import Scoreboard from './scenes/Scoreboard.js';
import Podium from './scenes/Podium.js';
import BalapKarung from './minigames/BalapKarung.js';
import MakanKerupuk from './minigames/MakanKerupuk.js';
import PanjatPinang from './minigames/PanjatPinang.js';

const config = {
  type: Phaser.AUTO, // WebGL, otomatis fallback ke Canvas
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preload, Menu, PlayerSelect, Instructions, BalapKarung, MakanKerupuk, PanjatPinang, RoundResult, Scoreboard, Podium],
};

export default new Phaser.Game(config);
