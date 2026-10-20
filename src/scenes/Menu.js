import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import GameState, { DATA_PEMAIN } from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import Latar from '../fx/Latar.js';
import { bernapas, regang, gepeng, debu } from '../fx/Juice.js';
import { teks, petunjuk, Tombol, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const TANAH_Y = 600;
const POSISI_KARAKTER = [150, 330, 950, 1130];

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    masukScene(this);
    new Latar(this, { tanahY: TANAH_Y, gulir: true });
    const tengahX = GAME_WIDTH / 2;

    const judul = teks(this, tengahX, 160, 'Pesta 17-an', { ukuran: 128, warna: WARNA_TEKS.MERAH, tebal: 700, garis: 14 });
    judul.setShadow(0, 10, WARNA_TEKS.GARIS, 0, true, true);
    this.tweens.add({ targets: judul, y: 172, angle: { from: -1.5, to: 1.5 }, duration: 1600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    teks(this, tengahX, 262, 'Lomba Agustusan Seru!', { ukuran: 36, warna: WARNA_TEKS.KREM, tebal: 700, garis: 8 });

    // Untuk sekarang hanya ada mode Turnamen, jadi tombolnya selalu terpilih.
    this.tombol = new Tombol(this, tengahX, 380, 'TURNAMEN').pilih(true);
    petunjuk(this, tengahX, 470, 'Tekan Enter untuk memilih');

    // Hiasan: keempat karakter berdiri di tanah dan sesekali melompat.
    DATA_PEMAIN.forEach((p, i) => {
      const x = POSISI_KARAKTER[i];
      this.add.image(x, TANAH_Y + 6, 'bayangan').setScale(0.6);
      const sprite = this.add
        .image(x, TANAH_Y + 4, kunciKarakter(p.sprite, 'normal'))
        .setOrigin(0.5, 137 / 140)
        .setScale(0.6);
      bernapas(this, sprite);
      this.time.addEvent({
        delay: Phaser.Math.Between(1800, 3600),
        loop: true,
        callback: () => this.lompatHias(sprite, p),
      });
    });

    this.kontrol = new InputManager(this);
  }

  lompatHias(sprite, p) {
    sprite.setTexture(kunciKarakter(p.sprite, 'semangat'));
    regang(this, sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 70,
      duration: 260,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        sprite.setTexture(kunciKarakter(p.sprite, 'normal'));
        gepeng(this, sprite, () => bernapas(this, sprite));
        debu(this, sprite.x, TANAH_Y + 4, 4);
      },
    });
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER')) {
      GameState.reset();
      pindahScene(this, 'PlayerSelect');
    }
  }
}
