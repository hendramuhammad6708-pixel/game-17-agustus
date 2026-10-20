import Phaser from 'phaser';

// Titik masuk game. Belum ada yang perlu disiapkan, jadi langsung ke Menu.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Menu');
  }
}
