import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const WARNA_LANGIT = 0xa8dadc;

// Isi tiap lapis. Awan: [x, y, skala]; kelapa: [x, skala]; rumah: x.
const AWAN = [
  [100, 90, 0.8],
  [420, 160, 0.6],
  [700, 70, 1],
  [1000, 180, 0.7],
  [1320, 110, 0.9],
  [1600, 60, 0.65],
];
const KELAPA = [
  [60, 0.9],
  [330, 1.05],
  [610, 0.85],
  [880, 1],
  [1180, 0.95],
  [1450, 1.1],
  [1700, 0.9],
];
const RUMAH = [220, 820, 1420];

// bentang: lebar satu putaran sebelum berulang; tepi: jarak keluar layar sebelum benda dipindah ke kanan.
// gulir: piksel per detik saat mode gulir; makin dekat makin cepat supaya terasa parallax.
const LAPIS = {
  awan: { bentang: 1800, tepi: 120, gulir: 8 },
  kelapa: { bentang: 1800, tepi: 110, gulir: 18 },
  rumah: { bentang: 1800, tepi: 270, gulir: 36 },
};
const GULIR_TANAH = 70;
const ANGIN = 10; // awan selalu bergerak pelan, juga saat tidak bergulir

const bungkus = (x, { bentang, tepi }) => ((((x + tepi) % bentang) + bentang) % bentang) - tepi;

// Posisi gulir dipakai bersama semua scene, jadi latar tidak melompat ke awal saat berpindah layar.
const geser = { awan: 0, kelapa: 0, rumah: 0, tanah: 0 };

// Latar kampung 4 lapis: langit + awan, pohon kelapa, rumah dengan umbul-umbul dan bendera, tanah.
// Buat paling awal di create() supaya berada di belakang semua objek permainan.
// skalaBenda mengecilkan pohon dan rumah, untuk scene yang cakrawalanya tinggi.
export default class Latar {
  constructor(scene, { tanahY = 600, gulir = false, skalaBenda = 1 } = {}) {
    this.scene = scene;
    this.gulir = gulir;

    scene.cameras.main.setBackgroundColor(WARNA_LANGIT);

    this.awan = AWAN.map(([x, y, s]) => ({ x, obj: scene.add.image(x, y, 'awan').setScale(s).setDepth(-40) }));
    this.kelapa = KELAPA.map(([x, s]) => ({
      x,
      obj: scene.add
        .image(x, tanahY + 2, 'kelapa')
        .setOrigin(96 / 180, 316 / 320)
        .setScale(s * skalaBenda)
        .setDepth(-30),
    }));
    this.rumah = RUMAH.map((x) => ({ x, obj: this.buatRumah(x, tanahY).setScale(skalaBenda).setDepth(-20) }));
    this.tanah = scene.add
      .tileSprite(0, tanahY, GAME_WIDTH, GAME_HEIGHT - tanahY, 'tanah')
      .setOrigin(0)
      .setDepth(-10);

    this.letakkan();
    scene.events.on('update', this.perbarui, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.perbarui, this));
  }

  // Rumah bersama umbul-umbul di kiri dan tiang bendera di kanan; kain keduanya bergerak terus.
  buatRumah(x, tanahY) {
    const s = this.scene;
    const umbul = s.add
      .image(-200, 0, 'umbul-umbul')
      .setOrigin(20 / 90, 336 / 340)
      .setScale(0.85);
    const tiang = s.add.image(190, 0, 'tiang-bendera').setOrigin(0.5, 1).setScale(0.9);
    const bendera = s.add.image(194, -218, 'bendera').setOrigin(0, 0).setScale(0.6);
    const rumah = s.add.image(0, 0, 'rumah').setOrigin(0.5, 256 / 260);

    s.tweens.add({ targets: umbul, angle: { from: -2.5, to: 2.5 }, duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    s.tweens.add({ targets: bendera, scaleX: 0.5, duration: 420, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    s.tweens.add({ targets: bendera, scaleY: 0.64, duration: 610, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    s.tweens.add({ targets: bendera, angle: { from: -4, to: 3 }, duration: 930, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    return s.add.container(x, tanahY + 2, [umbul, tiang, bendera, rumah]);
  }

  letakkan() {
    for (const nama of ['awan', 'kelapa', 'rumah']) {
      for (const benda of this[nama]) {
        benda.obj.x = bungkus(benda.x - geser[nama], LAPIS[nama]);
      }
    }
    this.tanah.tilePositionX = geser.tanah;
  }

  perbarui(time, delta) {
    if (this.scene.time.paused) {
      return;
    }
    const detik = delta / 1000;

    geser.awan += (ANGIN + (this.gulir ? LAPIS.awan.gulir : 0)) * detik;
    if (this.gulir) {
      geser.kelapa += LAPIS.kelapa.gulir * detik;
      geser.rumah += LAPIS.rumah.gulir * detik;
      geser.tanah += GULIR_TANAH * detik;
    }
    this.letakkan();
  }
}
