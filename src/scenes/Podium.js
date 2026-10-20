import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import Latar from '../fx/Latar.js';
import { bernapas, regang, gepeng, debu, konfeti } from '../fx/Juice.js';
import { Panel, teks, judulPanel, petunjuk, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const TANAH_Y = 640;
const LEBAR_BALOK = 240;
const BALOK = {
  1: { tinggi: 240, warna: 'kuning' },
  2: { tinggi: 170, warna: 'krem' },
  3: { tinggi: 115, warna: 'merah' },
};
const SKALA = 0.72;
const TINGGI_LOMPAT = 60;

// 3 besar turnamen dengan konfeti. Juara 1 di tengah, juara 2 di kiri, juara 3 di kanan.
export default class Podium extends Phaser.Scene {
  constructor() {
    super('Podium');
  }

  create() {
    masukScene(this);
    new Latar(this, { tanahY: TANAH_Y });
    const tengahX = GAME_WIDTH / 2;
    const peringkat = GameState.peringkat();
    // Dua pemain: kedua balok di tengah layar, juara 1 di kanan.
    const posisiX = peringkat.length === 2 ? [tengahX + 145, tengahX - 145] : [tengahX, tengahX - 290, tengahX + 290];

    judulPanel(this, 'Juara Pesta 17-an!');
    petunjuk(this, tengahX, 128, 'Tekan Enter untuk main lagi', 26);

    peringkat.slice(0, 3).forEach((p, i) => {
      const x = posisiX[i];
      const { tinggi, warna } = BALOK[p.peringkat];
      const atasBalok = TANAH_Y - tinggi;

      new Panel(this, x, TANAH_Y - tinggi / 2 + 8, LEBAR_BALOK, tinggi + 16, warna);
      teks(this, x, atasBalok + 52, String(p.peringkat), {
        ukuran: 72,
        warna: warna === 'merah' ? WARNA_TEKS.KREM : WARNA_TEKS.GARIS,
        tebal: 700,
      });

      petunjuk(this, x, TANAH_Y + 24, p.nama, 26);
      teks(this, x, TANAH_Y + 56, `${p.skor} poin`, { ukuran: 24, warna: WARNA_TEKS.KUNING, tebal: 700, garis: 6 });

      const bayangan = this.add.image(x, atasBalok + 2, 'bayangan').setScale(SKALA);
      const sprite = this.add
        .image(x, atasBalok, kunciKarakter(p.sprite, 'semangat'))
        .setOrigin(0.5, 137 / 140)
        .setScale(SKALA);

      // Juara 1 (termasuk yang seri) melompat-lompat; yang lain bernapas sambil tersenyum.
      if (p.peringkat === 1) {
        this.lompatTerus(sprite, bayangan, atasBalok, i * 180);
      } else {
        bernapas(this, sprite);
      }
    });

    const lainnya = peringkat
      .slice(3)
      .map((p) => `Peringkat ${p.peringkat}: ${p.nama} (${p.skor} poin)`)
      .join('   ·   ');
    if (lainnya) {
      petunjuk(this, tengahX, 166, lainnya, 22);
    }

    konfeti(this);
    this.kontrol = new InputManager(this);
  }

  lompatTerus(sprite, bayangan, atasBalok, tunda) {
    const lompat = () => {
      regang(this, sprite);
      this.tweens.add({ targets: bayangan, scale: 0.4, duration: 300, ease: 'Quad.easeOut', yoyo: true });
      this.tweens.add({
        targets: sprite,
        y: atasBalok - TINGGI_LOMPAT,
        duration: 300,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: () => {
          gepeng(this, sprite);
          debu(this, sprite.x, atasBalok, 4);
          this.time.delayedCall(260, lompat);
        },
      });
    };
    this.time.delayedCall(400 + tunda, lompat);
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER')) {
      GameState.reset();
      pindahScene(this, 'Menu');
    }
  }
}
