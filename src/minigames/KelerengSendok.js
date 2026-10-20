import Phaser from 'phaser';
import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA_TEKS } from '../config.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import { getarLayar, debu, teksPopup } from '../fx/Juice.js';
import { petunjuk, tutsKeyboard } from '../ui/Ui.js';
import { kunciKarakter } from '../scenes/Preload.js';

const TANAH_Y = 300;
const TINGGI_JALUR = 100;
const AWAL_X = 230;
const FINISH_X = 1190;
const POS_X = [AWAL_X, AWAL_X + 320, AWAL_X + 640]; // titik kembali saat kelereng jatuh
const SKALA = 0.55;
const MULUT = (137 - 78) * 1.5 * SKALA; // tinggi mulut di atas kaki (tekstur karakter 1,5x)

const KECEPATAN = 50; // piksel per detik saat sendok datar
const PERLAMBATAN = 0.5; // makin miring makin lambat, sampai setengah kecepatan di batas jatuh
const BATAS_MIRING = 35; // derajat; lebih dari ini kelereng jatuh
const BAHAYA = 20; // derajat; wajah mulai panik
const LANGKAH_KOREKSI = 6; // derajat per tekanan
const KETIDAKSTABILAN = 0.9; // per detik; makin miring makin cepat bertambah miring
const DORONGAN = [10, 24]; // derajat per detik, gangguan acak yang sama untuk semua pemain
const GANTI_DORONGAN = [700, 1500]; // milidetik sebelum gangguan berganti arah atau kekuatan
const DURASI_JATUH = 1200; // milidetik sebelum kembali ke pos

// Ukuran sendok dan kelereng di layar (sendok.svg 120 x 60 dimuat 1,5x; bibirnya di y = 24).
const SKALA_SENDOK = 0.6;
const BIBIR_SENDOK = 24 * 1.5 * SKALA_SENDOK;
const SETENGAH_SENDOK = 52 * 1.5 * SKALA_SENDOK;
const JARI_KELERENG = 11;

// Karakter berjalan otomatis; Tombol 1 dan 2 memiringkan sendok ke kiri dan ke kanan supaya kelereng tidak jatuh.
export default class KelerengSendok extends BaseMiniGame {
  constructor() {
    super('KelerengSendok', {
      nama: 'Kelereng Sendok',
      caraMain: 'Tekan Tombol 1 (miring kiri) dan Tombol 2 (miring kanan) supaya kelereng tidak jatuh dari sendok!',
      tombol: [1, 2],
      tanahY: TANAH_Y,
      skalaLatar: 0.65,
    });
  }

