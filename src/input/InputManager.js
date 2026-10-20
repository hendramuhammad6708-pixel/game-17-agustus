import Phaser from 'phaser';

// Tombol 1 dan Tombol 2 setiap pemain (PRD bagian Skema Kontrol).
const PEMETAAN = {
  1: [{ kode: 'Q', label: 'Q' }, { kode: 'W', label: 'W' }],
  2: [{ kode: 'V', label: 'V' }, { kode: 'B', label: 'B' }],
  3: [{ kode: 'O', label: 'O' }, { kode: 'P', label: 'P' }],
  4: [{ kode: 'LEFT', label: '←' }, { kode: 'RIGHT', label: '→' }],
};

// Enter memilih, Esc jeda, panah atas/bawah memilih opsi di menu jeda.
const TOMBOL_MENU = ['ENTER', 'ESC', 'UP', 'DOWN'];

// Dibuat sekali per scene: this.kontrol = new InputManager(this).
export default class InputManager {
  constructor(scene) {
    this.tombol = new Map();

    for (const [pemain, daftar] of Object.entries(PEMETAAN)) {
      daftar.forEach((t, i) => this.daftarkan(`${pemain}-${i + 1}`, scene, t.kode));
    }
    TOMBOL_MENU.forEach((kode) => this.daftarkan(kode, scene, kode));

    scene.events.on('preupdate', this.ambilTekanan, this);
    scene.events.once('shutdown', () => scene.events.off('preupdate', this.ambilTekanan, this));
  }

  static label(pemain, tombol) {
    return PEMETAAN[pemain][tombol - 1].label;
  }

  daftarkan(nama, scene, kode) {
    this.tombol.set(nama, { key: scene.input.keyboard.addKey(kode), barusan: false });
  }

  // Dipanggil sekali di awal tiap frame, jadi justPressed bernilai sama sepanjang frame
  // dan tekanan lama (misalnya saat hitung mundur atau jeda) tidak terbawa ke frame berikutnya.
  // Auto-repeat dari tombol yang ditahan sejak scene sebelumnya tidak dihitung sebagai tekanan.
  ambilTekanan() {
    for (const t of this.tombol.values()) {
      t.barusan = Phaser.Input.Keyboard.JustDown(t.key) && !t.key.originalEvent?.repeat;
    }
  }

  isDown(pemain, tombol) {
    return this.tombol.get(`${pemain}-${tombol}`).key.isDown;
  }

  justPressed(pemain, tombol) {
    return this.tombol.get(`${pemain}-${tombol}`).barusan;
  }

  // Waktu tekanan terakhir, untuk menentukan siapa lebih dulu bila terjadi di frame yang sama.
  waktuTekan(pemain, tombol) {
    return this.tombol.get(`${pemain}-${tombol}`).key.timeDown;
  }

  menuDitekan(nama) {
    return this.tombol.get(nama).barusan;
  }
}
