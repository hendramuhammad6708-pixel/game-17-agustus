import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';
import { getarLayar, teksPopup } from '../fx/Juice.js';
import { petunjuk, tutsKeyboard } from '../ui/Ui.js';
import { kunciKarakter } from '../scenes/Preload.js';

const TANAH_Y = 640;
const TINGGI_PINANG = 500;
const PUNCAK_Y = TANAH_Y + 2 - TINGGI_PINANG;
const SKALA = 0.6;

const NAIK_PER_TEKAN = 6.5; // piksel per tekanan bergantian yang benar
const MEROSOT_SALAH = 18; // piksel turun saat tombol yang sama ditekan dua kali
const BATAS_DIAM = 500; // milidetik tanpa tekanan sebelum mulai merosot
const KECEPATAN_MEROSOT = 60; // piksel per detik saat diam
const DURASI_EKSPRESI = 400; // milidetik wajah semangat/panik bertahan setelah tekanan
const JEDA_LICIN = 700; // milidetik minimal antar teks "LICIN!" per pemain
const MIRING = 7; // derajat badan miring ke sisi tangan yang terakhir menarik

// Ketinggian kaki saat puncak kepala menyentuh dasar hadiah (kepala 125 satuan SVG di atas kaki, tekstur 1,5x).
const TINGGI_PANJAT = TANAH_Y - (PUNCAK_Y - 4) - (137 - 12) * 1.5 * SKALA;

// Tekan Tombol 1 dan Tombol 2 bergantian untuk memanjat; batang licin membuat karakter merosot.
export default class PanjatPinang extends BaseMiniGame {
  constructor() {
    super('PanjatPinang', {
      nama: 'Panjat Pinang',
      caraMain: 'Tekan Tombol 1 dan Tombol 2 bergantian untuk memanjat, jangan berhenti karena batangnya licin!',
      tombol: [1, 2],
      tanahY: TANAH_Y,
    });
  }

  buatArena() {
    const lebarKolom = GAME_WIDTH / this.pemain.length;

    this.pemanjat = this.pemain.map((p, i) => {
      const x = lebarKolom * (i + 0.5);

      this.add.image(x, TANAH_Y + 2, 'pinang').setOrigin(0.5, 1);
      const hadiah = this.add.image(x, PUNCAK_Y + 6, 'hadiah').setOrigin(0.5, 1);
      const bayangan = this.add.image(x, TANAH_Y + 4, 'bayangan').setScale(SKALA);
      const sprite = this.add
        .image(0, 0, kunciKarakter(p.sprite, 'normal'))
        .setOrigin(0.5, 137 / 140)
        .setScale(SKALA);
      const wadah = this.add.container(x, TANAH_Y + 2, [sprite]);

      // Satu baris di tanah: nama lalu kedua tombol.
      petunjuk(this, x - 68, TANAH_Y + 40, p.nama, 22);
      tutsKeyboard(this, x + 34, TANAH_Y + 38, InputManager.label(p.id, 1), 44);
      tutsKeyboard(this, x + 86, TANAH_Y + 38, InputManager.label(p.id, 2), 44);

      return {
        id: p.id,
        p,
        sprite,
        wadah,
        hadiah,
        bayangan,
        tinggi: 0,
        tombolTerakhir: 0, // 0 berarti belum menekan, jadi tombol mana pun boleh duluan
        waktuDiam: 0,
        waktuCapai: 0,
        merosot: false,
        ekspresi: 'normal',
        waktuEkspresi: 0,
        waktuLicin: -Infinity,
        finish: false,
      };
    });
  }

