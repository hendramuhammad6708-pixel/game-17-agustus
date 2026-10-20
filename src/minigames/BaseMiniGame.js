import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WARNA_TEKS, HITUNG_MUNDUR, DURASI_MINIGAME } from '../config.js';
import GameState from '../state/GameState.js';
import InputManager from '../input/InputManager.js';
import Latar from '../fx/Latar.js';
import { Panel, Tombol, teks, tirai, masukScene, pindahScene } from '../ui/Ui.js';

const HUD_Y = 44;
const OPSI_JEDA = ['Lanjut', 'Keluar ke Menu'];

/**
 * Kontrak bersama semua mini-game: latar, hitung mundur, timer maksimal, jeda, dan kirim hasil.
 *
 * info: { nama, caraMain, tombol: [1] atau [1, 2], tanahY, skalaLatar }
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
    this.info = info;
  }

  create() {
    this.pemain = GameState.pemain;
    this.sudahFinish = []; // [{ id, waktu }]
    this.sisaWaktu = DURASI_MINIGAME;
    this.berjalan = false;
    this.berakhir = false;
    this.dijeda = false;
    this.time.paused = false;

    masukScene(this);
    this.kontrol = new InputManager(this);
    new Latar(this, { tanahY: this.info.tanahY ?? 640, skalaBenda: this.info.skalaLatar ?? 1 });

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
    const kiri = teks(this, 0, -3, `Ronde ${GameState.ronde + 1}/${GameState.jumlahRonde} · ${this.info.nama}`, {
      ukuran: 24,
      tebal: 600,
    });
    const panelKiri = new Panel(this, 0, 0, kiri.width + 48, 64, 'krem');
    this.add.container(20 + panelKiri.lebar / 2, HUD_Y, [panelKiri, kiri]).setDepth(800);

    this.teksWaktu = teks(this, 0, -4, String(DURASI_MINIGAME), { ukuran: 46, tebal: 700 });
    this.hudWaktu = this.add
      .container(GAME_WIDTH / 2, HUD_Y + 2, [new Panel(this, 0, 0, 120, 76, 'kuning'), this.teksWaktu])
      .setDepth(800);

    const kanan = teks(this, 0, -3, 'Esc: jeda', { ukuran: 22, tebal: 500 });
    const panelKanan = new Panel(this, 0, 0, kanan.width + 44, 56, 'krem');
    this.add.container(GAME_WIDTH - 20 - panelKanan.lebar / 2, HUD_Y, [panelKanan, kanan]).setDepth(800);

    this.teksTengah = teks(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '', {
      ukuran: 150,
      warna: WARNA_TEKS.KUNING,
      tebal: 700,
      garis: 16,
    }).setDepth(1100);
  }

  // Teks besar di tengah yang meletup masuk; jika durasi diisi, teks memudar setelah sekian milidetik.
  tampilkanTengah(isi, { warna = WARNA_TEKS.KUNING, durasi } = {}) {
    this.tweens.killTweensOf(this.teksTengah);
    this.teksTengah.setText(isi).setColor(warna).setAlpha(1).setScale(1.7);
    this.tweens.add({ targets: this.teksTengah, scale: 1, duration: 260, ease: 'Back.easeOut' });
    if (durasi) {
      this.tweens.add({ targets: this.teksTengah, alpha: 0, scale: 1.3, delay: durasi, duration: 250 });
    }
  }

  mulaiHitungMundur() {
    this.tampilkanTengah(String(HITUNG_MUNDUR));
    for (let detik = 1; detik <= HITUNG_MUNDUR; detik++) {
      this.time.delayedCall(detik * 1000, () => {
        const sisa = HITUNG_MUNDUR - detik;
        if (sisa > 0) {
          this.tampilkanTengah(String(sisa));
        } else {
          this.tampilkanTengah('MULAI!', { warna: WARNA_TEKS.MERAH, durasi: 450 });
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

    const detikSebelum = Math.ceil(this.sisaWaktu);
    this.sisaWaktu = Math.max(0, this.sisaWaktu - delta / 1000);
    const detik = Math.ceil(this.sisaWaktu);
    if (detik !== detikSebelum) {
      this.perbaruiWaktu(detik);
    }

    this.perbaruiPermainan(time, delta);

    // Dicek setelah semua pemain diproses, supaya yang finish di frame yang sama tetap diurutkan adil.
    if (this.sudahFinish.length >= this.pemain.length - 1) {
      this.akhiriRonde('SELESAI!');
    } else if (this.sisaWaktu <= 0) {
      this.akhiriRonde('WAKTU HABIS!');
    }
  }

  // 10 detik terakhir: angka merah dan berdenyut.
  perbaruiWaktu(detik) {
    this.teksWaktu.setText(String(detik));
    if (detik <= 10) {
      this.teksWaktu.setColor(WARNA_TEKS.MERAH);
      this.tweens.add({ targets: this.hudWaktu, scale: { from: 1.25, to: 1 }, duration: 300, ease: 'Back.easeOut' });
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
    this.tampilkanTengah(pesan, { warna: WARNA_TEKS.KREM });
    this.time.delayedCall(1500, () => pindahScene(this, 'RoundResult'));
  }

  buatMenuJeda() {
    const tengahX = GAME_WIDTH / 2;
    const judul = teks(this, tengahX, 232, 'JEDA', { ukuran: 72, warna: WARNA_TEKS.MERAH, tebal: 700 });
    this.opsiJeda = OPSI_JEDA.map((label, i) => new Tombol(this, tengahX, 340 + i * 112, label, { ukuran: 36 }));
    const bantuan = teks(this, tengahX, 548, '↑ / ↓ pilih  ·  Enter konfirmasi  ·  Esc lanjut', { ukuran: 22, tebal: 500 });

    this.menuJeda = this.add
      .container(0, 0, [tirai(this), new Panel(this, tengahX, 384, 560, 400, 'krem'), judul, ...this.opsiJeda, bantuan])
      .setDepth(2000)
      .setVisible(false);
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
    this.menuJeda.setVisible(jeda);
    if (jeda) {
      this.tandaiOpsiJeda();
    }
  }

  // Tween tombol tetap jalan saat jeda supaya efek membesar terlihat.
  tandaiOpsiJeda() {
    this.opsiJeda.forEach((tombol, i) => tombol.pilih(i === this.pilihanJeda));
    this.tweens.getTweensOf(this.opsiJeda).forEach((tween) => tween.resume());
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
        pindahScene(this, 'Menu');
      }
    }
  }
}