  buatArena() {
    const atas = TANAH_Y + (4 - this.pemain.length) * (TINGGI_JALUR / 2);
    const bawah = atas + this.pemain.length * TINGGI_JALUR;

    // Gangguan dipakai bersama supaya semua pemain mendapat dorongan yang sama persis.
    this.gangguan = { nilai: 0, target: 0, ganti: 0 };
    this.add.tileSprite(FINISH_X, (atas + bawah) / 2, 24, bawah - atas - 10, 'garis-finish');

    this.pembawa = this.pemain.map((p, i) => {
      const kakiY = atas + (i + 1) * TINGGI_JALUR - 14;
      if (i < this.pemain.length - 1) {
        this.add.tileSprite(GAME_WIDTH / 2, atas + (i + 1) * TINGGI_JALUR, GAME_WIDTH, 8, 'garis-kapur');
      }

      petunjuk(this, 40, kakiY - 70, p.nama, 22).setOrigin(0, 0.5).setDepth(kakiY);
      if (p.bot) {
        tutsKeyboard(this, 81, kakiY - 26, 'CPU', 48).setDepth(kakiY);
      } else {
        tutsKeyboard(this, 64, kakiY - 26, InputManager.label(p.id, 1), 44).setDepth(kakiY);
        tutsKeyboard(this, 112, kakiY - 26, InputManager.label(p.id, 2), 44).setDepth(kakiY);
      }

      // Bendera pos di sepertiga dan dua pertiga lintasan.
      const bendera = POS_X.slice(1).map((x) => {
        this.add.image(x, kakiY + 2, 'tiang-bendera').setOrigin(0.5, 1).setScale(0.32).setDepth(kakiY - 2);
        return this.add.image(x + 1, kakiY - 76, 'bendera').setOrigin(0, 0).setScale(0.22).setDepth(kakiY - 2);
      });

      const bayangan = this.add.image(AWAL_X, kakiY + 2, 'bayangan').setScale(SKALA).setDepth(kakiY - 1);
      const sprite = this.add.image(0, 0, kunciKarakter(p.sprite, 'normal')).setOrigin(0.5, 137 / 140).setScale(SKALA);
      const sendok = this.add.image(0, 4 - MULUT, 'sendok').setOrigin(0.5, 2 / 60).setScale(SKALA_SENDOK);
      const kelereng = this.add.image(0, 0, 'kelereng').setScale(JARI_KELERENG / 10); // kelereng.svg berjari-jari 10
      const wadah = this.add.container(AWAL_X, kakiY, [sprite, sendok, kelereng]).setDepth(kakiY);

      const pk = {
        id: p.id,
        p,
        sprite,
        sendok,
        kelereng,
        wadah,
        bayangan,
        bendera,
        kakiY,
        x: AWAL_X,
        miring: 0, // derajat, positif = miring ke kanan
        pos: 0, // indeks pos terakhir yang dicapai
        status: 'jalan', // 'jalan', 'jatuh', atau 'finish'
        waktuStatus: 0,
        waktuJalan: 0,
        ekspresi: 'normal',
      };
      this.gambar(pk);
      return pk;
    });
  }

  perbaruiPermainan(time, delta) {
    const detik = delta / 1000;
    this.perbaruiGangguan(detik);

    for (const pk of this.pembawa) {
      if (pk.status === 'jatuh') {
        pk.waktuStatus += delta;
        if (pk.waktuStatus >= DURASI_JATUH) {
          this.kembaliKePos(pk);
        }
      } else if (pk.status === 'jalan') {
        this.jalan(pk, detik);
      }
      this.gambar(pk);
    }
  }

  perbaruiGangguan(detik) {
    const g = this.gangguan;
    const sekarang = this.time.now;
    if (sekarang >= g.ganti) {
      g.target = Phaser.Math.FloatBetween(...DORONGAN) * (Math.random() < 0.5 ? -1 : 1);
      g.ganti = sekarang + Phaser.Math.Between(...GANTI_DORONGAN);
    }
    g.nilai += (g.target - g.nilai) * Math.min(1, 3 * detik);
  }

  jalan(pk, detik) {
    if (this.kontrol.justPressed(pk.id, 1)) {
      pk.miring -= LANGKAH_KOREKSI;
    }
    if (this.kontrol.justPressed(pk.id, 2)) {
      pk.miring += LANGKAH_KOREKSI;
    }
    pk.miring += (this.gangguan.nilai + pk.miring * KETIDAKSTABILAN) * detik;

    if (Math.abs(pk.miring) > BATAS_MIRING) {
      this.jatuhkan(pk);
      return;
    }

    const kecepatan = KECEPATAN * (1 - (PERLAMBATAN * Math.abs(pk.miring)) / BATAS_MIRING);
    pk.x += kecepatan * detik;
    pk.waktuJalan += detik;

    while (pk.pos + 1 < POS_X.length && pk.x >= POS_X[pk.pos + 1]) {
      pk.pos += 1;
      const bendera = pk.bendera[pk.pos - 1];
      this.tweens.add({ targets: bendera, scale: { from: 0.34, to: 0.22 }, duration: 400, ease: 'Back.easeOut' });
    }

    if (pk.x >= FINISH_X) {
      pk.status = 'finish';
      pk.miring = 0;
      // Mundurkan ke saat tepat menyentuh garis, supaya yang finish di frame yang sama tetap urut adil.
      this.tandaiFinish(pk.id, performance.now() - ((pk.x - FINISH_X) / kecepatan) * 1000);
      this.aturEkspresi(pk, 'semangat');
      teksPopup(this, pk.x, pk.kakiY - 110, 'MANTAP!');
      return;
    }
    this.aturEkspresi(pk, Math.abs(pk.miring) > BAHAYA ? 'panik' : 'normal');
  }

