import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WARNA, WARNA_TEKS, FONT, FONT_CADANGAN } from '../config.js';
import { siapkanPanel } from '../ui/Ui.js';
import AudioManager from '../audio/AudioManager.js';

export const WARNA_KARAKTER = ['merah', 'biru', 'hijau', 'kuning'];
export const EKSPRESI = ['normal', 'semangat', 'panik', 'pusing', 'nyengir'];

const GAMBAR_LATAR = ['awan', 'kelapa', 'rumah', 'tiang-bendera', 'bendera', 'umbul-umbul', 'tanah'];
const GAMBAR_PROPERTI = [
  'karung',
  'tali',
  'bambu',
  'pinang',
  'hadiah',
  'garis-kapur',
  'garis-finish',
  'sendok',
  'kelereng',
  'tali-tambang',
  'penanda-tali',
];
const PROPERTI_BESAR = ['karung', 'sendok']; // ikut diperbesar bersama karakter, jadi dimuat 1,5x
const PANEL = ['krem', 'merah', 'biru', 'hijau', 'kuning'];

export const kunciKarakter = (warna, ekspresi) => `karakter-${warna}-${ekspresi}`;

// SVG dirasterisasi sekali saat dimuat; yang tampil besar dimuat 1,5x supaya tetap tajam.
function muatAset(load) {
  load.font(FONT, 'assets/fonts/Fredoka.woff2', 'woff2', { weight: '300 700' });

  for (const warna of WARNA_KARAKTER) {
    for (const ekspresi of EKSPRESI) {
      load.svg(kunciKarakter(warna, ekspresi), `assets/sprites/karakter/${warna}-${ekspresi}.svg`, { scale: 1.5 });
    }
  }
  load.svg('bayangan', 'assets/sprites/karakter/bayangan.svg', { scale: 1.5 });
  load.svg('kerupuk', 'assets/sprites/properti/kerupuk.svg', { scale: 1.5 });
  for (const nama of GAMBAR_PROPERTI) {
    load.svg(nama, `assets/sprites/properti/${nama}.svg`, PROPERTI_BESAR.includes(nama) ? { scale: 1.5 } : undefined);
  }
  for (const nama of GAMBAR_LATAR) {
    load.svg(nama, `assets/sprites/latar/${nama}.svg`);
  }
  for (const warna of PANEL) {
    load.svg(`panel-${warna}`, `assets/sprites/ui/panel-${warna}.svg`);
  }
  load.svg('piksel', 'assets/sprites/ui/piksel.svg');
  for (const nama of ['debu', 'remah', 'konfeti']) {
    load.svg(nama, `assets/sprites/partikel/${nama}.svg`);
  }
  AudioManager.muat(load);
}

// Bingkai tambahan: potongan panel dan varian warna partikel dalam satu gambar.
function siapkanBingkai(textures) {
  PANEL.forEach((warna) => siapkanPanel(textures, `panel-${warna}`));
  ['merah', 'krem', 'kuning'].forEach((nama, i) => textures.get('konfeti').add(nama, 0, i * 16, 0, 16, 12));
  ['krem', 'kuning'].forEach((nama, i) => textures.get('remah').add(nama, 0, i * 16, 0, 16, 16));
}

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const tengahX = GAME_WIDTH / 2;
    const tengahY = GAME_HEIGHT / 2;

    // Aset belum ada, jadi layar ini satu-satunya yang memakai bentuk dan font bawaan.
    this.cameras.main.setBackgroundColor(WARNA.MERAH);
    this.add
      .text(tengahX, tengahY - 50, 'Memuat...', { fontFamily: FONT_CADANGAN, fontSize: '40px', color: WARNA_TEKS.KREM })
      .setOrigin(0.5);
    this.add.rectangle(tengahX, tengahY + 20, 500, 24, WARNA.KREM, 0.35);
    const bilah = this.add.rectangle(tengahX - 250, tengahY + 20, 500, 24, WARNA.KREM).setOrigin(0, 0.5);
    bilah.scaleX = 0;
    this.load.on('progress', (nilai) => {
      bilah.scaleX = nilai;
    });

    muatAset(this.load);
  }

  create() {
    siapkanBingkai(this.textures);
    this.scene.launch('Fps');
    this.scene.start('Menu');
  }
}
