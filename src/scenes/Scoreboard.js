import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS, POIN_POSISI } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { Panel, teks, judulPanel, petunjuk, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const BARIS_Y = 222;
const JARAK_BARIS = 100;
const BILAH_X = -40; // sisi kiri bilah, relatif ke tengah baris
const PANJANG_BILAH = 380;
const BILAH_MIN = 56; // lebar panel terkecil yang masih utuh

// Skor kumulatif setelah setiap ronde; bilah tumbuh dari skor lama ke skor baru.
export default class Scoreboard extends Phaser.Scene {
  constructor() {
    super('Scoreboard');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });
    const tengahX = GAME_WIDTH / 2;
    const skorMaks = POIN_POSISI[0] * GameState.jumlahRonde;
    const lebarBilah = (skor) => (skor > 0 ? BILAH_MIN + ((PANJANG_BILAH - BILAH_MIN) * skor) / skorMaks : 0);

    judulPanel(this, 'Papan Skor');
    petunjuk(this, tengahX, 140, `Setelah ronde ${GameState.ronde + 1} dari ${GameState.jumlahRonde}`, 30);

    GameState.peringkat().forEach((p, i) => {
      const poinRonde = GameState.hasilRonde.find((h) => h.id === p.id)?.poin ?? 0;
      const bilah = new Panel(this, 0, -2, PANJANG_BILAH, 48, p.sprite);

      this.add.container(tengahX, BARIS_Y + i * JARAK_BARIS, [
        new Panel(this, 0, 0, 1060, 88, 'krem'),
        new Panel(this, -470, -2, 70, 64, p.peringkat === 1 ? 'kuning' : 'krem'),
        teks(this, -470, -7, String(p.peringkat), { ukuran: 36, tebal: 700 }),
        this.add
          .image(-385, 36, kunciKarakter(p.sprite, p.peringkat === 1 ? 'semangat' : 'normal'))
          .setOrigin(0.5, 137 / 140)
          .setScale(0.38),
        teks(this, -325, -4, p.nama, { ukuran: 30, tebal: 700 }).setOrigin(0, 0.5),
        new Panel(this, BILAH_X + PANJANG_BILAH / 2, -2, PANJANG_BILAH, 48, 'krem'),
        bilah,
        teks(this, 362, -4, `${p.skor} poin`, { ukuran: 30, tebal: 700 }).setOrigin(0, 0.5),
        teks(this, 515, -4, `+${poinRonde}`, { ukuran: 26, warna: WARNA_TEKS.MERAH, tebal: 700 }).setOrigin(1, 0.5),
      ]);

      // Bilah tumbuh dari skor sebelum ronde ini ke skor sekarang.
      this.tweens.addCounter({
        from: lebarBilah(p.skor - poinRonde),
        to: lebarBilah(p.skor),
        delay: 300 + i * 100,
        duration: 600,
        ease: 'Cubic.easeOut',
        onUpdate: (tween) => this.aturBilah(bilah, tween.getValue()),
      });
      this.aturBilah(bilah, lebarBilah(p.skor - poinRonde));
    });

    const lanjut = GameState.adaRondeBerikutnya() ? 'Tekan Enter untuk ronde berikutnya' : 'Tekan Enter untuk melihat podium';
    petunjuk(this, tengahX, 680, lanjut);
    this.kontrol = new InputManager(this);
  }

  aturBilah(bilah, lebar) {
    bilah.setVisible(lebar >= BILAH_MIN);
    bilah.aturUkuran(lebar, 48).setX(BILAH_X + bilah.lebar / 2);
  }

  update() {
    if (!this.kontrol.menuDitekan('ENTER') || this.sedangPindah) {
      return;
    }
    AudioManager.play('klik');
    if (GameState.adaRondeBerikutnya()) {
      GameState.lanjutRonde();
      pindahScene(this, 'Instructions');
    } else {
      pindahScene(this, 'Podium');
    }
  }
}