  // Posisi kelereng relatif terhadap wadah karakter: menggelinding ke sisi sendok yang lebih rendah.
  posisiKelereng(pk) {
    const rad = Phaser.Math.DegToRad(pk.miring);
    const geser = Phaser.Math.Clamp(pk.miring / BATAS_MIRING, -1, 1) * SETENGAH_SENDOK * 0.85;
    const tinggi = BIBIR_SENDOK - JARI_KELERENG;
    return {
      x: pk.sendok.x + geser * Math.cos(rad) - tinggi * Math.sin(rad),
      y: pk.sendok.y + geser * Math.sin(rad) + tinggi * Math.cos(rad),
    };
  }

  jatuhkan(pk) {
    pk.status = 'jatuh';
    pk.waktuStatus = 0;
    this.aturEkspresi(pk, 'pusing');

    // Kelereng lepas dari sendok, memantul di tanah, lalu menghilang.
    const { x, y } = this.posisiKelereng(pk);
    pk.kelereng.setVisible(false);
    const bola = this.add.image(pk.wadah.x + x, pk.wadah.y + y, 'kelereng').setScale(pk.kelereng.scale).setDepth(pk.kakiY + 1);
    this.tweens.add({ targets: bola, x: bola.x + Math.sign(pk.miring) * 45, duration: 650, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: bola,
      y: pk.kakiY - JARI_KELERENG,
      duration: 650,
      ease: 'Bounce.easeOut',
      onComplete: () => this.tweens.add({ targets: bola, alpha: 0, duration: 300, onComplete: () => bola.destroy() }),
    });

    getarLayar(this);
    teksPopup(this, pk.x, pk.kakiY - 110, 'JATUH!', WARNA_TEKS.MERAH);
    AudioManager.play('jatuh');
  }

  kembaliKePos(pk) {
    pk.status = 'jalan';
    pk.x = POS_X[pk.pos];
    pk.miring = 0;
    pk.kelereng.setVisible(true);
    this.aturEkspresi(pk, 'normal');
    this.tweens.add({ targets: pk.wadah, alpha: { from: 0, to: 1 }, duration: 300 });
    debu(this, pk.x, pk.kakiY, 6);
  }

  aturEkspresi(pk, ekspresi) {
    if (pk.ekspresi !== ekspresi) {
      pk.ekspresi = ekspresi;
      pk.sprite.setTexture(kunciKarakter(pk.p.sprite, ekspresi));
    }
  }

  gambar(pk) {
    // Langkah kecil naik-turun saat berjalan.
    const langkah = pk.status === 'jalan' ? Math.abs(Math.sin(pk.waktuJalan * 9)) * 4 : 0;
    pk.wadah.setPosition(pk.x, pk.kakiY - langkah);
    pk.bayangan.setPosition(pk.x, pk.kakiY + 2);
    pk.sendok.setAngle(pk.miring);
    if (pk.kelereng.visible) {
      const { x, y } = this.posisiKelereng(pk);
      pk.kelereng.setPosition(x, y);
    }
  }

  // Yang terjauh di depan.
  urutanBelumFinish(ids) {
    return this.pembawa
      .filter((pk) => ids.includes(pk.id))
      .sort((a, b) => b.x - a.x)
      .map((pk) => pk.id);
  }
}
