import BaseMiniGame from './BaseMiniGame.js';
import { GAME_WIDTH, WARNA_TEKS, POIN_POSISI } from '../config.js';
import InputManager from '../input/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import { regang, gepeng, jatuhBerputar, getarLayar, debu, teksPopup } from '../fx/Juice.js';
import { petunjuk, tutsKeyboard } from '../ui/Ui.js';
import { kunciKarakter } from '../scenes/Preload.js';

const TANAH_Y = 560;
const TENGAH_X = GAME_WIDTH / 2;
const SKALA = 0.62;
const TALI_Y = TANAH_Y - 30; // setinggi tangan karakter
const JARAK_MENANG = 190; // piksel penanda harus bergeser dari tengah untuk menang
const TARIKAN = 5; // piksel per tekanan per anggota
const POSISI_ANGGOTA = [260, 370]; // jarak dari penanda tengah, anggota pertama paling dekat
const MIRING = 12; // derajat badan condong ke belakang saat menarik
const BATAS_CEMAS = 0.45; // bagian dari JARAK_MENANG sebelum wajah berubah
const TARIKAN_KUAT = 28; // piksel dalam JENDELA_KUAT yang dianggap tarikan kuat
const JENDELA_KUAT = 400; // milidetik

// Dua tim kiri dan kanan; Tombol 1 secepat mungkin menarik tali ke arah tim sendiri.
// Tim yang lebih sedikit anggotanya mendapat tarikan berlipat (2 lawan 1: yang sendirian dua kali lipat).
export default class TarikTambang extends BaseMiniGame {
  constructor() {
    super('TarikTambang', {
      nama: 'Tarik Tambang',
      caraMain: 'Tekan Tombol 1 secepat mungkin untuk menarik tali ke arah timmu!',
      tombol: [1],
      tanahY: TANAH_Y,
    });
  }

  buatArena() {
    // Tim mengikuti posisi tombol di keyboard: slot awal di kiri, sisanya di kanan.
    const separuh = Math.ceil(this.pemain.length / 2);
    const anggotaMaks = Math.max(separuh, this.pemain.length - separuh);
    this.tim = [
      { sisi: -1, nama: 'TIM KIRI', pemain: this.pemain.slice(0, separuh) },
      { sisi: 1, nama: 'TIM KANAN', pemain: this.pemain.slice(separuh) },
    ].map((tim) => ({ ...tim, kekuatan: anggotaMaks / tim.pemain.length, riwayat: [] }));

    this.geser = 0; // posisi penanda; negatif = ke kiri
    this.geserTampil = 0; // dihaluskan untuk gambar
    this.waktuGetar = -Infinity;

    // Garis tengah (kapur) dan garis kemenangan tiap tim (kotak-kotak).
    this.add.tileSprite(TENGAH_X, TANAH_Y + 70, 140, 8, 'garis-kapur').setAngle(90);
    for (const sisi of [-1, 1]) {
      this.add.tileSprite(TENGAH_X + sisi * JARAK_MENANG, TANAH_Y + 60, 18, 120, 'garis-finish');
    }

    this.tali = this.add.tileSprite(TENGAH_X, TALI_Y, 1100, 20, 'tali-tambang').setDepth(TANAH_Y + 1);
    this.penanda = this.add.image(TENGAH_X, TALI_Y - 4, 'penanda-tali').setOrigin(0.5, 0.2).setDepth(TANAH_Y + 2);

    this.penarik = [];
    for (const tim of this.tim) {
      petunjuk(this, TENGAH_X + tim.sisi * 360, 150, tim.nama, 34);
      if (tim.kekuatan > 1) {
        petunjuk(this, TENGAH_X + tim.sisi * 360, 190, `tarikan ×${tim.kekuatan}`, 24).setColor(WARNA_TEKS.KUNING);
      }
      tim.pemain.forEach((p, i) => this.penarik.push(this.buatPenarik(p, tim, i)));
    }
  }

  buatPenarik(p, tim, urutan) {
    const jarak = POSISI_ANGGOTA[urutan] ?? POSISI_ANGGOTA[0] + urutan * 120;
    const x = TENGAH_X + tim.sisi * jarak;

    const bayangan = this.add.image(x, TANAH_Y + 4, 'bayangan').setScale(SKALA).setDepth(TANAH_Y - 1);
    const sprite = this.add
      .image(x, TANAH_Y + 2, kunciKarakter(p.sprite, 'normal'))
      .setOrigin(0.5, 137 / 140)
      .setScale(SKALA)
      .setAngle(-tim.sisi * MIRING)
      .setDepth(TANAH_Y);

    // Label di tanah (nama lalu tombol atau CPU), ikut bergeser bersama karakternya.
    const label = [
      petunjuk(this, x, TANAH_Y + 34, p.nama, 22),
      tutsKeyboard(this, x, TANAH_Y + 76, p.bot ? 'CPU' : InputManager.label(p.id, 1), 44),
    ];

    return { id: p.id, p, tim, jarak, sprite, bayangan, label, ekspresi: 'normal', tarik: null };
  }

