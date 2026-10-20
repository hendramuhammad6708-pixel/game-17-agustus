import Phaser from 'phaser';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

const LANTAI_Y = 600;
const LEBAR_BALOK = 240;
const TINGGI_BALOK = { 1: 230, 2: 160, 3: 110 };

// 3 besar turnamen. Juara 1 di tengah, juara 2 di kiri, juara 3 di kanan.
export default class Podium extends Phaser.Scene {
  constructor() {
    super('Podium');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;
    const posisiX = [tengahX, tengahX - 280, tengahX + 280];
    const peringkat = GameState.peringkat();

    this.cameras.main.setBackgroundColor(WARNA.KREM);
    this.add.rectangle(0, 0, GAME_WIDTH, 110, WARNA.MERAH).setOrigin(0);
    this.add
      .text(tengahX, 55, 'Juara Pesta 17-an', { fontFamily: FONT_JUDUL, fontSize: '52px', color: WARNA_TEKS.PUTIH })
      .setOrigin(0.5);

    peringkat.slice(0, 3).forEach((p, i) => {
      const x = posisiX[i];
      const tinggi = TINGGI_BALOK[p.peringkat];
      const atasBalok = LANTAI_Y - tinggi;

      this.add.rectangle(x, LANTAI_Y - tinggi / 2, LEBAR_BALOK, tinggi, WARNA.MERAH).setStrokeStyle(4, WARNA.GELAP);
      this.add
        .text(x, atasBalok + 50, String(p.peringkat), {
          fontFamily: FONT_JUDUL,
          fontSize: '64px',
          color: WARNA_TEKS.PUTIH,
        })
        .setOrigin(0.5);
      this.add.circle(x, atasBalok - 48, 44, p.warna).setStrokeStyle(4, WARNA.GELAP);
      this.add
        .text(x, atasBalok - 150, p.nama, { fontFamily: FONT_JUDUL, fontSize: '28px', color: WARNA_TEKS.GELAP })
        .setOrigin(0.5);
      this.add
        .text(x, atasBalok - 118, `${p.skor} poin`, {
          fontFamily: FONT_TEKS,
          fontSize: '24px',
          color: WARNA_TEKS.GELAP,
        })
        .setOrigin(0.5);
    });

    const lainnya = peringkat
      .slice(3)
      .map((p) => `Peringkat ${p.peringkat}: ${p.nama} (${p.skor} poin)`)
      .join('   ·   ');
    this.add
      .text(tengahX, 635, lainnya, { fontFamily: FONT_TEKS, fontSize: '24px', color: WARNA_TEKS.GELAP })
      .setOrigin(0.5);

    this.add
      .text(tengahX, 685, 'Tekan Enter untuk main lagi', {
        fontFamily: FONT_TEKS,
        fontSize: '28px',
        color: WARNA_TEKS.ABU,
      })
      .setOrigin(0.5);

    this.kontrol = new InputManager(this);
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER')) {
      GameState.reset();
      this.scene.start('Menu');
    }
  }
}
