import Phaser from 'phaser';

// Titik masuk game. Belum ada yang perlu disiapkan, jadi langsung memuat aset.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Preload');
  }
}
