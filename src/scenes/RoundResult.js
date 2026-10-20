import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { Panel, teks, judulPanel, petunjuk, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const BARIS_Y = 222;
const JARAK_BARIS = 100;

// Urutan finish dan poin ronde yang baru selesai.
export default class RoundResult extends Phaser.Scene {
  constructor() {
    super('RoundResult');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });
    const tengahX = GAME_WIDTH / 2;
    const { nama } = this.scene.get(GameState.miniGameSekarang).info;

    judulPanel(this, `Hasil Ronde ${GameState.ronde + 1}`);
    petunjuk(this, tengahX, 140, nama, 30);

    const jumlah = GameState.hasilRonde.length;
    GameState.hasilRonde.forEach((h, i) => {
      const p = GameState.ambilPemain(h.id);
      // Juara 1 bersorak, juru kunci pusing, sisanya biasa.
      const ekspresi = i === 0 ? 'semangat' : i === jumlah - 1 ? 'pusing' : 'normal';

      const baris = this.add.container(tengahX, BARIS_Y + i * JARAK_BARIS, [
        new Panel(this, 0, 0, 780, 88, 'krem'),
        new Panel(this, -330, -2, 70, 64, i === 0 ? 'kuning' : 'krem'),
        teks(this, -330, -7, String(h.posisi), { ukuran: 36, tebal: 700 }),
        this.add.image(-240, 36, kunciKarakter(p.sprite, ekspresi)).setOrigin(0.5, 137 / 140).setScale(0.38),
        teks(this, -180, -4, p.nama, { ukuran: 32, tebal: 700 }).setOrigin(0, 0.5),
        teks(this, 340, -4, `+${h.poin} poin`, { ukuran: 32, warna: WARNA_TEKS.MERAH, tebal: 700 }).setOrigin(1, 0.5),
      ]);
      // Baris masuk dari kanan satu per satu.
      baris.x = GAME_WIDTH + 450;
      this.tweens.add({ targets: baris, x: tengahX, delay: 150 + i * 120, duration: 380, ease: 'Back.easeOut' });
    });

    petunjuk(this, tengahX, 680, 'Tekan Enter untuk lanjut');
    this.kontrol = new InputManager(this);
  }

  update() {
    if (this.kontrol.menuDitekan('ENTER') && !this.sedangPindah) {
      AudioManager.play('klik');
      pindahScene(this, 'Scoreboard');
    }
  }
}
