import Phaser from 'phaser';
import { FONT, WARNA, WARNA_TEKS } from '../config.js';

// Ukuran potongan panel, harus cocok dengan panel-*.svg (96 x 96, bayangan 6 px di bawah).
const IRISAN = { kiri: 28, kanan: 28, atas: 28, bawah: 34 };
const UKURAN_SVG = 96;
const DURASI_FADE = 250;
const [FADE_R, FADE_G, FADE_B] = [0x2b, 0x2d, 0x42];

// Tambahkan sembilan bingkai ke tekstur panel. Dipanggil sekali di Preload.
export function siapkanPanel(textures, kunci) {
  const tekstur = textures.get(kunci);
  const xs = [0, IRISAN.kiri, UKURAN_SVG - IRISAN.kanan, UKURAN_SVG];
  const ys = [0, IRISAN.atas, UKURAN_SVG - IRISAN.bawah, UKURAN_SVG];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      tekstur.add(`${r}${c}`, 0, xs[c], ys[r], xs[c + 1] - xs[c], ys[r + 1] - ys[r]);
    }
  }
}

// Panel membulat yang bisa diubah ukurannya tanpa merusak sudut dan outline.
// Disusun dari 9 gambar biasa (bukan NineSlice) supaya tetap tampil di renderer Canvas.
export class Panel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, lebar, tinggi, warna = 'krem') {
    super(scene, x, y);
    this.warna = warna;
    this.potong = [];
    for (let i = 0; i < 9; i++) {
      this.potong.push(scene.make.image({ key: `panel-${warna}`, frame: `${Math.floor(i / 3)}${i % 3}`, add: false }).setOrigin(0));
    }
    this.add(this.potong);
    this.aturUkuran(lebar, tinggi);
    scene.add.existing(this);
  }

  aturUkuran(lebar, tinggi) {
    this.lebar = Math.round(Math.max(lebar, IRISAN.kiri + IRISAN.kanan));
    this.tinggi = Math.round(Math.max(tinggi, IRISAN.atas + IRISAN.bawah));
    const xs = [0, IRISAN.kiri, this.lebar - IRISAN.kanan];
    const ws = [IRISAN.kiri, this.lebar - IRISAN.kiri - IRISAN.kanan, IRISAN.kanan];
    const ys = [0, IRISAN.atas, this.tinggi - IRISAN.bawah];
    const hs = [IRISAN.atas, this.tinggi - IRISAN.atas - IRISAN.bawah, IRISAN.bawah];
    const kiri = -Math.round(this.lebar / 2);
    const atas = -Math.round(this.tinggi / 2);

    this.potong.forEach((img, i) => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      img.setPosition(kiri + xs[c], atas + ys[r]).setDisplaySize(ws[c], hs[r]);
      img.setVisible(ws[c] > 0 && hs[r] > 0);
    });
    this.setSize(this.lebar, this.tinggi);
    return this;
  }

  aturWarna(warna) {
    this.warna = warna;
    this.potong.forEach((img, i) => img.setTexture(`panel-${warna}`, `${Math.floor(i / 3)}${i % 3}`));
    return this;
  }
}

// Teks Fredoka. garis = tebal outline (0 tanpa outline).
export function teks(scene, x, y, isi, { ukuran = 32, warna = WARNA_TEKS.GARIS, tebal = 600, garis = 0, ...lain } = {}) {
  return scene.add
    .text(x, y, isi, {
      fontFamily: FONT,
      fontStyle: String(tebal),
      fontSize: `${ukuran}px`,
      color: warna,
      stroke: WARNA_TEKS.GARIS,
      strokeThickness: garis,
      align: 'center',
      ...lain,
    })
    .setOrigin(0.5);
}

// Judul di atas pita merah.
export function judulPanel(scene, isi, y = 60) {
  const label = teks(scene, 0, -3, isi, { ukuran: 46, warna: WARNA_TEKS.KREM, tebal: 700, garis: 8 });
  const panel = new Panel(scene, 0, 0, label.width + 90, 88, 'merah');
  return scene.add.container(scene.scale.width / 2, y, [panel, label]);
}

// Petunjuk kecil dengan outline supaya terbaca di atas latar apa pun.
export function petunjuk(scene, x, y, isi, ukuran = 28) {
  return teks(scene, x, y, isi, { ukuran, warna: WARNA_TEKS.KREM, tebal: 600, garis: 7 });
}

// Tutup tombol keyboard, misalnya "Q".
export function tutsKeyboard(scene, x, y, label, ukuran = 56) {
  const panel = new Panel(scene, 0, 0, ukuran, ukuran + 6, 'krem');
  const huruf = teks(scene, 0, -4, label, { ukuran: Math.round(ukuran * 0.5), tebal: 700 });
  return scene.add.container(x, y, [panel, huruf]);
}

// Tombol membulat dengan bayangan padat; membesar dan berwarna merah saat dipilih.
export class Tombol extends Phaser.GameObjects.Container {
  constructor(scene, x, y, label, { lebar = 380, tinggi = 96, ukuran = 40 } = {}) {
    super(scene, x, y);
    this.panel = new Panel(scene, 0, 0, lebar, tinggi, 'krem');
    this.label = teks(scene, 0, -4, label, { ukuran, tebal: 700 });
    this.add([this.panel, this.label]);
    this.dipilih = false;
    scene.add.existing(this);
  }

  pilih(dipilih) {
    this.dipilih = dipilih;
    this.panel.aturWarna(dipilih ? 'merah' : 'krem');
    this.label.setColor(dipilih ? WARNA_TEKS.KREM : WARNA_TEKS.GARIS);
    this.label.setStroke(WARNA_TEKS.GARIS, dipilih ? 7 : 0);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, scale: dipilih ? 1.1 : 1, duration: 160, ease: 'Back.easeOut' });
    return this;
  }
}

// Lapisan gelap transparan selebar layar.
export function tirai(scene, alpha = 0.6) {
  return scene.add
    .image(0, 0, 'piksel')
    .setOrigin(0)
    .setDisplaySize(scene.scale.width, scene.scale.height)
    .setTint(WARNA.GARIS)
    .setAlpha(alpha);
}

// Transisi fade: panggil masukScene di awal create, pindahScene untuk berpindah.
export function masukScene(scene) {
  scene.sedangPindah = false;
  scene.cameras.main.fadeIn(DURASI_FADE, FADE_R, FADE_G, FADE_B);
}

export function pindahScene(scene, kunci, data) {
  if (scene.sedangPindah) {
    return;
  }
  scene.sedangPindah = true;
  scene.cameras.main.fadeOut(DURASI_FADE, FADE_R, FADE_G, FADE_B);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(kunci, data));
}
