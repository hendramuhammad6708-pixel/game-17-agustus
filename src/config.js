// Konstanta global game.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Durasi dalam detik.
export const DURASI_INSTRUKSI = 3;
export const HITUNG_MUNDUR = 3;
export const DURASI_MINIGAME = 60;

// Poin untuk juara 1 sampai 4.
export const POIN_POSISI = [3, 2, 1, 0];

// Minimal pemain manusia; slot sisanya diisi CPU sehingga selalu ada 4 peserta.
export const MIN_PEMAIN = 1;

// Key scene mini-game di mode Turnamen; urutannya diacak setiap turnamen.
export const MINIGAME_TURNAMEN = ['BalapKarung', 'MakanKerupuk', 'PanjatPinang'];

// Palet art direction: kartun datar, outline #2B2D42.
export const WARNA = {
  MERAH: 0xe63946,
  KREM: 0xf1faee,
  LANGIT: 0xa8dadc,
  RUMPUT: 0x6ab04c,
  KUNING: 0xffd166,
  GARIS: 0x2b2d42,
};

export const WARNA_TEKS = {
  MERAH: '#E63946',
  KREM: '#F1FAEE',
  KUNING: '#FFD166',
  LANGIT: '#A8DADC',
  GARIS: '#2B2D42',
};

// Fredoka dimuat dari public/assets/fonts di Preload; cadangannya untuk layar Memuat.
export const FONT = 'Fredoka';
export const FONT_CADANGAN = '"Arial Black", Arial, sans-serif';
