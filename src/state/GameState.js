import Phaser from 'phaser';
import { POIN_POSISI, MINIGAME_TURNAMEN } from '../config.js';

// Empat slot pemain sesuai PRD bagian Skema Kontrol.
export const DATA_PEMAIN = [
  { id: 1, nama: 'Pemain 1', namaWarna: 'Merah', warna: 0xe53935, warnaTeks: '#ffffff' },
  { id: 2, nama: 'Pemain 2', namaWarna: 'Biru', warna: 0x1e88e5, warnaTeks: '#ffffff' },
  { id: 3, nama: 'Pemain 3', namaWarna: 'Hijau', warna: 0x43a047, warnaTeks: '#ffffff' },
  { id: 4, nama: 'Pemain 4', namaWarna: 'Kuning', warna: 0xfdd835, warnaTeks: '#3e2f00' },
];

// Satu-satunya sumber data sesi: pemain aktif, skor kumulatif, dan jadwal mini-game.
const GameState = {
  pemain: [], // salinan DATA_PEMAIN untuk pemain yang ikut, ditambah skor
  urutanMiniGame: [], // key scene mini-game sesuai urutan turnamen
  ronde: 0, // indeks ronde yang sedang dimainkan
  hasilRonde: [], // [{ id, posisi, poin }] dari ronde terakhir

  reset() {
    this.pemain = [];
    this.urutanMiniGame = [];
    this.ronde = 0;
    this.hasilRonde = [];
  },

  aturPemain(ids) {
    this.pemain = DATA_PEMAIN.filter((p) => ids.includes(p.id)).map((p) => ({ ...p, skor: 0 }));
  },

  mulaiTurnamen() {
    this.urutanMiniGame = Phaser.Utils.Array.Shuffle([...MINIGAME_TURNAMEN]);
    this.ronde = 0;
    this.hasilRonde = [];
    this.pemain.forEach((p) => {
      p.skor = 0;
    });
  },

  get miniGameSekarang() {
    return this.urutanMiniGame[this.ronde];
  },

  get jumlahRonde() {
    return this.urutanMiniGame.length;
  },

  adaRondeBerikutnya() {
    return this.ronde < this.urutanMiniGame.length - 1;
  },

  lanjutRonde() {
    this.ronde += 1;
  },

  ambilPemain(id) {
    return this.pemain.find((p) => p.id === id);
  },

  // urutanFinish: id pemain dari juara 1 sampai terakhir.
  catatHasil(urutanFinish) {
    this.hasilRonde = urutanFinish.map((id, i) => {
      const poin = POIN_POSISI[i] ?? 0;
      this.ambilPemain(id).skor += poin;
      return { id, posisi: i + 1, poin };
    });
  },

  // Pemain diurutkan dari skor tertinggi; skor sama mendapat peringkat sama.
  peringkat() {
    const urut = [...this.pemain].sort((a, b) => b.skor - a.skor);
    return urut.map((p) => ({ ...p, peringkat: 1 + urut.filter((q) => q.skor > p.skor).length }));
  },
};

export default GameState;
