import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WARNA } from '../config.js';

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const tengahY = GAME_HEIGHT / 2;

    // Latar bendera: setengah atas merah, setengah bawah putih.
    this.add.rectangle(0, 0, GAME_WIDTH, tengahY, WARNA.MERAH).setOrigin(0);
    this.add.rectangle(0, tengahY, GAME_WIDTH, tengahY, WARNA.PUTIH).setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, tengahY / 2, 'Pesta 17-an', {
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontSize: '112px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(4, 6, 'rgba(0, 0, 0, 0.35)', 0);
  }
}
