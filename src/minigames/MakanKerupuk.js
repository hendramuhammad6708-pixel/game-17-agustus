import Phaser from 'phaser';
import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';
import { bernapas, remah, teksPopup } from '../fx/Juice.js';
import { petunjuk, teks, tutsKeyboard } from '../ui/Ui.js';
import { kunciKarakter } from '../scenes/Preload.js';

const TANAH_Y = 640;
const SKALA = 0.95;
const PIVOT_Y = 132; // sisi bawah bambu gantungan
// Mulut karakter berada (137 - 78) satuan SVG di atas kaki; tekstur dimuat 1,5x.
const MULUT_Y = TANAH_Y - (137 - 78) * 1.5 * SKALA;
const PANJANG_TALI = MULUT_Y - 4 - PIVOT_Y; // dari gantungan sampai sisi bawah kerupuk

const AYUNAN_MAKS = 105; // piksel, jarak mendatar terjauh sisi bawah kerupuk
const AMPLITUDO = Math.asin(AYUNAN_MAKS / PANJANG_TALI);
const PERIODE_MIN = 1.8; // detik per ayunan bolak-balik
const PERIODE_MAKS = 2.2;
const ZONA_GIGIT = 22; // piksel, jarak mendatar sisi bawah kerupuk dari mulut

const TOTAL_GIGITAN = 8;
const JARI_KERUPUK = 50;
const JARI_KERUPUK_MIN = 16;
const JARI_TEKSTUR_KERUPUK = 46 * 1.5;

const DURASI_GIGIT = 250; // milidetik mulut tertutup, jadi satu gigitan per lintasan
const DURASI_NYENGIR = 600; // milidetik tidak bisa menggigit setelah meleset

// Tekan Tombol 1 saat kerupuk yang berayun tepat di depan mulut; 8 gigitan untuk menghabiskannya.
export default class MakanKerupuk extends BaseMiniGame {
  constructor() {
    super('MakanKerupuk', {
      nama: 'Makan Kerupuk',
      caraMain: 'Tekan Tombol 1 untuk menggigit saat kerupuk tepat di depan mulutmu!',
      tombol: [1],
      tanahY: TANAH_Y,
    });
  }

  buatArena() {
    const jumlah = this.pemain.length;
    const lebarKolom = GAME_WIDTH / jumlah;

    // Kecepatan ayunan sedikit berbeda, dibagikan acak tiap ronde supaya tidak ada slot yang selalu diuntungkan.
    const periode = this.pemain.map((_, i) => PERIODE_MIN + ((PERIODE_MAKS - PERIODE_MIN) * i) / Math.max(1, jumlah - 1));
    Phaser.Utils.Array.Shuffle(periode);

    this.waktuMain = 0;
    this.add.tileSprite(GAME_WIDTH / 2, PIVOT_Y - 16, GAME_WIDTH, 32, 'bambu');

    this.pemakan = this.pemain.map((p, i) => {
      const x = lebarKolom * (i + 0.5);

      this.add.image(x, TANAH_Y + 6, 'bayangan').setScale(SKALA);
      const sprite = this.add
        .image(x, TANAH_Y + 4, kunciKarakter(p.sprite, 'normal'))
        .setOrigin(0.5, 137 / 140)
        .setScale(SKALA);
      bernapas(this, sprite);

      const tali = this.add.image(x, PIVOT_Y, 'tali').setOrigin(0.5, 0);
      const kerupuk = this.add.image(x, 0, 'kerupuk');

      // Satu baris di tanah: nama, tombol, sisa gigitan.
      petunjuk(this, x - 88, TANAH_Y + 40, p.nama, 22);
      tutsKeyboard(this, x + 5, TANAH_Y + 38, InputManager.label(p.id, 1), 44);
      const teksSisa = teks(this, x + 84, TANAH_Y + 40, `Sisa ${TOTAL_GIGITAN}`, {
        ukuran: 26,
        warna: WARNA_TEKS.KUNING,
        tebal: 700,
        garis: 7,
      });

      const pm = {
        id: p.id,
        p,
        x,
        sprite,
        tali,
        kerupuk,
        teksSisa,
        sisa: TOTAL_GIGITAN,
        periode: periode[i],
        fase: Math.random() * Math.PI * 2,
        status: 'siap', // 'siap', 'gigit', 'nyengir', atau 'habis'
        waktuStatus: 0,
        waktuCapai: 0,
      };
      this.aturUkuranKerupuk(pm);
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
        this.ubahStatus(pm, 'siap', 'normal');
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

  // Jarak mendatar sisi bawah kerupuk dari mulut pada waktu permainan tertentu.
  jarakMendatar(pm, waktu) {
    return PANJANG_TALI * Math.sin(this.sudut(pm, waktu));
  }

  jariKerupuk(sisa) {
    return JARI_KERUPUK_MIN + ((JARI_KERUPUK - JARI_KERUPUK_MIN) * (sisa - 1)) / (TOTAL_GIGITAN - 1);
  }

  aturUkuranKerupuk(pm) {
    pm.kerupuk.setScale(this.jariKerupuk(pm.sisa) / JARI_TEKSTUR_KERUPUK);
  }

  gigit(pm) {
    // Posisi kerupuk dihitung pada saat tombol benar-benar ditekan, bukan di awal frame.
    const waktuTekan = this.kontrol.waktuTekan(pm.id, 1);
    const telat = Phaser.Math.Clamp(performance.now() - waktuTekan, 0, 100) / 1000;

    if (Math.abs(this.jarakMendatar(pm, this.waktuMain - telat)) > ZONA_GIGIT) {
      this.ubahStatus(pm, 'nyengir', 'nyengir');
      return;
    }

    pm.sisa -= 1;
    pm.waktuCapai = waktuTekan;
    pm.teksSisa.setText(pm.sisa > 0 ? `Sisa ${pm.sisa}` : 'Habis!');
    remah(this, pm.x, MULUT_Y - 6, pm.sisa > 0 ? 7 : 12);

    if (pm.sisa > 0) {
      this.ubahStatus(pm, 'gigit', 'semangat');
      this.aturUkuranKerupuk(pm);
      // Kerupuk terpental kecil saat digigit.
      const skala = pm.kerupuk.scale;
      this.tweens.add({ targets: pm.kerupuk, scale: { from: skala * 1.2, to: skala }, duration: 200, ease: 'Back.easeOut' });
    } else {
      pm.kerupuk.setVisible(false);
      pm.tali.setVisible(false);
      this.ubahStatus(pm, 'habis', 'semangat');
      this.tandaiFinish(pm.id, waktuTekan);
      teksPopup(this, pm.x, MULUT_Y - 150, 'MANTAP!');
    }
  }

  ubahStatus(pm, status, ekspresi) {
    pm.status = status;
    pm.waktuStatus = 0;
    pm.sprite.setTexture(kunciKarakter(pm.p.sprite, ekspresi));
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
    pm.tali.setRotation(-sudut).setDisplaySize(6, PANJANG_TALI - 2 * r + 6);
  }

  // Sisa kerupuk paling sedikit di depan; jika sama, yang lebih dulu mencapainya.
  urutanBelumFinish(ids) {
    return this.pemakan
      .filter((pm) => ids.includes(pm.id))
      .sort((a, b) => a.sisa - b.sisa || a.waktuCapai - b.waktuCapai)
      .map((pm) => pm.id);
  }
}
