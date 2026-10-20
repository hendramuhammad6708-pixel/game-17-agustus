import Phaser from 'phaser';
import { FONT, WARNA_TEKS } from '../config.js';

const SELANG_PERBARUI = 250; // milidetik

// Penghitung FPS di pojok kiri bawah, nyala/mati dengan tombol F.
// Dijalankan sekali dari Preload dan tetap aktif di atas semua scene lain.
export default class Fps extends Phaser.Scene {
  constructor() {
    super('Fps');
  }

  create() {
    const label = this.add
      .text(14, this.scale.height - 10, '', {
        fontFamily: FONT,
        fontStyle: '600',
        fontSize: '22px',
        color: WARNA_TEKS.KREM,
        stroke: WARNA_TEKS.GARIS,
        strokeThickness: 6,
      })
      .setOrigin(0, 1)
      .setVisible(false);

    this.input.keyboard.on('keydown-F', (event) => {
      if (!event.repeat) {
        label.setVisible(!label.visible);
      }
    });
    this.time.addEvent({
      delay: SELANG_PERBARUI,
      loop: true,
      callback: () => label.setText(`FPS ${Math.round(this.game.loop.actualFps)}`),
    });
  }
}