  perbaruiPermainan(time, delta) {
    const sekarang = this.time.now;
    for (const pn of this.penarik) {
      if (this.kontrol.justPressed(pn.id, 1)) {
        this.geser += pn.tim.sisi * TARIKAN * pn.tim.kekuatan;
        pn.tim.riwayat.push({ waktu: sekarang, tarikan: TARIKAN * pn.tim.kekuatan });
        this.hentak(pn);
      }
    }
    this.cekTarikanKuat(sekarang);

    this.geserTampil += (this.geser - this.geserTampil) * Math.min(1, (12 * delta) / 1000);
    this.gambar();

    const menang = this.tim.find((tim) => tim.sisi * this.geser >= JARAK_MENANG);
    if (menang) {
      this.selesaiTim(menang, `${menang.nama} MENANG!`);
    }
  }

  // Badan tersentak sedikit ke belakang setiap kali menarik.
  hentak(pn) {
    pn.tarik?.stop();
    pn.sprite.angle = -pn.tim.sisi * (MIRING + 8);
    pn.tarik = this.tweens.add({ targets: pn.sprite, angle: -pn.tim.sisi * MIRING, duration: 140, ease: 'Sine.easeOut' });
  }

  // Tarikan kuat (banyak tekanan dalam waktu singkat) membuat layar bergetar dan debu beterbangan.
  cekTarikanKuat(sekarang) {
    for (const tim of this.tim) {
      tim.riwayat = tim.riwayat.filter((r) => sekarang - r.waktu < JENDELA_KUAT);
      const total = tim.riwayat.reduce((jumlah, r) => jumlah + r.tarikan, 0);
      if (total >= TARIKAN_KUAT && sekarang - this.waktuGetar > 1500) {
        this.waktuGetar = sekarang;
        getarLayar(this, 0.004, 160);
        this.penarik.filter((pn) => pn.tim === tim).forEach((pn) => debu(this, pn.sprite.x, TANAH_Y + 2, 4));
      }
    }
  }

  gambar() {
    const geser = this.geserTampil;
    this.tali.x = TENGAH_X + geser;
    this.tali.tilePositionX = -geser;
    this.penanda.x = TENGAH_X + geser;
    for (const pn of this.penarik) {
      const x = TENGAH_X + pn.tim.sisi * pn.jarak + geser;
      pn.sprite.x = x;
      pn.bayangan.x = x;
      pn.label.forEach((benda) => {
        benda.x = x;
      });
      // Tim yang unggul bersemangat, tim yang tertinggal panik.
      const unggul = (pn.tim.sisi * this.geser) / JARAK_MENANG;
      this.aturEkspresi(pn, unggul > BATAS_CEMAS ? 'semangat' : unggul < -BATAS_CEMAS ? 'panik' : 'normal');
    }
  }

  aturEkspresi(pn, ekspresi) {
    if (pn.ekspresi !== ekspresi) {
      pn.ekspresi = ekspresi;
      pn.sprite.setTexture(kunciKarakter(pn.p.sprite, ekspresi));
    }
  }

  // Setiap anggota tim pemenang mendapat poin juara 1; tim yang kalah 0 (PRD).
  selesaiTim(menang, pesan) {
    const kalah = this.tim.find((tim) => tim !== menang);
    const urutan = [...menang.pemain, ...kalah.pemain].map((p) => p.id);
    const poin = urutan.map((id) => (menang.pemain.some((p) => p.id === id) ? POIN_POSISI[0] : 0));

    for (const pn of this.penarik) {
      pn.tarik?.stop();
      if (pn.tim === menang) {
        this.aturEkspresi(pn, 'semangat');
        regang(this, pn.sprite);
        this.tweens.add({
          targets: pn.sprite,
          y: pn.sprite.y - 50,
          angle: 0,
          duration: 240,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => gepeng(this, pn.sprite),
        });
      } else {
        // Tim yang kalah tersungkur ke arah lawan.
        this.aturEkspresi(pn, 'pusing');
        jatuhBerputar(this, pn.sprite, { sudutAkhir: menang.sisi * 90 });
      }
    }
    teksPopup(this, TENGAH_X + menang.sisi * 360, 240, 'MANTAP!');
    getarLayar(this, 0.01, 300);
    AudioManager.play('sorakan');
    this.selesai(urutan, pesan, poin);
  }

  // Waktu habis: tim yang sedang unggul menang; jika penanda tepat di tengah, seri dan tidak ada poin.
  akhiriRonde() {
    if (Math.abs(this.geser) < 1) {
      this.selesai(
        this.pemain.map((p) => p.id),
        'SERI!',
        this.pemain.map(() => 0),
      );
      return;
    }
    this.selesaiTim(this.tim.find((tim) => Math.sign(this.geser) === tim.sisi), 'WAKTU HABIS!');
  }
}
