import { GAME_WIDTH, FONT, WARNA_TEKS } from '../config.js';

// Efek "juice" bersama: animasi karakter, guncangan layar, partikel, teks pop-up, dan konfeti.
// Jumlah partikel dibatasi per jenis supaya tetap 60 FPS di GPU integrated.

function skalaDasar(target) {
  if (target.getData('skalaDasar') === undefined) {
    target.setData('skalaDasar', target.scaleX);
  }
  return target.getData('skalaDasar');
}

// Hanya tween skala yang dihentikan; tween posisi atau sudut tetap berjalan.
function hentikanSkala(scene, target) {
  for (const tween of scene.tweens.getTweensOf(target)) {
    if (tween.data.some((d) => d.key === 'scaleX' || d.key === 'scaleY')) {
      tween.stop();
    }
  }
}

// Napas pelan saat diam: sedikit meninggi dan menyempit bergantian. Pakai origin di kaki.
export function bernapas(scene, target) {
  const s = skalaDasar(target);
  hentikanSkala(scene, target);
  target.setScale(s);
  return scene.tweens.add({
    targets: target,
    scaleX: s * 0.97,
    scaleY: s * 1.04,
    duration: 850,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}

// Stretch: memanjang saat lepas landas, lalu kembali normal di udara.
export function regang(scene, target) {
  const s = skalaDasar(target);
  hentikanSkala(scene, target);
  target.setScale(s * 0.82, s * 1.2);
  return scene.tweens.add({ targets: target, scaleX: s, scaleY: s, duration: 320, ease: 'Sine.easeOut' });
}

// Squash: gepeng saat mendarat, lalu memantul kembali.
export function gepeng(scene, target, selesai) {
  const s = skalaDasar(target);
  hentikanSkala(scene, target);
  target.setScale(s * 1.25, s * 0.75);
  return scene.tweens.add({
    targets: target,
    scaleX: s,
    scaleY: s,
    duration: 260,
    ease: 'Back.easeOut',
    onComplete: selesai,
  });
}

// Berputar satu putaran sampai rebah, lalu bergetar sebentar.
// Origin di kaki, jadi karakter diangkat (default: jari-jari kepala) supaya tidak tenggelam ke tanah.
// Pemanggil yang mengembalikan posisi y dan sudut saat karakter bangun.
export function jatuhBerputar(scene, target, { sudutAkhir = 90, angkat, selesai } = {}) {
  const s = skalaDasar(target);
  hentikanSkala(scene, target);
  target.setScale(s);
  const xAwal = target.x;
  const naik = angkat ?? Math.abs(Math.sin((sudutAkhir * Math.PI) / 180)) * target.displayWidth * 0.35;
  return scene.tweens.chain({
    targets: target,
    tweens: [
      { angle: sudutAkhir + 360, y: target.y - naik, duration: 380, ease: 'Cubic.easeOut' },
      { x: xAwal + 5, duration: 35, ease: 'Sine.easeInOut', yoyo: true, repeat: 4 },
    ],
    onComplete: () => {
      target.x = xAwal;
      target.angle = sudutAkhir;
      selesai?.();
    },
  });
}

// Guncangan ringan; diabaikan jika guncangan sebelumnya belum selesai supaya tidak menumpuk.
export function getarLayar(scene, kekuatan = 0.006, durasi = 150) {
  const kamera = scene.cameras.main;
  if (!kamera.shakeEffect.isRunning) {
    kamera.shake(durasi, kekuatan);
  }
}

// Satu pemancar partikel per jenis per scene, dibuat saat pertama dipakai dan ikut hilang saat scene berhenti.
const pemancar = new WeakMap();
function ambilPemancar(scene, nama, buat) {
  let isi = pemancar.get(scene);
  if (!isi) {
    isi = {};
    pemancar.set(scene, isi);
    scene.events.once('shutdown', () => pemancar.delete(scene));
  }
  isi[nama] ??= buat();
  return isi[nama];
}

// Kepulan debu di kaki saat mendarat. Kedalaman 0: di belakang karakter, di depan latar.
export function debu(scene, x, y, jumlah = 6) {
  ambilPemancar(scene, 'debu', () =>
    scene.add
      .particles(0, 0, 'debu', {
        emitting: false,
        lifespan: 450,
        speed: { min: 50, max: 140 },
        angle: { min: 195, max: 345 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 1, end: 0 },
        gravityY: 260,
        maxAliveParticles: 48,
      })
      .setDepth(0),
  ).explode(jumlah, x, y);
}

// Remah kerupuk berhamburan saat digigit.
export function remah(scene, x, y, jumlah = 8) {
  ambilPemancar(scene, 'remah', () =>
    scene.add
      .particles(0, 0, 'remah', {
        frame: ['krem', 'kuning'],
        emitting: false,
        lifespan: 650,
        speed: { min: 90, max: 220 },
        angle: { min: 200, max: 340 },
        rotate: { min: 0, max: 360 },
        scale: { start: 1, end: 0.6 },
        gravityY: 700,
        maxAliveParticles: 64,
      })
      .setDepth(900),
  ).explode(jumlah, x, y);
}

// Teks singkat yang membesar, melayang naik, lalu memudar.
export function teksPopup(scene, x, y, isi, warna = WARNA_TEKS.KUNING) {
  const label = scene.add
    .text(x, y, isi, {
      fontFamily: FONT,
      fontStyle: '700',
      fontSize: '44px',
      color: warna,
      stroke: WARNA_TEKS.GARIS,
      strokeThickness: 9,
    })
    .setOrigin(0.5)
    .setDepth(1000)
    .setScale(0.3);
  scene.tweens.add({ targets: label, scale: 1, duration: 220, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: label,
    y: y - 60,
    alpha: 0,
    delay: 500,
    duration: 450,
    ease: 'Sine.easeIn',
    onComplete: () => label.destroy(),
  });
  return label;
}

// Hujan konfeti merah, putih, dan kuning dari atas layar.
export function konfeti(scene) {
  return scene.add
    .particles(0, -20, 'konfeti', {
      frame: ['merah', 'krem', 'kuning'],
      x: { min: 0, max: GAME_WIDTH },
      quantity: 2,
      frequency: 70,
      lifespan: 4800,
      speedY: { min: 90, max: 190 },
      speedX: { min: -50, max: 50 },
      rotate: { min: 0, max: 360 },
      scale: { min: 0.9, max: 1.4 },
      gravityY: 40,
      maxAliveParticles: 140,
    })
    .setDepth(950);
}
