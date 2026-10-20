import Phaser from 'phaser';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

// Urutan finish dan poin ronde yang baru selesai.
export default class RoundResult extends Phaser.Scene {
  constructor() {
    super('RoundResult');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;
    const { nama } = this.scene.get(GameState.miniGameSekarang).info;

    this.cameras.main.setBackgroundColor(WARNA.KREM);
    this.add.rectangle(0, 0, GAME_WIDTH, 110, WARNA.MERAH).setOrigin(0);
    this.add
      .text(tengahX, 55, `Hasil Ronde ${GameState.ronde + 1}`, {
        fontFamily: FONT_JUDUL,
        fontSize: '52px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5);
    this.add
      .text(tengahX, 150, nama, { fontFamily: FONT_TEKS, fontSize: '30px', color: WARNA_TEKS.GELAP })
      .setOrigin(0.5);

    GameState.hasilRonde.forEach((h, i) => {
      const p = GameState.ambilPemain(h.id);
      const y = 240 + i * 95;

      this.add.rectangle(tengahX, y, 760, 80, WARNA.PUTIH).setStrokeStyle(4, p.warna);
      this.add
        .text(320, y, `${h.posisi}.`, { fontFamily: FONT_JUDUL, fontSize: '40px', color: WARNA_TEKS.GELAP })
        .setOrigin(0.5);
      this.add.circle(400, y, 26, p.warna).setStrokeStyle(3, WARNA.GELAP);
      this.add
        .text(450, y, p.nama, { fontFamily: FONT_JUDUL, fontSize: '32px', color: WARNA_TEKS.GELAP })
        .setOrigin(0, 0.5);
      this.add
        .text(980, y, `+${h.poin} poin`, { fontFamily: FONT_JUDUL, fontSize: '32px', color: WARNA_TEKS.MERAH })
        .setOrigin(1, 0.5);
    });

    this.add
      .text(tengahX, 660, 'Tekan Enter untuk lanjut', {
        fontFamily: FONT_TEKS,
        fontSize: '28px',
        color: WARNA_TEKS.ABU,
      })
      .setOrigin(0.5);

    this.kontrol = new InputManager(this);
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER')) {
      this.scene.start('Scoreboard');
    }
  }
}
