import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import { bernapas, regang, gepeng, jatuhBerputar, getarLayar, debu, teksPopup } from '../fx/Juice.js';
import { petunjuk, tutsKeyboard } from '../ui/Ui.js';
import { kunciKarakter } from '../scenes/Preload.js';

const TANAH_Y = 300;
const TINGGI_JALUR = 100;
const AWAL_X = 230;
const FINISH_X = 1190;
const SKALA = 0.55;

const JARAK_LOMPAT = 40; // piksel maju per lompatan
const TINGGI_LOMPAT = 34; // piksel di puncak lompatan
const DURASI_LOMPAT = 450; // milidetik di udara
const DURASI_JATUH = 1000; // milidetik diam setelah jatuh

// Setengah lebar karung di layar; jarak tempuh saat sisi depan karung menyentuh garis finish.
const SETENGAH_KARUNG = 47 * 1.5 * SKALA;
const PANJANG_LINTASAN = FINISH_X - 12 - AWAL_X - SETENGAH_KARUNG;

// Tekan Tombol 1 untuk melompat; menekan lagi sebelum mendarat membuat karakter jatuh.
export default class BalapKarung extends BaseMiniGame {
  constructor() {
    super('BalapKarung', {
      nama: 'Balap Karung',
      caraMain: 'Tekan Tombol 1 untuk melompat maju, tapi tunggu sampai mendarat atau kamu jatuh!',
      tombol: [1],
      tanahY: TANAH_Y,
      skalaLatar: 0.65,
    });
  }

  buatArena() {
    const atas = TANAH_Y + (4 - this.pemain.length) * (TINGGI_JALUR / 2);
    const bawah = atas + this.pemain.length * TINGGI_JALUR;

    this.add.tileSprite(FINISH_X, (atas + bawah) / 2, 24, bawah - atas - 10, 'garis-finish');

    this.pelari = this.pemain.map((p, i) => {
      // Kaki berpijak dekat batas bawah jalur; jalur bawah digambar di depan jalur atas.
      const kakiY = atas + (i + 1) * TINGGI_JALUR - 14;
      if (i < this.pemain.length - 1) {
        this.add.tileSprite(GAME_WIDTH / 2, atas + (i + 1) * TINGGI_JALUR, GAME_WIDTH, 8, 'garis-kapur');
      }

      petunjuk(this, 40, kakiY - 70, p.nama, 22).setOrigin(0, 0.5).setDepth(kakiY);
      tutsKeyboard(this, p.bot ? 81 : 70, kakiY - 26, p.bot ? 'CPU' : InputManager.label(p.id, 1), 48).setDepth(kakiY);

      const bayangan = this.add.image(AWAL_X, kakiY + 2, 'bayangan').setScale(SKALA).setDepth(kakiY - 1);
      const sprite = this.add.image(0, 0, kunciKarakter(p.sprite, 'normal')).setOrigin(0.5, 137 / 140);
      const karung = this.add.image(0, 0, 'karung').setOrigin(0.5, 137 / 140);
      // badan dianimasikan Juice (skala, sudut); wadah dipindah logika permainan.
      const badan = this.add.container(0, 0, [sprite, karung]).setScale(SKALA);
      const wadah = this.add.container(AWAL_X, kakiY, [badan]).setDepth(kakiY);
      bernapas(this, badan);

      return {
        id: p.id,
        p,
        sprite,
        badan,
        wadah,
        bayangan,
        kakiY,
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
        teksPopup(this, AWAL_X + pl.jarak, pl.kakiY - 110, 'MANTAP!');
      }
      if (f >= 1) {
        this.mendarat(pl);
      }
    } else if (pl.status === 'jatuh' && pl.waktuStatus >= DURASI_JATUH) {
      this.bangun(pl);
    }
  }

  tekan(pl) {
    if (pl.status === 'siap') {
      pl.jarakAwal = pl.jarak;
      this.ubahStatus(pl, 'lompat', 'semangat');
      regang(this, pl.badan);
      AudioManager.play('lompat');
    } else if (pl.status === 'lompat') {
      this.ubahStatus(pl, 'jatuh', 'pusing');
      AudioManager.play('jatuh');
      jatuhBerputar(this, pl.badan, { angkat: 28 });
      getarLayar(this);
      teksPopup(this, AWAL_X + pl.jarak, pl.kakiY - 110, 'JATUH!', WARNA_TEKS.MERAH);
    }
  }

  mendarat(pl) {
    this.ubahStatus(pl, 'siap', pl.finish ? 'semangat' : 'normal');
    gepeng(this, pl.badan, () => bernapas(this, pl.badan));
    debu(this, AWAL_X + pl.jarak, pl.kakiY, 5);
  }

  bangun(pl) {
    this.ubahStatus(pl, 'siap', 'normal');
    this.tweens.add({
      targets: pl.badan,
      angle: 0,
      y: 0,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => pl.status === 'siap' && bernapas(this, pl.badan),
    });
  }

  ubahStatus(pl, status, ekspresi) {
    pl.status = status;
    pl.waktuStatus = 0;
    pl.waktuCapai = performance.now();
    pl.sprite.setTexture(kunciKarakter(pl.p.sprite, ekspresi));
  }

  gambar(pl) {
    // Lintasan parabola: 0 di awal dan akhir lompatan, TINGGI_LOMPAT di tengah.
    const f = pl.status === 'lompat' ? Math.min(1, pl.waktuStatus / DURASI_LOMPAT) : 0;
    const naik = 4 * TINGGI_LOMPAT * f * (1 - f);
    const x = AWAL_X + pl.jarak;
    pl.wadah.setPosition(x, pl.kakiY - naik);
    pl.bayangan.setPosition(x, pl.kakiY + 2).setScale(SKALA * (1 - naik / (TINGGI_LOMPAT * 2.5)));
  }

  // Posisi terjauh di depan; jika sama, yang lebih dulu sampai di posisi itu.
  urutanBelumFinish(ids) {
    return this.pelari
      .filter((pl) => ids.includes(pl.id))
      .sort((a, b) => b.jarak - a.jarak || a.waktuCapai - b.waktuCapai)
      .map((pl) => pl.id);
  }
}