  perbaruiPermainan(time, delta) {
    const sekarang = this.time.now;

    for (const pp of this.pemanjat) {
      if (!pp.finish) {
        // Jika kedua tombol tertekan di frame yang sama, proses sesuai urutan sebenarnya.
        const tekanan = [1, 2]
          .filter((t) => this.kontrol.justPressed(pp.id, t))
          .sort((a, b) => this.kontrol.waktuTekan(pp.id, a) - this.kontrol.waktuTekan(pp.id, b));

        if (tekanan.length > 0) {
          pp.waktuDiam = 0;
          pp.merosot = false;
          tekanan.forEach((t) => this.tekan(pp, t));
        } else {
          pp.waktuDiam += delta;
          const merosot = pp.waktuDiam > BATAS_DIAM && pp.tinggi > 0;
          if (merosot && !pp.merosot) {
            this.licin(pp, sekarang);
          }
          pp.merosot = merosot;
          if (merosot) {
            pp.tinggi = Math.max(0, pp.tinggi - (KECEPATAN_MEROSOT * delta) / 1000);
            this.aturEkspresi(pp, 'panik', sekarang);
          }
        }
        if (pp.ekspresi !== 'normal' && !pp.merosot && sekarang - pp.waktuEkspresi > DURASI_EKSPRESI) {
          this.aturEkspresi(pp, 'normal', sekarang);
        }
      }
      this.gambar(pp);
    }
  }

  tekan(pp, tombol) {
    if (pp.finish) {
      return;
    }
    const sekarang = this.time.now;

    if (tombol === pp.tombolTerakhir) {
      pp.tinggi = Math.max(0, pp.tinggi - MEROSOT_SALAH);
      this.aturEkspresi(pp, 'panik', sekarang);
      this.licin(pp, sekarang);
      return;
    }

    pp.tinggi += NAIK_PER_TEKAN;
    pp.tombolTerakhir = tombol;
    pp.waktuCapai = this.kontrol.waktuTekan(pp.id, tombol);
    this.aturEkspresi(pp, 'semangat', sekarang);
    // Badan miring ke sisi tangan yang baru menarik.
    this.tweens.add({ targets: pp.wadah, angle: tombol === 1 ? -MIRING : MIRING, duration: 80, ease: 'Sine.easeOut' });

    if (pp.tinggi >= TINGGI_PANJAT) {
      pp.tinggi = TINGGI_PANJAT;
      pp.finish = true;
      this.tandaiFinish(pp.id, pp.waktuCapai);
      this.raihHadiah(pp);
    }
  }

  // Merosot: guncangan ringan dan teks "LICIN!", dibatasi supaya tidak bertubi-tubi.
  licin(pp, sekarang) {
    getarLayar(this, 0.004, 120);
    if (sekarang - pp.waktuLicin > JEDA_LICIN) {
      pp.waktuLicin = sekarang;
      teksPopup(this, pp.wadah.x, pp.wadah.y - 140, 'LICIN!', WARNA_TEKS.LANGIT);
    }
  }

  raihHadiah(pp) {
    this.aturEkspresi(pp, 'semangat', this.time.now);
    this.tweens.add({ targets: pp.wadah, angle: 0, duration: 120 });
    this.tweens.add({ targets: pp.hadiah, y: pp.hadiah.y - 26, duration: 260, ease: 'Quad.easeOut', yoyo: true, repeat: 2 });
    teksPopup(this, pp.wadah.x, PUNCAK_Y - 40, 'MANTAP!');
  }

  aturEkspresi(pp, ekspresi, sekarang) {
    pp.waktuEkspresi = sekarang;
    if (pp.ekspresi !== ekspresi) {
      pp.ekspresi = ekspresi;
      pp.sprite.setTexture(kunciKarakter(pp.p.sprite, ekspresi));
    }
  }

  gambar(pp) {
    pp.wadah.y = TANAH_Y + 2 - pp.tinggi;
    pp.bayangan.setScale(SKALA * Math.max(0.35, 1 - pp.tinggi / TINGGI_PANJAT));
  }

  // Paling tinggi di depan; jika sama, yang lebih dulu mencapainya.
  urutanBelumFinish(ids) {
    return this.pemanjat
      .filter((pp) => ids.includes(pp.id))
      .sort((a, b) => b.tinggi - a.tinggi || a.waktuCapai - b.waktuCapai)
      .map((pp) => pp.id);
  }
}
