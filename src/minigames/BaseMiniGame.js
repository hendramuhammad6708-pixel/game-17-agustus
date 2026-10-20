import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WARNA,
  WARNA_TEKS,
  FONT_JUDUL,
  FONT_TEKS,
  HITUNG_MUNDUR,
  DURASI_MINIGAME,
} from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';

const TINGGI_HUD = 70;
const OPSI_JEDA = ['Lanjut', 'Keluar ke Menu'];

/**
 * Kontrak bersama semua mini-game: hitung mundur, timer maksimal, jeda, dan kirim hasil.
 *
 * Turunan cukup mengisi (jangan menimpa create/update):
 *   buatArena()                     menggambar arena untuk this.pemain
 *   perbaruiPermainan(time, delta)  dipanggil tiap frame selama permainan berjalan
 *   urutanBelumFinish(ids)          mengurutkan pemain yang belum finish, progres terjauh dulu
 * lalu memanggil tandaiFinish(id, waktu) saat seorang pemain finish.
 * Ronde berakhir saat tinggal satu pemain yang belum finish atau waktu habis.
 */
export default class BaseMiniGame extends Phaser.Scene {
  constructor(key, info) {
    super(key);
    this.info = info; // { nama, caraMain, tombol: [1] atau [1, 2] }
  }

  create() {
    this.pemain = GameState.pemain;
    this.sudahFinish = []; // [{ id, waktu }]
    this.sisaWaktu = DURASI_MINIGAME;
    this.berjalan = false;
    this.berakhir = false;
    this.dijeda = false;
    this.hapusTengah = null;
    this.time.paused = false;

    this.kontrol = new InputManager(this);
    this.cameras.main.setBackgroundColor(WARNA.KREM);

    this.buatArena();
    this.buatHud();
    this.buatMenuJeda();
    this.mulaiHitungMundur();
  }

  buatArena() {}

  perbaruiPermainan() {}

  urutanBelumFinish(ids) {
    return ids;
  }

