import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager.js';

// Titik masuk game: cari file audio yang sudah tersedia, lalu memuat aset.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    AudioManager.pasang(this.game);
    AudioManager.periksaFile().then(() => this.scene.start('Preload'));
  }
}
