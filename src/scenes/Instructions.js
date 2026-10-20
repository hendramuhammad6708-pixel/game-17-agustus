import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS, DURASI_INSTRUKSI } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { bernapas } from '../fx/Juice.js';
import { Panel, teks, judulPanel, petunjuk, tutsKeyboard, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const LEBAR_KARTU = 270;
const JARAK_KARTU = 24;
const KARTU_Y = 470;
const LEBAR_BILAH = 600;

// Tampil selama DURASI_INSTRUKSI detik sebelum mini-game, lalu otomatis lanjut.
export default class Instructions extends Phaser.Scene {
  constructor() {
    super('Instructions');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });
    const tengahX = GAME_WIDTH / 2;
    const kunci = GameState.miniGameSekarang;
    const { nama, caraMain, tombol } = this.scene.get(kunci).info;

    judulPanel(this, `Ronde ${GameState.ronde + 1} dari ${GameState.jumlahRonde}`);

    new Panel(this, tengahX, 228, 1040, 190, 'krem');
    teks(this, tengahX, 182, nama, { ukuran: 64, warna: WARNA_TEKS.MERAH, tebal: 700 });
    teks(this, tengahX, 262, caraMain, { ukuran: 28, tebal: 500, wordWrap: { width: 940 } });

    // Kartu tombol untuk setiap pemain aktif.
    const jumlah = GameState.pemain.length;
    const kiri = (GAME_WIDTH - (jumlah * LEBAR_KARTU + (jumlah - 1) * JARAK_KARTU)) / 2;
    GameState.pemain.forEach((p, i) => {
      const x = kiri + LEBAR_KARTU / 2 + i * (LEBAR_KARTU + JARAK_KARTU);
      new Panel(this, x, KARTU_Y, LEBAR_KARTU, 190, 'krem');

      const sprite = this.add
        .image(x - 78, KARTU_Y + 70, kunciKarakter(p.sprite, 'semangat'))
        .setOrigin(0.5, 137 / 140)
        .setScale(0.6);
      bernapas(this, sprite);

      new Panel(this, x + 40, KARTU_Y - 52, 150, 62, p.sprite);
      teks(this, x + 40, KARTU_Y - 55, p.nama, { ukuran: 24, warna: p.warnaTeks, tebal: 700 });
      if (p.bot) {
        tutsKeyboard(this, x + 40, KARTU_Y + 16, 'CPU', 54);
        teks(this, x + 40, KARTU_Y + 62, 'Dimainkan komputer', { ukuran: 15, tebal: 600 });
        return;
      }
      tombol.forEach((t, j) => {
        const tx = x + 40 + (j - (tombol.length - 1) / 2) * 66;
        tutsKeyboard(this, tx, KARTU_Y + 16, InputManager.label(p.id, t), 54);
        teks(this, tx, KARTU_Y + 62, `Tombol ${t}`, { ukuran: 15, tebal: 600 });
      });
    });

    // Bilah waktu yang menyusut sampai mini-game dimulai.
    petunjuk(this, tengahX, 626, 'Bersiap...', 26);
    new Panel(this, tengahX, 678, LEBAR_BILAH, 48, 'krem');
    const bilah = new Panel(this, tengahX, 678, LEBAR_BILAH, 48, 'merah');
    this.tweens.addCounter({
      from: LEBAR_BILAH,
      to: 0,
      duration: DURASI_INSTRUKSI * 1000,
      onUpdate: (tween) => {
        const lebar = tween.getValue();
        bilah.aturUkuran(lebar, 48).setX(tengahX - (LEBAR_BILAH - bilah.lebar) / 2).setVisible(lebar >= 56);
      },
    });

    this.time.delayedCall(DURASI_INSTRUKSI * 1000, () => pindahScene(this, kunci));
  }
}
