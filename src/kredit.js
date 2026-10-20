// Isi layar Kredit. Cukup ubah daftar di file ini; tampilan menyesuaikan dan bergulir jika panjang.

export const NAMA_TIM = 'Nama Tim';

export const ANGGOTA_TIM = [
  { nama: 'Nama Anggota 1', peran: 'Programmer' },
  { nama: 'Nama Anggota 2', peran: 'Desain dan Aset' },
  { nama: 'Nama Anggota 3', peran: 'Audio dan Uji Main' },
];

// Semua aset pihak ketiga wajib dicantumkan sesuai lisensinya (PRD).
// Saat file audio ditambahkan, tulis juga di sini, misalnya:
// { judul: 'Musik Menu', jenis: 'Musik', pembuat: 'Nama Pembuat', lisensi: 'CC0', sumber: 'kenney.nl' },
export const ASET_PIHAK_KETIGA = [
  {
    judul: 'Phaser 3',
    jenis: 'Game engine',
    pembuat: 'Richard Davey, Phaser Studio Inc.',
    lisensi: 'MIT',
    sumber: 'phaser.io',
  },
  {
    judul: 'Fredoka',
    jenis: 'Font',
    pembuat: 'The Fredoka Project Authors',
    lisensi: 'SIL Open Font License 1.1',
    sumber: 'fonts.google.com/specimen/Fredoka',
  },
];

export const CATATAN = 'Grafis karakter, latar, dan properti dibuat khusus untuk game ini.';
