import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { Panel, teks, judulPanel, petunjuk, masukScene, pindahScene } from '../ui/Ui.js';
import { NAMA_TIM, ANGGOTA_TIM, ASET_PIHAK_KETIGA, CATATAN } from '../kredit.js';

// Area panel yang menampilkan isi kredit; isi yang lebih panjang bergulir di dalamnya.
const PANEL_Y = 392;
const PANEL_LEBAR = 1000;
const PANEL_TINGGI = 470;
const AREA = { atas: PANEL_Y - PANEL_TINGGI / 2 + 24, tinggi: PANEL_TINGGI - 58 };
const KECEPATAN_GULIR = 30; // piksel per detik saat bergulir otomatis
const LANGKAH_GULIR = 60; // piksel per tekanan panah
const JEDA_UJUNG = 2000; // milidetik diam di awal dan akhir sebelum bergulir lagi

export default class Credits extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });
    const tengahX = GAME_WIDTH / 2;

    judulPanel(this, 'Kredit');
    new Panel(this, tengahX, PANEL_Y, PANEL_LEBAR, PANEL_TINGGI, 'krem');

    this.isi = this.add.container(tengahX, AREA.atas);
    this.tinggiIsi = this.susunIsi();
    // Isi dipotong rapi di dalam panel. Graphics ini hanya bentuk masker dan tidak digambar.
    const bentuk = this.make.graphics({ add: false });
    bentuk.fillRect(tengahX - PANEL_LEBAR / 2, AREA.atas, PANEL_LEBAR, AREA.tinggi);
    this.isi.setMask(bentuk.createGeometryMask());

    this.geserMaks = Math.max(0, this.tinggiIsi - AREA.tinggi);
    this.geser = 0;
    this.arah = 1;
    this.tunggu = JEDA_UJUNG;

    petunjuk(this, tengahX, 680, this.geserMaks > 0 ? 'Enter/Esc: kembali   ·   ↑/↓: gulir' : 'Enter/Esc: kembali');
    this.kontrol = new InputManager(this);
  }

  // Menyusun teks dari atas ke bawah; mengembalikan tinggi total isi.
  susunIsi() {
    let y = 10;
    const tambah = (isi, gaya, jarak) => {
      const label = teks(this, 0, y, isi, { wordWrap: { width: PANEL_LEBAR - 80 }, ...gaya }).setOrigin(0.5, 0);
      this.isi.add(label);
      y += label.height + jarak;
    };

    tambah('Tim', { ukuran: 26, warna: WARNA_TEKS.MERAH, tebal: 700 }, 4);
    tambah(NAMA_TIM, { ukuran: 38, tebal: 700 }, 10);
    ANGGOTA_TIM.forEach(({ nama, peran }) => tambah(`${nama}  ·  ${peran}`, { ukuran: 26, tebal: 500 }, 6));

    y += 24;
    tambah('Aset Pihak Ketiga', { ukuran: 26, warna: WARNA_TEKS.MERAH, tebal: 700 }, 10);
    ASET_PIHAK_KETIGA.forEach(({ judul, jenis, pembuat, lisensi, sumber }) => {
      tambah(`${judul} (${jenis})`, { ukuran: 26, tebal: 700 }, 2);
      tambah(`${pembuat}  ·  ${lisensi}  ·  ${sumber}`, { ukuran: 20, tebal: 500 }, 14);
    });

    y += 14;
    tambah(CATATAN, { ukuran: 20, tebal: 500 }, 0);
    return y + 10;
  }

  update(time, delta) {
    if (this.sedangPindah) {
      return;
    }
    if (this.kontrol.menuDitekan('ENTER') || this.kontrol.menuDitekan('ESC')) {
      AudioManager.play('klik');
      pindahScene(this, 'Menu');
      return;
    }
    if (this.geserMaks === 0) {
      return;
    }

    const manual = (this.kontrol.menuDitekan('DOWN') ? 1 : 0) - (this.kontrol.menuDitekan('UP') ? 1 : 0);
    if (manual !== 0) {
      // Gulir manual lalu berhenti sejenak sebelum lanjut otomatis.
      this.geser += manual * LANGKAH_GULIR;
      this.tunggu = JEDA_UJUNG;
    } else if (this.tunggu > 0) {
      this.tunggu -= delta;
    } else {
      // Gulir otomatis bolak-balik dengan jeda di kedua ujung.
      this.geser += this.arah * KECEPATAN_GULIR * (delta / 1000);
      if (this.geser <= 0 || this.geser >= this.geserMaks) {
        this.arah *= -1;
        this.tunggu = JEDA_UJUNG;
      }
    }
    this.geser = Phaser.Math.Clamp(this.geser, 0, this.geserMaks);
    this.isi.y = AREA.atas - this.geser;
  }
}
