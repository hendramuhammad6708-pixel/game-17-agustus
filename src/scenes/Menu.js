import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import GameState, { DATA_PEMAIN } from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { bernapas, regang, gepeng, debu } from '../fx/Juice.js';
import { Panel, teks, petunjuk, Tombol, masukScene, pindahScene } from '../ui/Ui.js';
import { kunciKarakter } from './Preload.js';

const TANAH_Y = 600;
const POSISI_KARAKTER = [120, 250, 1030, 1160];

// x relatif ke tengah layar.
const TOMBOL = [
  { label: 'TURNAMEN', lebar: 290, x: -290 },
  { label: 'MAIN BEBAS', lebar: 310, x: 40 },
  { label: 'KREDIT', lebar: 210, x: 330 },
];

const PENGATURAN_Y = 490;
const JARAK_BARIS = 66;
const BILAH_KIRI = GAME_WIDTH / 2 - 130; // sisi kiri bilah volume dan pilihan
const PANJANG_BILAH = 260;
const BILAH_MIN = 56; // lebar panel terkecil yang masih utuh
const PENGATURAN = [
  { jenis: 'musik', label: 'Musik' },
  { jenis: 'efek', label: 'Efek' },
  {
    jenis: 'tingkatBot',
    label: 'CPU',
    opsi: [
      ['mudah', 'Mudah'],
      ['normal', 'Normal'],
    ],
  },
];

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: TANAH_Y, gulir: true });
    const tengahX = GAME_WIDTH / 2;

    const judul = teks(this, tengahX, 132, 'Pesta 17-an', { ukuran: 124, warna: WARNA_TEKS.MERAH, tebal: 700, garis: 14 });
    judul.setShadow(0, 10, WARNA_TEKS.GARIS, 0, true, true);
    this.tweens.add({ targets: judul, y: 142, angle: { from: -1.5, to: 1.5 }, duration: 1600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    teks(this, tengahX, 232, 'Lomba Agustusan Seru!', { ukuran: 34, warna: WARNA_TEKS.KREM, tebal: 700, garis: 8 });

    // Baris pertama berisi tombol (kiri/kanan memilih, Enter menjalankan); baris berikutnya pengaturan.
    this.tombol = TOMBOL.map(({ label, lebar, x }) => ({
      label,
      obj: new Tombol(this, tengahX + x, 318, label, { lebar }),
    }));
    this.pilihanTombol = 0;

    new Panel(this, tengahX, PENGATURAN_Y, 560, 3 * JARAK_BARIS + 34, 'krem');
    this.baris = PENGATURAN.map((atur, i) => this.buatBaris(atur, PENGATURAN_Y - JARAK_BARIS + i * JARAK_BARIS));
    this.fokus = 0; // 0 = baris tombol, 1 dst. = baris pengaturan
    this.perbaruiTombol();
    this.perbaruiBaris();

    petunjuk(this, tengahX, 672, 'Enter: pilih   ·   ↑/↓: pindah baris   ·   ←/→: ubah', 26);

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

  buatBaris({ jenis, label, opsi }, y) {
    const baris = {
      jenis,
      opsi,
      label: teks(this, GAME_WIDTH / 2 - 250, y, label, { ukuran: 30, tebal: 700 }).setOrigin(0, 0.5),
      nilai: teks(this, GAME_WIDTH / 2 + 250, y, '', { ukuran: 26, tebal: 700 }).setOrigin(1, 0.5),
    };
    if (opsi) {
      // Pilihan: satu tombol kecil per opsi, yang aktif berwarna merah.
      const lebar = PANJANG_BILAH / opsi.length - 8;
      baris.pil = opsi.map(([, nama], i) => {
        const x = BILAH_KIRI + (i + 0.5) * (PANJANG_BILAH / opsi.length);
        return { panel: new Panel(this, x, y, lebar, 62, 'krem'), teks: teks(this, x, y - 3, nama, { ukuran: 24, tebal: 700 }) };
      });
    } else {
      new Panel(this, BILAH_KIRI + PANJANG_BILAH / 2, y, PANJANG_BILAH, 44, 'krem');
      baris.bilah = new Panel(this, BILAH_KIRI + PANJANG_BILAH / 2, y, PANJANG_BILAH, 44, 'merah');
    }
    return baris;
  }

  // Tombol terpilih selalu merah karena itulah yang dijalankan Enter.
  perbaruiTombol() {
    this.tombol.forEach(({ obj }, i) => obj.pilih(i === this.pilihanTombol));
  }

  perbaruiBaris() {
    this.baris.forEach((b, i) => {
      const dipilih = i === this.fokus - 1;
      const warna = dipilih ? WARNA_TEKS.MERAH : WARNA_TEKS.GARIS;
      b.label.setColor(warna);

      if (b.opsi) {
        b.opsi.forEach(([nilai], j) => {
          const aktif = GameState[b.jenis] === nilai;
          b.pil[j].panel.aturWarna(aktif ? 'merah' : 'krem');
          b.pil[j].teks.setColor(aktif ? WARNA_TEKS.KREM : WARNA_TEKS.GARIS).setStroke(WARNA_TEKS.GARIS, aktif ? 6 : 0);
        });
        b.nilai.setText(dipilih ? '‹ ›' : '').setColor(warna);
        return;
      }

      const volume = AudioManager.volume[b.jenis];
      const lebar = volume > 0 ? BILAH_MIN + (PANJANG_BILAH - BILAH_MIN) * volume : 0;
      const persen = `${Math.round(volume * 100)}%`;
      b.bilah.setVisible(lebar > 0);
      b.bilah.aturUkuran(lebar, 44).setX(BILAH_KIRI + b.bilah.lebar / 2);
      b.nilai.setText(dipilih ? `‹ ${persen} ›` : persen).setColor(warna);
    });
  }

  ubahPengaturan(arah) {
    const b = this.baris[this.fokus - 1];
    if (b.opsi) {
      const nilai = b.opsi.map(([n]) => n);
      const indeks = Phaser.Math.Clamp(nilai.indexOf(GameState[b.jenis]) + arah, 0, nilai.length - 1);
      GameState[b.jenis] = nilai[indeks];
    } else {
      AudioManager.ubahVolume(b.jenis, arah);
    }
    this.perbaruiBaris();
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
    if (this.sedangPindah) {
      return;
    }
    if (this.kontrol.menuDitekan('ENTER')) {
      AudioManager.play('klik');
      const { label } = this.tombol[this.pilihanTombol];
      if (label === 'KREDIT') {
        pindahScene(this, 'Credits');
      } else {
        // Turnamen dan Main Bebas sama-sama memilih pemain dulu.
        GameState.reset(label === 'MAIN BEBAS' ? 'bebas' : 'turnamen');
        pindahScene(this, 'PlayerSelect');
      }
      return;
    }

    const jumlahBaris = this.baris.length + 1;
    const langkah = (this.kontrol.menuDitekan('DOWN') ? 1 : 0) - (this.kontrol.menuDitekan('UP') ? 1 : 0);
    if (langkah !== 0) {
      this.fokus = (this.fokus + langkah + jumlahBaris) % jumlahBaris;
      this.perbaruiBaris();
      AudioManager.play('klik');
    }

    const arah = (this.kontrol.menuDitekan('RIGHT') ? 1 : 0) - (this.kontrol.menuDitekan('LEFT') ? 1 : 0);
    if (arah !== 0) {
      if (this.fokus === 0) {
        this.pilihanTombol = Phaser.Math.Clamp(this.pilihanTombol + arah, 0, this.tombol.length - 1);
        this.perbaruiTombol();
      } else {
        this.ubahPengaturan(arah);
      }
      // Klik sekaligus contoh volume efek yang baru.
      AudioManager.play('klik');
    }
  }
}