  buatHud() {
    this.add.rectangle(0, 0, GAME_WIDTH, TINGGI_HUD, WARNA.MERAH).setOrigin(0);
    this.add
      .text(24, TINGGI_HUD / 2, `Ronde ${GameState.ronde + 1}/${GameState.jumlahRonde} · ${this.info.nama}`, {
        fontFamily: FONT_JUDUL,
        fontSize: '26px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0, 0.5);
    this.teksWaktu = this.add
      .text(GAME_WIDTH / 2, TINGGI_HUD / 2, String(DURASI_MINIGAME), {
        fontFamily: FONT_JUDUL,
        fontSize: '44px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH - 24, TINGGI_HUD / 2, 'Esc: jeda', {
        fontFamily: FONT_TEKS,
        fontSize: '22px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(1, 0.5);

    this.teksTengah = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: FONT_JUDUL,
        fontSize: '120px',
        color: WARNA_TEKS.MERAH,
        stroke: WARNA_TEKS.PUTIH,
        strokeThickness: 16,
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // Menampilkan teks besar di tengah; jika durasi diisi, teks hilang setelah sekian milidetik.
  tampilkanTengah(teks, durasi) {
    this.hapusTengah?.remove();
    this.teksTengah.setText(teks);
    this.hapusTengah = durasi ? this.time.delayedCall(durasi, () => this.teksTengah.setText('')) : null;
  }

  mulaiHitungMundur() {
    this.tampilkanTengah(String(HITUNG_MUNDUR));
    for (let detik = 1; detik <= HITUNG_MUNDUR; detik++) {
      this.time.delayedCall(detik * 1000, () => {
        const sisa = HITUNG_MUNDUR - detik;
        if (sisa > 0) {
          this.tampilkanTengah(String(sisa));
        } else {
          this.tampilkanTengah('MULAI!', 700);
          this.berjalan = true;
        }
      });
    }
  }

  update(time, delta) {
    if (!this.berakhir && this.kontrol.menuDitekan('ESC')) {
      this.aturJeda(!this.dijeda);
      return;
    }
    if (this.dijeda) {
      this.perbaruiMenuJeda();
      return;
    }
    if (!this.berjalan) {
      return;
    }

    this.sisaWaktu = Math.max(0, this.sisaWaktu - delta / 1000);
    this.teksWaktu.setText(String(Math.ceil(this.sisaWaktu)));

    this.perbaruiPermainan(time, delta);

    // Dicek setelah semua pemain diproses, supaya yang finish di frame yang sama tetap diurutkan adil.
    if (this.sudahFinish.length >= this.pemain.length - 1) {
      this.akhiriRonde('SELESAI!');
    } else if (this.sisaWaktu <= 0) {
      this.akhiriRonde('WAKTU HABIS!');
    }
  }

  tandaiFinish(id, waktu = performance.now()) {
    if (this.berjalan && !this.sudahFinish.some((f) => f.id === id)) {
      this.sudahFinish.push({ id, waktu });
    }
  }

  akhiriRonde(pesan) {
    const finish = [...this.sudahFinish].sort((a, b) => a.waktu - b.waktu).map((f) => f.id);
    const sisa = this.pemain.map((p) => p.id).filter((id) => !finish.includes(id));
    this.selesai([...finish, ...this.urutanBelumFinish(sisa)], pesan);
  }

  // urutanFinish: id pemain dari juara 1 sampai terakhir. Membagi poin lalu pindah ke Hasil Ronde.
  selesai(urutanFinish, pesan = 'SELESAI!') {
    if (this.berakhir) {
      return;
    }
    this.berakhir = true;
    this.berjalan = false;
    GameState.catatHasil(urutanFinish);
    this.tampilkanTengah(pesan);
    this.time.delayedCall(1500, () => this.scene.start('RoundResult'));
  }

  buatMenuJeda() {
    const tengahX = GAME_WIDTH / 2;
    const latar = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setOrigin(0);
    const judul = this.add
      .text(tengahX, 220, 'JEDA', { fontFamily: FONT_JUDUL, fontSize: '88px', color: WARNA_TEKS.PUTIH })
      .setOrigin(0.5);
    this.opsiJeda = OPSI_JEDA.map((label, i) =>
      this.add
        .text(tengahX, 360 + i * 80, label, { fontFamily: FONT_JUDUL, fontSize: '40px', color: WARNA_TEKS.PUTIH })
        .setOrigin(0.5),
    );
    const petunjuk = this.add
      .text(tengahX, 560, '↑ / ↓ pilih   ·   Enter konfirmasi   ·   Esc lanjut', {
        fontFamily: FONT_TEKS,
        fontSize: '24px',
        color: WARNA_TEKS.PUTIH,
      })
      .setOrigin(0.5);

    this.menuJeda = this.add.container(0, 0, [latar, judul, ...this.opsiJeda, petunjuk]).setDepth(100);
    this.menuJeda.setVisible(false);
  }

  aturJeda(jeda) {
    this.dijeda = jeda;
    this.time.paused = jeda;
    if (jeda) {
      this.tweens.pauseAll();
    } else {
      this.tweens.resumeAll();
    }
    this.pilihanJeda = 0;
    this.tandaiOpsiJeda();
    this.menuJeda.setVisible(jeda);
    this.teksTengah.setVisible(!jeda);
  }

  tandaiOpsiJeda() {
    this.opsiJeda.forEach((teks, i) => {
      const dipilih = i === this.pilihanJeda;
      teks.setColor(dipilih ? '#ffd54f' : WARNA_TEKS.PUTIH).setScale(dipilih ? 1.15 : 1);
    });
  }

  perbaruiMenuJeda() {
    if (this.kontrol.menuDitekan('UP') || this.kontrol.menuDitekan('DOWN')) {
      this.pilihanJeda = (this.pilihanJeda + 1) % OPSI_JEDA.length;
      this.tandaiOpsiJeda();
    }
    if (this.kontrol.menuDitekan('ENTER')) {
      if (this.pilihanJeda === 0) {
        this.aturJeda(false);
      } else {
        GameState.reset();
        this.scene.start('Menu');
      }
    }
  }
}
