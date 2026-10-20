import Phaser from 'phaser';
import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA, WARNA_TEKS, FONT_JUDUL, FONT_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';

const PIVOT_Y = 105;
const PANJANG_TALI = 210; // dari gantungan sampai sisi bawah kerupuk
const AMPLITUDO = Phaser.Math.DegToRad(30);
const PERIODE_MIN = 1.8; // detik per ayunan bolak-balik
const PERIODE_MAKS = 2.2;
const ZONA_GIGIT = 22; // piksel, jarak mendatar sisi bawah kerupuk dari mulut

const TOTAL_GIGITAN = 8;
const JARI_KERUPUK = 46;
const JARI_KERUPUK_MIN = 14;

const DURASI_GIGIT = 250; // milidetik mulut tertutup, jadi satu gigitan per lintasan
const DURASI_NYENGIR = 600; // milidetik tidak bisa menggigit setelah meleset

const KEPALA_Y = 300;
const MULUT_Y = KEPALA_Y + 18;
const WARNA_MULUT = 0x5d2a1a;
const WARNA_KERUPUK = 0xfbe9b7;
const WARNA_TEPI_KERUPUK = 0xd4a94f;
const WARNA_TALI = 0x6d4c41;
const WARNA_BAMBU = 0x8d6e63;

// Tekan Tombol 1 saat kerupuk yang berayun tepat di depan mulut; 8 gigitan untuk menghabiskannya.
export default class MakanKerupuk extends BaseMiniGame {
  constructor() {
    super('MakanKerupuk', {
      nama: 'Makan Kerupuk',
      caraMain: 'Tekan Tombol 1 untuk menggigit saat kerupuk tepat di depan mulutmu!',
      tombol: [1],
    });
  }

  buatArena() {
    const jumlah = this.pemain.length;
    const lebarKolom = GAME_WIDTH / jumlah;

    // Kecepatan ayunan sedikit berbeda, dibagikan acak tiap ronde supaya tidak ada slot yang selalu diuntungkan.
    const periode = this.pemain.map((_, i) => PERIODE_MIN + ((PERIODE_MAKS - PERIODE_MIN) * i) / Math.max(1, jumlah - 1));
    Phaser.Utils.Array.Shuffle(periode);

    this.waktuMain = 0;
    this.add.rectangle(GAME_WIDTH / 2, PIVOT_Y - 5, GAME_WIDTH, 12, WARNA_BAMBU);

    this.pemakan = this.pemain.map((p, i) => {
      const x = lebarKolom * (i + 0.5);

      this.add.rectangle(x, 405, 80, 130, p.warna).setStrokeStyle(3, WARNA.GELAP);
      this.add.circle(x, KEPALA_Y, 42, WARNA.KULIT).setStrokeStyle(3, WARNA.GELAP);
      this.add.circle(x - 14, KEPALA_Y - 8, 4, WARNA.GELAP);
      this.add.circle(x + 14, KEPALA_Y - 8, 4, WARNA.GELAP);
      const mulut = {
        siap: this.add.ellipse(x, MULUT_Y, 18, 14, WARNA_MULUT),
        gigit: this.add.rectangle(x, MULUT_Y, 22, 4, WARNA_MULUT),
        nyengir: this.add.rectangle(x, MULUT_Y, 34, 14, WARNA.PUTIH).setStrokeStyle(3, WARNA_MULUT),
      };

      // Digambar setelah kepala supaya kerupuk tampak di depan wajah.
      const tali = this.add.graphics();
      const bintik = [
        [-18, -12],
        [14, -20],
        [20, 10],
        [-10, 18],
        [-24, 6],
      ].map(([dx, dy]) => this.add.circle(dx, dy, 4, WARNA_TEPI_KERUPUK));
      const kerupuk = this.add.container(x, 0, [
        this.add.circle(0, 0, JARI_KERUPUK, WARNA_KERUPUK).setStrokeStyle(4, WARNA_TEPI_KERUPUK),
        ...bintik,
      ]);

      this.add
        .text(x, 510, p.nama, { fontFamily: FONT_JUDUL, fontSize: '24px', color: WARNA_TEKS.GELAP })
        .setOrigin(0.5);
      this.add
        .text(x, 542, `Tekan ${InputManager.label(p.id, 1)}`, {
          fontFamily: FONT_TEKS,
          fontSize: '22px',
          color: WARNA_TEKS.ABU,
        })
        .setOrigin(0.5);
      const teksSisa = this.add
        .text(x, 580, `Sisa: ${TOTAL_GIGITAN}`, { fontFamily: FONT_JUDUL, fontSize: '24px', color: WARNA_TEKS.MERAH })
        .setOrigin(0.5);

      const pm = {
        id: p.id,
        x,
        tali,
        kerupuk,
        mulut,
        teksSisa,
        sisa: TOTAL_GIGITAN,
        periode: periode[i],
        fase: Math.random() * Math.PI * 2,
        status: 'siap', // 'siap', 'gigit', 'nyengir', atau 'habis'
        waktuStatus: 0,
        waktuCapai: 0,
      };
      this.ubahStatus(pm, 'siap');
      this.gambarKerupuk(pm);
      return pm;
    });
  }

