import Phaser from 'phaser';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS, DURASI_INSTRUKSI } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

const LEBAR_KARTU = 250;
const JARAK_KARTU = 30;

// Tampil selama DURASI_INSTRUKSI detik sebelum mini-game, lalu otomatis lanjut.
export default class Instructions extends Phaser.Scene {
  constructor() {
    super('Instructions');
  }

  create() {
    const tengahX = GAME_WIDTH / 2;
    const kunci = GameState.miniGameSekarang;
    const { nama, caraMain, tombol } = this.scene.get(kunci).info;

    this.cameras.main.setBackgroundColor(WARNA.KREM);
    this.add.rectangle(0, 0, GAME_WIDTH, 110, WARNA.MERAH).setOrigin(0);
    this.add
      .text(tengahX, 55, `Ronde ${GameState.ronde + 1} dari ${GameState.jumlahRonde}`, {
        fontFamily: FONT_JUDUL,
        fontSize: '44px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5);

    this.add
      .text(tengahX, 195, nama, { fontFamily: FONT_JUDUL, fontSize: '72px', color: WARNA_TEKS.MERAH })
      .setOrigin(0.5);
    this.add
      .text(tengahX, 275, caraMain, {
        fontFamily: FONT_TEKS,
        fontSize: '32px',
        color: WARNA_TEKS.GELAP,
        align: 'center',
        wordWrap: { width: 1000 },
      })
      .setOrigin(0.5);

    // Kartu tombol untuk setiap pemain aktif.
    const jumlah = GameState.pemain.length;
    const kiri = (GAME_WIDTH - (jumlah * LEBAR_KARTU + (jumlah - 1) * JARAK_KARTU)) / 2;
    GameState.pemain.forEach((p, i) => {
      const x = kiri + LEBAR_KARTU / 2 + i * (LEBAR_KARTU + JARAK_KARTU);
      const daftarTombol = tombol.map((t) => `Tombol ${t} = ${InputManager.label(p.id, t)}`).join('\n');

      this.add.rectangle(x, 450, LEBAR_KARTU, 170, p.warna).setStrokeStyle(4, WARNA.GELAP);
      this.add
        .text(x, 400, p.nama, { fontFamily: FONT_JUDUL, fontSize: '28px', color: p.warnaTeks })
        .setOrigin(0.5);
      this.add
        .text(x, 475, daftarTombol, {
          fontFamily: FONT_JUDUL,
          fontSize: '26px',
          color: p.warnaTeks,
          align: 'center',
          lineSpacing: 8,
        })
        .setOrigin(0.5);
    });

    // Bilah waktu yang menyusut sampai mini-game dimulai.
    this.add
      .text(tengahX, 590, 'Bersiap...', { fontFamily: FONT_TEKS, fontSize: '26px', color: WARNA_TEKS.ABU })
      .setOrigin(0.5);
    this.add.rectangle(tengahX, 635, 600, 20, WARNA.ABU);
    const bilah = this.add.rectangle(tengahX - 300, 635, 600, 20, WARNA.MERAH).setOrigin(0, 0.5);
    this.tweens.add({ targets: bilah, scaleX: 0, duration: DURASI_INSTRUKSI * 1000 });

    this.time.delayedCall(DURASI_INSTRUKSI * 1000, () => this.scene.start(kunci));
  }
}
