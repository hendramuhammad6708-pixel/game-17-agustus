// Pemain CPU untuk slot yang tidak diisi manusia.
// Antarmukanya sama dengan InputManager (isDown, justPressed, waktuTekan, menuDitekan), jadi mini-game
// cukup bertanya "apakah Pemain 2 menekan Tombol 1?" tanpa tahu Pemain 2 itu manusia atau CPU.
// Strategi tiap mini-game membaca keadaan scene lalu memutuskan tekanan sekali per frame.

// Bot dibuat bisa dikalahkan: reaksi acak dan sesekali salah.
const TINGKAT = {
  mudah: {
    reaksi: [180, 420], // milidetik dari mendarat sampai lompat lagi
    salahLompat: 0.15, // peluang menekan lagi sebelum mendarat
    lewati: 0.45, // peluang membiarkan satu lintasan kerupuk lewat
    meleset: 0.3, // peluang menggigit terlalu cepat
    bidik: [8, 20], // piksel dari mulut saat menggigit (zona sah 22)
    jedaPanjat: [160, 240], // milidetik antar tekanan memanjat
    salahTombol: 0.12, // peluang menekan tombol yang sama dua kali
    lelah: 0.03, // peluang berhenti sejenak (bisa merosot)
    ambangMiring: [8, 15], // derajat kemiringan sendok sebelum dikoreksi
    jedaKoreksi: [130, 220], // milidetik antar koreksi sendok
    salahArah: 0.07, // peluang mengoreksi ke arah yang salah
    jedaTarik: [170, 270], // milidetik antar tarikan tambang
  },
  normal: {
    reaksi: [70, 200],
    salahLompat: 0.07,
    lewati: 0.25,
    meleset: 0.18,
    bidik: [4, 16],
    jedaPanjat: [115, 165],
    salahTombol: 0.06,
    lelah: 0.01,
    ambangMiring: [6, 14],
    jedaKoreksi: [110, 200],
    salahArah: 0.05,
    jedaTarik: [110, 170],
  },
};

const acak = ([min, max]) => min + Math.random() * (max - min);

// Logika CPU per mini-game, dipanggil tiap frame selama permainan berjalan. this = BotController.
const STRATEGI = {
  // Tunggu mendarat, beri jeda reaksi, lalu lompat. Kadang menekan lagi saat masih di udara.
  BalapKarung(bot, sekarang) {
    const pl = this.scene.pelari.find((p) => p.id === bot.id);
    if (!pl || pl.finish) {
      return;
    }
    if (pl.status === 'lompat' && bot.salahPada && sekarang >= bot.salahPada) {
      bot.salahPada = null;
      this.tekan(bot, 1);
    }
    if (pl.status !== 'siap') {
      bot.jadwal = null;
      return;
    }
    bot.jadwal ??= sekarang + acak(this.tingkat.reaksi);
    if (sekarang >= bot.jadwal) {
      bot.jadwal = null;
      this.tekan(bot, 1);
      bot.salahPada = Math.random() < this.tingkat.salahLompat ? sekarang + acak([120, 330]) : null;
    }
  },

  // Gigit saat kerupuk mendekati mulut. Kadang melewatkan satu lintasan atau menggigit terlalu cepat.
  MakanKerupuk(bot, sekarang) {
    const scene = this.scene;
    const pm = scene.pemakan.find((p) => p.id === bot.id);
    if (!pm || pm.status !== 'siap') {
      bot.rencana = null;
      return;
    }
    // Lintasan berikutnya datang sekitar 0,6-0,9 detik setelah gigitan, jadi jeda 0,9-1,3 detik pasti melewatkannya.
    bot.rencana ??= {
      mulai: sekarang + (Math.random() < this.tingkat.lewati ? acak([900, 1300]) : acak([60, 160])),
      meleset: Math.random() < this.tingkat.meleset,
      bidik: acak(this.tingkat.bidik),
    };
    const { mulai, meleset, bidik } = bot.rencana;
    if (sekarang < mulai) {
      return;
    }
    const jarak = Math.abs(scene.jarakMendatar(pm, scene.waktuMain));
    if (meleset ? jarak > 34 && jarak < 60 : jarak < bidik) {
      this.tekan(bot, 1);
    }
  },

  // Tekan bergantian dengan jeda acak. Kadang tombol yang sama dua kali atau berhenti sejenak.
  PanjatPinang(bot, sekarang) {
    const pp = this.scene.pemanjat.find((p) => p.id === bot.id);
    if (!pp || pp.finish) {
      return;
    }
    bot.jadwal ??= sekarang + acak([150, 350]);
    if (sekarang < bot.jadwal) {
      return;
    }
    const salah = pp.tombolTerakhir !== 0 && Math.random() < this.tingkat.salahTombol;
    this.tekan(bot, salah ? pp.tombolTerakhir : pp.tombolTerakhir === 1 ? 2 : 1);
    bot.jadwal = sekarang + acak(this.tingkat.jedaPanjat) + (Math.random() < this.tingkat.lelah ? acak([450, 800]) : 0);
  },

  // Koreksi sendok saat kemiringan melewati ambang acak. Kadang terlambat atau salah arah.
  KelerengSendok(bot, sekarang) {
    const pk = this.scene.pembawa.find((p) => p.id === bot.id);
    if (!pk || pk.status !== 'jalan' || (bot.jadwal && sekarang < bot.jadwal)) {
      return;
    }
    bot.ambang ??= acak(this.tingkat.ambangMiring);
    if (Math.abs(pk.miring) < bot.ambang) {
      return;
    }
    const benar = pk.miring > 0 ? 1 : 2; // miring ke kanan dikoreksi dengan Tombol 1 (ke kiri)
    this.tekan(bot, Math.random() < this.tingkat.salahArah ? 3 - benar : benar);
    bot.jadwal = sekarang + acak(this.tingkat.jedaKoreksi);
    bot.ambang = acak(this.tingkat.ambangMiring);
  },

  // Tarik secepatnya dengan jeda acak; kadang kelelahan dan berhenti sejenak.
  TarikTambang(bot, sekarang) {
    bot.jadwal ??= sekarang + acak([150, 350]);
    if (sekarang < bot.jadwal) {
      return;
    }
    this.tekan(bot, 1);
    bot.jadwal = sekarang + acak(this.tingkat.jedaTarik) + (Math.random() < this.tingkat.lelah ? acak([400, 700]) : 0);
  },
};