  perbaruiPermainan(time, delta) {
    this.waktuMain += delta / 1000;

    for (const pm of this.pemakan) {
      pm.waktuStatus += delta;
      if (
        (pm.status === 'gigit' && pm.waktuStatus >= DURASI_GIGIT) ||
        (pm.status === 'nyengir' && pm.waktuStatus >= DURASI_NYENGIR)
      ) {
        this.ubahStatus(pm, 'siap');
      }

      if (pm.status === 'siap' && this.kontrol.justPressed(pm.id, 1)) {
        this.gigit(pm);
      }
      this.gambarKerupuk(pm);
    }
  }

  sudut(pm, waktu) {
    return AMPLITUDO * Math.sin((2 * Math.PI * waktu) / pm.periode + pm.fase);
  }

  jariKerupuk(sisa) {
    return JARI_KERUPUK_MIN + ((JARI_KERUPUK - JARI_KERUPUK_MIN) * (sisa - 1)) / (TOTAL_GIGITAN - 1);
  }

  gigit(pm) {
    // Posisi kerupuk dihitung pada saat tombol benar-benar ditekan, bukan di awal frame.
    const waktuTekan = this.kontrol.waktuTekan(pm.id, 1);
    const telat = Phaser.Math.Clamp(performance.now() - waktuTekan, 0, 100) / 1000;
    const jarakMendatar = PANJANG_TALI * Math.sin(this.sudut(pm, this.waktuMain - telat));

    if (Math.abs(jarakMendatar) > ZONA_GIGIT) {
      this.ubahStatus(pm, 'nyengir');
      return;
    }

    pm.sisa -= 1;
    pm.waktuCapai = waktuTekan;
    pm.teksSisa.setText(`Sisa: ${pm.sisa}`);

    if (pm.sisa > 0) {
      pm.kerupuk.setScale(this.jariKerupuk(pm.sisa) / JARI_KERUPUK);
      this.ubahStatus(pm, 'gigit');
    } else {
      pm.kerupuk.setVisible(false);
      pm.tali.setVisible(false);
      this.ubahStatus(pm, 'habis');
      this.tandaiFinish(pm.id, waktuTekan);
    }
  }

  ubahStatus(pm, status) {
    pm.status = status;
    pm.waktuStatus = 0;
    const bentukMulut = status === 'habis' ? 'gigit' : status;
    for (const [nama, bentuk] of Object.entries(pm.mulut)) {
      bentuk.setVisible(nama === bentukMulut);
    }
  }

  gambarKerupuk(pm) {
    if (pm.status === 'habis') {
      return;
    }

    const sudut = this.sudut(pm, this.waktuMain);
    const sin = Math.sin(sudut);
    const cos = Math.cos(sudut);
    const r = this.jariKerupuk(pm.sisa);

    // Sisi bawah kerupuk selalu sejauh PANJANG_TALI dari gantungan, jadi tetap sejajar mulut walau mengecil.
    pm.kerupuk.setPosition(pm.x + (PANJANG_TALI - r) * sin, PIVOT_Y + (PANJANG_TALI - r) * cos);
    const ujungTali = PANJANG_TALI - 2 * r;
    pm.tali
      .clear()
      .lineStyle(3, WARNA_TALI)
      .lineBetween(pm.x, PIVOT_Y, pm.x + ujungTali * sin, PIVOT_Y + ujungTali * cos);
  }

  // Sisa kerupuk paling sedikit di depan; jika sama, yang lebih dulu mencapainya.
  urutanBelumFinish(ids) {
    return this.pemakan
      .filter((pm) => ids.includes(pm.id))
      .sort((a, b) => a.sisa - b.sisa || a.waktuCapai - b.waktuCapai)
      .map((pm) => pm.id);
  }
}
