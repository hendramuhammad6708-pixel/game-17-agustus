import Phaser from 'phaser';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS, POIN_POSISI } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

const PANJANG_BILAH = 460;

// Skor kumulatif setelah setiap ronde.
export default class Scoreboard extends Phaser.Scene {
  constructor() {
    super('Scoreboard');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;
    const skorMaks = POIN_POSISI[0] * GameState.jumlahRonde;

    this.cameras.main.setBackgroundColor(WARNA.KREM);
    this.add.rectangle(0, 0, GAME_WIDTH, 110, WARNA.MERAH).setOrigin(0);
    this.add
      .text(tengahX, 55, 'Papan Skor', { fontFamily: FONT_JUDUL, fontSize: '52px', color: WARNA_TEKS.PUTIH })
      .setOrigin(0.5);
    this.add
      .text(tengahX, 150, `Setelah ronde ${GameState.ronde + 1} dari ${GameState.jumlahRonde}`, {
        fontFamily: FONT_TEKS,
        fontSize: '30px',
        color: WARNA_TEKS.GELAP,
      })
      .setOrigin(0.5);

    GameState.peringkat().forEach((p, i) => {
      const y = 240 + i * 95;
      const poinRonde = GameState.hasilRonde.find((h) => h.id === p.id)?.poin ?? 0;

      this.add
        .text(160, y, `${p.peringkat}.`, { fontFamily: FONT_JUDUL, fontSize: '40px', color: WARNA_TEKS.GELAP })
        .setOrigin(0.5);
      this.add
        .text(210, y, p.nama, { fontFamily: FONT_JUDUL, fontSize: '30px', color: WARNA_TEKS.GELAP })
        .setOrigin(0, 0.5);
      this.add.rectangle(450, y, PANJANG_BILAH, 44, WARNA.ABU).setOrigin(0, 0.5);
      this.add
        .rectangle(450, y, Math.max(8, (PANJANG_BILAH * p.skor) / skorMaks), 44, p.warna)
        .setOrigin(0, 0.5);
      this.add
        .text(940, y, `${p.skor} poin`, { fontFamily: FONT_JUDUL, fontSize: '30px', color: WARNA_TEKS.GELAP })
        .setOrigin(0, 0.5);
      this.add
        .text(1110, y, `(+${poinRonde})`, { fontFamily: FONT_TEKS, fontSize: '26px', color: WARNA_TEKS.MERAH })
        .setOrigin(0, 0.5);
    });

    const petunjuk = GameState.adaRondeBerikutnya()
      ? 'Tekan Enter untuk ronde berikutnya'
      : 'Tekan Enter untuk melihat podium';
    this.add
      .text(tengahX, 660, petunjuk, { fontFamily: FONT_TEKS, fontSize: '28px', color: WARNA_TEKS.ABU })
      .setOrigin(0.5);

    this.kontrol = new InputManager(this);
  }

  update() {
    if (!this.kontrol.menuDitekan('ENTER')) {
      return;
    }
    if (GameState.adaRondeBerikutnya()) {
      GameState.lanjutRonde();
      this.scene.start('Instructions');
    } else {
      this.scene.start('Podium');
    }
  }
}
