import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';

const AWAL_X = 230;
const FINISH_X = 1190;
const TINGGI_JALUR = 130;

const LEBAR_KARUNG = 36;
const TINGGI_KARUNG = 44;
const JARI_KEPALA = 13;

const JARAK_LOMPAT = 40; // piksel maju per lompatan
const TINGGI_LOMPAT = 28; // piksel di puncak lompatan
const DURASI_LOMPAT = 450; // milidetik di udara
const DURASI_JATUH = 1000; // milidetik diam setelah jatuh

// Jarak tempuh saat sisi depan karung menyentuh garis finish.
const PANJANG_LINTASAN = FINISH_X - AWAL_X - LEBAR_KARUNG / 2;

// Tekan Tombol 1 untuk melompat; menekan lagi sebelum mendarat membuat karakter jatuh.
export default class BalapKarung extends BaseMiniGame {
  constructor() {
    super('BalapKarung', {
      nama: 'Balap Karung',
      caraMain: 'Tekan Tombol 1 untuk melompat maju, tapi tunggu sampai mendarat atau kamu jatuh!',
      tombol: [1],
    });
  }

  buatArena() {
    const atas = 110 + (4 - this.pemain.length) * (TINGGI_JALUR / 2);

    this.pelari = this.pemain.map((p, i) => {
      const tengahY = atas + TINGGI_JALUR / 2 + i * TINGGI_JALUR;
      const tanahY = tengahY + 45;

      this.add.rectangle(GAME_WIDTH / 2, tengahY, GAME_WIDTH - 40, TINGGI_JALUR - 14, WARNA.PUTIH);
      this.add.rectangle(GAME_WIDTH / 2, tanahY, GAME_WIDTH - 40, 4, WARNA.ABU);
      this.add
        .text(40, tengahY - 18, p.nama, { fontFamily: FONT_JUDUL, fontSize: '24px', color: WARNA_TEKS.GELAP })
        .setOrigin(0, 0.5);
      this.add
        .text(40, tengahY + 18, `Tekan ${InputManager.label(p.id, 1)}`, {
          fontFamily: FONT_TEKS,
          fontSize: '22px',
          color: WARNA_TEKS.ABU,
        })
        .setOrigin(0, 0.5);
      this.add.rectangle(FINISH_X, tengahY, 10, TINGGI_JALUR - 14, WARNA.GELAP);

      // Karakter sementara: karung warna pemain dengan kepala bulat, titik pusat di dasar karung.
      const karung = this.add
        .rectangle(0, -TINGGI_KARUNG / 2, LEBAR_KARUNG, TINGGI_KARUNG, p.warna)
        .setStrokeStyle(3, WARNA.GELAP);
      const kepala = this.add
        .circle(0, -TINGGI_KARUNG - JARI_KEPALA + 2, JARI_KEPALA, WARNA.KULIT)
        .setStrokeStyle(3, WARNA.GELAP);
      const badan = this.add.container(AWAL_X, tanahY, [karung, kepala]);

      return {
        id: p.id,
        badan,
        tanahY,
        jarak: 0,
        jarakAwal: 0,
        status: 'siap', // 'siap' di tanah, 'lompat' di udara, 'jatuh' diam sementara
        waktuStatus: 0,
        waktuCapai: 0,
        finish: false,
      };
    });
  }

  perbaruiPermainan(time, delta) {
    for (const pl of this.pelari) {
      // Gerakan dimajukan dulu, jadi tekanan di frame saat mendarat dihitung sebagai lompatan baru.
      this.majukan(pl, delta);
      if (!pl.finish && this.kontrol.justPressed(pl.id, 1)) {
        this.tekan(pl);
      }
      this.gambar(pl);
    }
  }

  majukan(pl, delta) {
    pl.waktuStatus += delta;

    if (pl.status === 'lompat') {
      const f = Math.min(1, pl.waktuStatus / DURASI_LOMPAT);
      pl.jarak = pl.jarakAwal + f * JARAK_LOMPAT;

      if (!pl.finish && pl.jarak >= PANJANG_LINTASAN) {
        pl.finish = true;
        // Mundurkan ke saat tepat menyentuh garis, supaya yang finish di frame yang sama tetap urut adil.
        const lewat = ((pl.jarak - PANJANG_LINTASAN) / JARAK_LOMPAT) * DURASI_LOMPAT;
        this.tandaiFinish(pl.id, performance.now() - lewat);
      }
      if (f >= 1) {
        this.ubahStatus(pl, 'siap');
      }
    } else if (pl.status === 'jatuh' && pl.waktuStatus >= DURASI_JATUH) {
      this.ubahStatus(pl, 'siap');
    }
  }

  tekan(pl) {
    if (pl.status === 'siap') {
      pl.jarakAwal = pl.jarak;
      this.ubahStatus(pl, 'lompat');
    } else if (pl.status === 'lompat') {
      this.ubahStatus(pl, 'jatuh');
    }
  }

  ubahStatus(pl, status) {
    pl.status = status;
    pl.waktuStatus = 0;
    pl.waktuCapai = performance.now();
  }

  gambar(pl) {
    const x = AWAL_X + pl.jarak;

    if (pl.status === 'jatuh') {
      // Rebah ke depan di atas tanah.
      pl.badan.setPosition(x, pl.tanahY - LEBAR_KARUNG / 2).setAngle(90);
      return;
    }

    // Lintasan parabola: 0 di awal dan akhir lompatan, TINGGI_LOMPAT di tengah.
    const f = pl.status === 'lompat' ? Math.min(1, pl.waktuStatus / DURASI_LOMPAT) : 0;
    pl.badan.setPosition(x, pl.tanahY - 4 * TINGGI_LOMPAT * f * (1 - f)).setAngle(0);
  }

  // Posisi terjauh di depan; jika sama, yang lebih dulu sampai di posisi itu.
  urutanBelumFinish(ids) {
    return this.pelari
      .filter((pl) => ids.includes(pl.id))
      .sort((a, b) => b.jarak - a.jarak || a.waktuCapai - b.waktuCapai)
      .map((pl) => pl.id);
  }
}
