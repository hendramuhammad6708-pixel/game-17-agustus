import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS, MIN_PEMAIN } from '../config.js';
import GameState, { DATA_PEMAIN } from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { bernapas, regang, gepeng } from '../fx/Juice.js';
import { Panel, teks, judulPanel, petunjuk, tutsKeyboard, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const LEBAR_KARTU = 260;
const TINGGI_KARTU = 400;
const JARAK_KARTU = 30;
const KARTU_Y = 385;

export default class PlayerSelect extends Phaser.Scene {
  constructor() {
    super('PlayerSelect');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });
    const tengahX = GAME_WIDTH / 2;

    judulPanel(this, 'Pilih Pemain');
    petunjuk(this, tengahX, 140, 'Tekan Tombol 1 milikmu untuk ikut bermain', 30);

    this.bergabung = new Set();
    this.kartu = DATA_PEMAIN.map((p, i) => this.buatKartu(p, i));

    this.petunjukMulai = petunjuk(this, tengahX, 666, '', 30);
    this.petunjukCpu = petunjuk(this, tengahX, 702, '', 20);
    this.perbaruiPetunjuk();

    this.kontrol = new InputManager(this);
  }

  buatKartu(p, i) {
    const kiri = (GAME_WIDTH - (4 * LEBAR_KARTU + 3 * JARAK_KARTU)) / 2;
    const x = kiri + LEBAR_KARTU / 2 + i * (LEBAR_KARTU + JARAK_KARTU);
    const atas = KARTU_Y - TINGGI_KARTU / 2;

    new Panel(this, x, KARTU_Y, LEBAR_KARTU, TINGGI_KARTU, 'krem');
    this.add.image(x, atas + 182, 'bayangan').setScale(0.55);
    const sprite = this.add
      .image(x, atas + 180, kunciKarakter(p.sprite, 'normal'))
      .setOrigin(0.5, 137 / 140)
      .setScale(0.7)
      .setAlpha(0.55);
    bernapas(this, sprite);

    // Slot yang belum diambil manusia akan dimainkan CPU.
    const labelCpu = this.add.container(x + 78, atas + 38, [
      new Panel(this, 0, 0, 84, 62, 'kuning'),
      teks(this, 0, -4, 'CPU', { ukuran: 24, tebal: 700 }),
    ]);

    teks(this, x, atas + 214, p.nama, { ukuran: 30, tebal: 700 });
    teks(this, x, atas + 244, p.namaWarna, { ukuran: 22, tebal: 500 });
    tutsKeyboard(this, x - 34, atas + 290, InputManager.label(p.id, 1), 52);
    tutsKeyboard(this, x + 34, atas + 290, InputManager.label(p.id, 2), 52);

    const pil = new Panel(this, x, atas + 354, 200, 60, 'krem');
    const status = teks(this, x, atas + 350, `Tekan ${InputManager.label(p.id, 1)}`, { ukuran: 26, tebal: 700 }).setAlpha(0.6);

    return { p, sprite, labelCpu, pil, status };
  }

  gabung(kartu) {
    const { p, sprite, labelCpu, pil, status } = kartu;
    this.bergabung.add(p.id);
    AudioManager.play('lompat');
    labelCpu.setVisible(false);

    sprite.setAlpha(1).setTexture(kunciKarakter(p.sprite, 'semangat'));
    regang(this, sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 50,
      duration: 220,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => gepeng(this, sprite, () => bernapas(this, sprite)),
    });

    pil.aturWarna(p.sprite);
    status.setText('SIAP!').setColor(p.warnaTeks).setAlpha(1);
    this.perbaruiPetunjuk();
  }

  perbaruiPetunjuk() {
    const cukup = this.bergabung.size >= MIN_PEMAIN;
    this.petunjukMulai
      .setText(cukup ? 'Tekan Enter untuk mulai!' : `Minimal ${MIN_PEMAIN} pemain untuk mulai`)
      .setColor(cukup ? WARNA_TEKS.KUNING : WARNA_TEKS.KREM);
    const tingkat = GameState.tingkatBot === 'mudah' ? 'Mudah' : 'Normal';
    this.petunjukCpu.setText(this.bergabung.size < 4 ? `Slot kosong dimainkan CPU (${tingkat})` : '');
  }

  update() {
    for (const kartu of this.kartu) {
      if (!this.bergabung.has(kartu.p.id) && this.kontrol.justPressed(kartu.p.id, 1)) {
        this.gabung(kartu);
      }
    }

    if (this.kontrol.menuDitekan('ENTER') && this.bergabung.size >= MIN_PEMAIN && !this.sedangPindah) {
      AudioManager.play('klik');
      GameState.aturPemain([...this.bergabung]);
      if (GameState.mode === 'bebas') {
        pindahScene(this, 'FreePlay');
      } else {
        GameState.mulaiTurnamen();
        pindahScene(this, 'Instructions');
      }
    }
  }
}
