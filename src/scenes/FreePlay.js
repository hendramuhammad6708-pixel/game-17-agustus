import Phaser from 'phaser';
import { GAME_WIDTH, WARNA_TEKS, DAFTAR_MINIGAME } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Latar from '../fx/Latar.js';
import { Panel, Tombol, teks, judulPanel, petunjuk, masukScene, pindahScene } from '../ui/Ui.js';

const DAFTAR_X = 370;
const DAFTAR_Y = 205;
const JARAK_TOMBOL = 86;
const DETAIL_X = 905;
const DETAIL_Y = 392;

// Gambar wakil tiap mini-game dan skala tampilnya di panel detail.
const GAMBAR = {
  BalapKarung: ['karung', 0.8],
  MakanKerupuk: ['kerupuk', 0.9],
  PanjatPinang: ['hadiah', 2],
  KelerengSendok: ['sendok', 0.9],
  TarikTambang: ['penanda-tali', 2.2],
};

// Main Bebas: pilih satu mini-game. Pemain sudah dipilih sebelumnya dan tetap sama sampai kembali ke Menu.
export default class FreePlay extends Phaser.Scene {
  constructor() {
    super('FreePlay');
  }

  create() {
    masukScene(this);
    AudioManager.putarMusik('menu');
    new Latar(this, { tanahY: 640, gulir: true });

    judulPanel(this, 'Main Bebas');
    petunjuk(this, GAME_WIDTH / 2, 132, 'Pilih satu mini-game untuk dimainkan', 28);

    this.tombol = DAFTAR_MINIGAME.map(
      (kunci, i) =>
        new Tombol(this, DAFTAR_X, DAFTAR_Y + i * JARAK_TOMBOL, this.scene.get(kunci).info.nama, {
          lebar: 440,
          tinggi: 76,
          ukuran: 32,
        }),
    );

    new Panel(this, DETAIL_X, DETAIL_Y, 560, 430, 'krem');
    this.gambar = this.add.image(DETAIL_X, DETAIL_Y - 110, 'karung');
    this.nama = teks(this, DETAIL_X, DETAIL_Y + 10, '', { ukuran: 40, warna: WARNA_TEKS.MERAH, tebal: 700 });
    this.caraMain = teks(this, DETAIL_X, DETAIL_Y + 90, '', { ukuran: 24, tebal: 500, wordWrap: { width: 480 } });
    this.tombolDipakai = teks(this, DETAIL_X, DETAIL_Y + 165, '', { ukuran: 20, tebal: 600 });

    this.pilihan = Phaser.Math.Clamp(GameState.pilihanBebas, 0, DAFTAR_MINIGAME.length - 1);
    this.perbaruiPilihan();

    petunjuk(this, GAME_WIDTH / 2, 680, 'Enter: main   ·   ↑/↓: pilih   ·   Esc: kembali ke Menu', 26);
    this.kontrol = new InputManager(this);
  }

  perbaruiPilihan() {
    const kunci = DAFTAR_MINIGAME[this.pilihan];
    const { nama, caraMain, tombol } = this.scene.get(kunci).info;
    const [gambar, skala] = GAMBAR[kunci];

    this.tombol.forEach((t, i) => t.pilih(i === this.pilihan));
    this.gambar.setTexture(gambar).setScale(skala);
    this.nama.setText(nama);
    this.caraMain.setText(caraMain);
    this.tombolDipakai.setText(tombol.length > 1 ? 'Memakai Tombol 1 dan Tombol 2' : 'Memakai Tombol 1');
  }

  update() {
    if (this.sedangPindah) {
      return;
    }
    if (this.kontrol.menuDitekan('ESC')) {
      AudioManager.play('klik');
      GameState.reset();
      pindahScene(this, 'Menu');
      return;
    }
    if (this.kontrol.menuDitekan('ENTER')) {
      AudioManager.play('klik');
      GameState.pilihanBebas = this.pilihan;
      GameState.mulaiBebas(DAFTAR_MINIGAME[this.pilihan]);
      pindahScene(this, 'Instructions');
      return;
    }
    const langkah = (this.kontrol.menuDitekan('DOWN') ? 1 : 0) - (this.kontrol.menuDitekan('UP') ? 1 : 0);
    if (langkah !== 0) {
      this.pilihan = (this.pilihan + langkah + DAFTAR_MINIGAME.length) % DAFTAR_MINIGAME.length;
      this.perbaruiPilihan();
      AudioManager.play('klik');
    }
  }
}
