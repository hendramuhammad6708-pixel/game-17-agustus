import Phaser from 'phaser';

// Slot audio: nama dipakai di kode -> nama file (tanpa ekstensi) di public/assets/audio.
// Format boleh .mp3, .ogg, atau .wav; dicari dengan urutan itu.
export const EFEK = {
  lompat: 'efek-lompat',
  jatuh: 'efek-jatuh',
  gigit: 'efek-gigit',
  merosot: 'efek-merosot',
  peluit: 'efek-peluit-mulai',
  sorakan: 'efek-sorakan',
  klik: 'efek-klik-menu',
};
export const MUSIK = {
  menu: 'musik-menu',
  permainan: 'musik-permainan',
};

const FOLDER = 'assets/audio/';
const FORMAT = ['mp3', 'ogg', 'wav'];
const LANGKAH_VOLUME = 0.1;

// Mengembalikan URL file yang ada, atau null. Dev server Vite membalas halaman HTML untuk file
// yang tidak ada (bukan 404), jadi jenis isinya juga dicek supaya Phaser tidak gagal mendekode.
async function cariFile(nama) {
  for (const format of FORMAT) {
    const url = `${FOLDER}${nama}.${format}`;
    try {
      const respons = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (respons.ok && !(respons.headers.get('content-type') ?? '').includes('text/html')) {
        return url;
      }
    } catch {
      // Jaringan gagal atau terlalu lama: anggap file tidak ada.
    }
  }
  return null;
}

// Placeholder sementara: nada pendek Web Audio untuk efek yang filenya belum ada.
const RESEP = {
  lompat: { gelombang: 'square', dari: 320, ke: 660, durasi: 0.12 },
  jatuh: { gelombang: 'sawtooth', dari: 520, ke: 110, durasi: 0.35 },
  gigit: { derau: 2500, durasi: 0.08 },
  merosot: { gelombang: 'triangle', dari: 760, ke: 240, durasi: 0.4 },
  peluit: { gelombang: 'sine', dari: 2100, ke: 2100, durasi: 0.55, getar: 60 },
  sorakan: { derau: 1200, durasi: 1.1, serang: 0.15 },
  klik: { gelombang: 'square', dari: 1100, ke: 1100, durasi: 0.04 },
};

function bunyiSintetis(sound, namaEfek, volume) {
  const konteks = sound.context;
  const resep = RESEP[namaEfek];
  if (!konteks || !resep || sound.locked) {
    return;
  }
  const t = konteks.currentTime;
  const akhir = t + resep.durasi;

  const penguat = konteks.createGain();
  const puncak = 0.25 * volume;
  penguat.gain.setValueAtTime(resep.serang ? 0.0001 : puncak, t);
  if (resep.serang) {
    penguat.gain.exponentialRampToValueAtTime(puncak, t + resep.serang);
  }
  penguat.gain.exponentialRampToValueAtTime(0.0001, akhir);
  penguat.connect(sound.masterVolumeNode ?? konteks.destination);

  let sumber;
  if (resep.derau) {
    // Derau putih yang disaring: terdengar seperti kriuk (pendek) atau sorakan (panjang).
    const buffer = konteks.createBuffer(1, Math.ceil(konteks.sampleRate * resep.durasi), konteks.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    sumber = konteks.createBufferSource();
    sumber.buffer = buffer;
    const saring = konteks.createBiquadFilter();
    saring.type = 'bandpass';
    saring.frequency.value = resep.derau;
    sumber.connect(saring).connect(penguat);
  } else {
    sumber = konteks.createOscillator();
    sumber.type = resep.gelombang;
    sumber.frequency.setValueAtTime(resep.dari, t);
    sumber.frequency.exponentialRampToValueAtTime(resep.ke, akhir);
    if (resep.getar) {
      // Getaran nada seperti peluit.
      const lfo = konteks.createOscillator();
      const kedalaman = konteks.createGain();
      lfo.frequency.value = 28;
      kedalaman.gain.value = resep.getar;
      lfo.connect(kedalaman).connect(sumber.frequency);
      lfo.start(t);
      lfo.stop(akhir);
    }
    sumber.connect(penguat);
  }
  sumber.start(t);
  sumber.stop(akhir);
}

// Satu-satunya pintu audio game. Volume disimpan di memori selama sesi (PRD: tanpa penyimpanan).
const AudioManager = {
  game: null,
  volume: { musik: 0.6, efek: 0.8 },
  file: {}, // nama file -> URL yang ditemukan
  musik: null,
  namaMusik: null,

  pasang(game) {
    this.game = game;
  },

  // Dipanggil sekali di Boot sebelum Preload.
  async periksaFile() {
    const semua = [...Object.values(EFEK), ...Object.values(MUSIK)];
    const hasil = await Promise.all(semua.map(cariFile));
    semua.forEach((nama, i) => {
      if (hasil[i]) {
        this.file[nama] = hasil[i];
      }
    });
  },

  // Dipanggil di Preload; hanya file yang ada yang dimuat.
  muat(load) {
    for (const [nama, url] of Object.entries(this.file)) {
      load.audio(nama, url);
    }
  },

  play(namaEfek) {
    const nama = EFEK[namaEfek];
    if (!nama || !this.game || this.volume.efek <= 0) {
      return;
    }
    if (this.game.cache.audio.exists(nama)) {
      this.game.sound.play(nama, { volume: this.volume.efek });
    } else {
      bunyiSintetis(this.game.sound, namaEfek, this.volume.efek);
    }
  },

  // Musik yang sama tidak diulang dari awal saat pindah scene. Tanpa file: senyap.
  putarMusik(namaMusik) {
    const nama = MUSIK[namaMusik];
    if (!this.game || this.namaMusik === nama) {
      return;
    }
    this.musik?.destroy();
    this.musik = null;
    this.namaMusik = nama;
    if (this.game.cache.audio.exists(nama)) {
      this.musik = this.game.sound.add(nama, { loop: true, volume: this.volume.musik });
      this.musik.play();
    }
  },

  // jenis: 'musik' atau 'efek'; nilai 0 sampai 1, dibulatkan ke kelipatan 10%.
  aturVolume(jenis, nilai) {
    this.volume[jenis] = Phaser.Math.Clamp(Math.round(nilai / LANGKAH_VOLUME) * LANGKAH_VOLUME, 0, 1);
    if (jenis === 'musik' && this.musik) {
      this.musik.setVolume(this.volume.musik);
    }
  },

  ubahVolume(jenis, arah) {
    this.aturVolume(jenis, this.volume[jenis] + arah * LANGKAH_VOLUME);
  },
};

export default AudioManager;
