import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager.js';

// Titik masuk game: siapkan audio, lalu memuat aset.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    AudioManager.pasang(this.game);
    this.scene.start('Preload');
  }
}
