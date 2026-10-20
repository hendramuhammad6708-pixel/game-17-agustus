import Phaser from 'phaser';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS, MIN_PEMAIN } from '../config.js';
import GameState, { DATA_PEMAIN } from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

const LEBAR_KARTU = 260;
const TINGGI_KARTU = 330;
const JARAK_KARTU = 30;

export default class PlayerSelect extends Phaser.Scene {
  constructor() {
    super('PlayerSelect');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;

    this.cameras.main.setBackgroundColor(WARNA.KREM);
    this.add.rectangle(0, 0, GAME_WIDTH, 110, WARNA.MERAH).setOrigin(0);
    this.add
      .text(tengahX, 55, 'Pilih Pemain', { fontFamily: FONT_JUDUL, fontSize: '52px', color: WARNA_TEKS.PUTIH })
      .setOrigin(0.5);

    this.add
      .text(tengahX, 165, 'Tekan Tombol 1 milikmu untuk ikut bermain', {
        fontFamily: FONT_TEKS,
        fontSize: '30px',
        color: WARNA_TEKS.GELAP,
      })
      .setOrigin(0.5);

    this.bergabung = new Set();
    this.kartu = DATA_PEMAIN.map((p, i) => this.buatKartu(p, i));

    this.petunjuk = this.add
      .text(tengahX, 640, '', { fontFamily: FONT_JUDUL, fontSize: '32px' })
      .setOrigin(0.5);
    this.perbaruiPetunjuk();

    this.kontrol = new InputManager(this);
  }

  buatKartu(p, i) {
    const kiri = (GAME_WIDTH - (4 * LEBAR_KARTU + 3 * JARAK_KARTU)) / 2;
    const x = kiri + LEBAR_KARTU / 2 + i * (LEBAR_KARTU + JARAK_KARTU);
    const y = 390;
    const gayaTeks = { fontFamily: FONT_TEKS, fontSize: '24px', color: WARNA_TEKS.GELAP };

    this.add.rectangle(x, y, LEBAR_KARTU, TINGGI_KARTU, WARNA.PUTIH).setStrokeStyle(6, p.warna);
    const badan = this.add.circle(x, y - 90, 50, p.warna).setAlpha(0.25);
    this.add
      .text(x, y - 5, p.nama, { fontFamily: FONT_JUDUL, fontSize: '30px', color: WARNA_TEKS.GELAP })
      .setOrigin(0.5);
    this.add.text(x, y + 30, p.namaWarna, gayaTeks).setOrigin(0.5);
    this.add
      .text(x, y + 65, `Tombol: ${InputManager.label(p.id, 1)} / ${InputManager.label(p.id, 2)}`, gayaTeks)
      .setOrigin(0.5);

    const pil = this.add.rectangle(x, y + 125, 200, 52, WARNA.ABU);
    const status = this.add
      .text(x, y + 125, `Tekan ${InputManager.label(p.id, 1)}`, {
        fontFamily: FONT_JUDUL,
        fontSize: '26px',
        color: WARNA_TEKS.ABU,
      })
      .setOrigin(0.5);

    return { badan, pil, status };
  }

  gabung(p) {
    this.bergabung.add(p.id);
    const { badan, pil, status } = this.kartu[p.id - 1];
    badan.setAlpha(1);
    pil.setFillStyle(p.warna);
    status.setText('SIAP!').setColor(p.warnaTeks);
    this.perbaruiPetunjuk();
  }

  perbaruiPetunjuk() {
    if (this.bergabung.size >= MIN_PEMAIN) {
      this.petunjuk.setText('Tekan Enter untuk mulai!').setColor(WARNA_TEKS.MERAH);
    } else {
      this.petunjuk.setText(`Minimal ${MIN_PEMAIN} pemain untuk mulai`).setColor(WARNA_TEKS.ABU);
    }
  }

  update() {
    for (const p of DATA_PEMAIN) {
      if (!this.bergabung.has(p.id) && this.kontrol.justPressed(p.id, 1)) {
        this.gabung(p);
      }
    }

    if (this.kontrol.menuDitekan('ENTER') && this.bergabung.size >= MIN_PEMAIN) {
      GameState.aturPemain([...this.bergabung]);
      GameState.mulaiTurnamen();
      this.scene.start('Instructions');
    }
  }
}