export default class BotController {
  // kontrolManusia: InputManager milik scene; botIds: id slot CPU; tingkat: 'mudah' atau 'normal'.
  constructor(scene, kontrolManusia, botIds, tingkat = 'normal') {
    this.scene = scene;
    this.manusia = kontrolManusia;
    this.tingkat = TINGKAT[tingkat] ?? TINGKAT.normal;
    this.strategi = STRATEGI[scene.sys.settings.key];
    this.bot = new Map(botIds.map((id) => [id, { id, tekan: [false, false], waktu: [0, 0] }]));

    // Didaftarkan setelah InputManager, jadi berjalan sesudah tekanan manusia dibaca, sebelum update scene.
    scene.events.on('preupdate', this.putuskan, this);
    scene.events.once('shutdown', () => scene.events.off('preupdate', this.putuskan, this));
  }

  putuskan() {
    for (const bot of this.bot.values()) {
      bot.tekan = [false, false];
    }
    const scene = this.scene;
    if (!this.strategi || !scene.berjalan || scene.dijeda) {
      return;
    }
    const sekarang = scene.time.now;
    for (const bot of this.bot.values()) {
      this.strategi.call(this, bot, sekarang);
    }
  }

  tekan(bot, tombol) {
    bot.tekan[tombol - 1] = true;
    bot.waktu[tombol - 1] = performance.now();
  }

  // CPU hanya "mengetuk": tombol dianggap tertekan pada frame keputusan saja.
  isDown(pemain, tombol) {
    const bot = this.bot.get(pemain);
    return bot ? bot.tekan[tombol - 1] : this.manusia.isDown(pemain, tombol);
  }

  justPressed(pemain, tombol) {
    const bot = this.bot.get(pemain);
    return bot ? bot.tekan[tombol - 1] : this.manusia.justPressed(pemain, tombol);
  }

  waktuTekan(pemain, tombol) {
    const bot = this.bot.get(pemain);
    return bot ? bot.waktu[tombol - 1] : this.manusia.waktuTekan(pemain, tombol);
  }

  menuDitekan(nama) {
    return this.manusia.menuDitekan(nama);
  }
}
