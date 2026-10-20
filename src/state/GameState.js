import Phaser from 'phaser';
import { POIN_POSISI, DAFTAR_MINIGAME } from '../config.js';

// Empat slot pemain sesuai PRD bagian Skema Kontrol.
// sprite: nama varian karakter dan panel di public/assets/sprites.
export const DATA_PEMAIN = [
  { id: 1, nama: 'Pemain 1', namaWarna: 'Merah', sprite: 'merah', warnaTeks: '#F1FAEE' },
  { id: 2, nama: 'Pemain 2', namaWarna: 'Biru', sprite: 'biru', warnaTeks: '#F1FAEE' },
  { id: 3, nama: 'Pemain 3', namaWarna: 'Hijau', sprite: 'hijau', warnaTeks: '#F1FAEE' },
  { id: 4, nama: 'Pemain 4', namaWarna: 'Kuning', sprite: 'kuning', warnaTeks: '#2B2D42' },
];

// Satu-satunya sumber data sesi: pemain aktif, skor kumulatif, dan jadwal mini-game.
const GameState = {
  mode: 'turnamen', // 'turnamen' atau 'bebas' (satu mini-game pilihan, tanpa papan skor dan podium)
  pemain: [], // keempat slot: salinan DATA_PEMAIN ditambah skor dan penanda bot
  urutanMiniGame: [], // key scene mini-game sesuai urutan turnamen
  ronde: 0, // indeks ronde yang sedang dimainkan
  hasilRonde: [], // [{ id, posisi, poin }] dari ronde terakhir
  tingkatBot: 'normal', // 'mudah' atau 'normal'; pengaturan, tidak ikut direset
  pilihanBebas: 0, // mini-game terakhir yang dipilih di Main Bebas; tidak ikut direset

  reset(mode = 'turnamen') {
    this.mode = mode;
    this.pemain = [];
    this.urutanMiniGame = [];
    this.ronde = 0;
    this.hasilRonde = [];
  },

  // idsManusia: slot yang dipilih pemain; slot lain diisi CPU.
  aturPemain(idsManusia) {
    this.pemain = DATA_PEMAIN.map((p) => {
      const bot = !idsManusia.includes(p.id);
      return { ...p, bot, nama: bot ? `CPU ${p.id}` : p.nama, skor: 0 };
    });
  },

  mulaiTurnamen() {
    this.mulai(Phaser.Utils.Array.Shuffle([...DAFTAR_MINIGAME]));
  },

  mulaiBebas(kunci) {
    this.mulai([kunci]);
  },

  mulai(urutan) {
    this.urutanMiniGame = urutan;
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

  // Judul ronde di Instruksi dan HUD.
  get labelRonde() {
    return this.mode === 'bebas' ? 'Main Bebas' : `Ronde ${this.ronde + 1} dari ${this.jumlahRonde}`;
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

  // urutanFinish: id pemain dari juara 1 sampai terakhir, mendapat poin 3/2/1/0.
  // poinKhusus (opsional, sejajar urutanFinish) dipakai mini-game beregu; posisi lalu dihitung
  // dari poin, sehingga anggota satu tim mendapat posisi yang sama.
  catatHasil(urutanFinish, poinKhusus) {
    const poin = poinKhusus ?? urutanFinish.map((_, i) => POIN_POSISI[i] ?? 0);
    const tingkatPoin = [...new Set(poin)].sort((a, b) => b - a);
    this.hasilRonde = urutanFinish.map((id, i) => {
      this.ambilPemain(id).skor += poin[i];
      return { id, posisi: poinKhusus ? tingkatPoin.indexOf(poin[i]) + 1 : i + 1, poin: poin[i] };
    });
  },

  // Pemain diurutkan dari skor tertinggi; skor sama mendapat peringkat sama.
  peringkat() {
    const urut = [...this.pemain].sort((a, b) => b.skor - a.skor);
    return urut.map((p) => ({ ...p, peringkat: 1 + urut.filter((q) => q.skor > p.skor).length }));
  },
};

export default GameState;
