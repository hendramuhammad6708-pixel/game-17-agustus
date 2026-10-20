import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;
    const tengahY = GAME_HEIGHT / 2;

    // Latar bendera: setengah atas merah, setengah bawah putih.
    this.add.rectangle(0, 0, GAME_WIDTH, tengahY, WARNA.MERAH).setOrigin(0);
    this.add.rectangle(0, tengahY, GAME_WIDTH, tengahY, WARNA.PUTIH).setOrigin(0);

    this.add
      .text(tengahX, tengahY / 2, 'Pesta 17-an', {
        fontFamily: FONT_JUDUL,
        fontSize: '112px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5)
      .setShadow(4, 6, 'rgba(0, 0, 0, 0.35)', 0);

    // Untuk sekarang hanya ada mode Turnamen.
    this.add.rectangle(tengahX, tengahY + 120, 420, 90, WARNA.MERAH).setStrokeStyle(6, WARNA.GELAP);
    this.add
      .text(tengahX, tengahY + 120, 'TURNAMEN', {
        fontFamily: FONT_JUDUL,
        fontSize: '44px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5);

    this.add
      .text(tengahX, tengahY + 230, 'Tekan Enter untuk memilih', {
        fontFamily: FONT_TEKS,
        fontSize: '26px',
        color: WARNA_TEKS.ABU,
      })
      .setOrigin(0.5);

    this.kontrol = new InputManager(this);
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER')) {
      GameState.reset();
      this.scene.start('PlayerSelect');
    }
  }
}
