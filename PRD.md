# PRD Game Pesta 17-an

Oct 20, 2026 · @Someone

## Ringkasan produk

Pesta 17-an adalah party game 2D untuk 2 sampai 4 pemain di satu laptop. Isinya kumpulan mini-game lomba Agustusan: balap karung, makan kerupuk, panjat pinang, kelereng sendok, dan tarik tambang. Satu sesi turnamen berlangsung 8 sampai 10 menit, dan game berjalan langsung di browser tanpa kartu grafik khusus.

**Tujuan utama:** memenangkan lomba game development kampus dengan game yang bisa langsung dimainkan siapa saja, termasuk juri, lewat satu link.

**Pilar desain:**

- **Paham dalam 5 detik:** setiap mini-game hanya memakai 1 atau 2 tombol per pemain.
- **Lucu dan chaos:** pemain jatuh, terpeleset, dan saling salip; momen gagal sama serunya dengan menang.
- **Ringan:** grafis 2D sederhana, target 60 FPS di laptop dengan GPU integrated.
- **Nuansa Indonesia:** warna merah putih, umbul-umbul, suasana kampung saat Agustusan.

## Target pemain dan platform

Game ini untuk semua umur (7 tahun ke atas): anak-anak, keluarga, mahasiswa, dan juri yang jarang main game. Tidak perlu pengalaman bermain game sebelumnya.

| Aspek | Target |
| --- | --- |
| Platform | Browser desktop (Chrome, Edge, Firefox) |
| Perangkat minimum | Laptop dengan GPU integrated (Intel UHD/Iris, AMD Radeon Vega), RAM 4 GB |
| Resolusi | 1280 × 720, otomatis menyesuaikan layar (scale to fit) |
| Performa | 60 FPS, waktu loading di bawah 5 detik |
| Jumlah pemain | 2 sampai 4 di satu keyboard; slot kosong diisi bot (CPU) |
| Distribusi | Link web (Vercel atau itch.io), bisa juga dibuka offline dari folder build |

Versi HP (layar sentuh) tidak termasuk dalam MVP dan bisa jadi pengembangan setelah lomba.

## Alur permainan

Satu turnamen mengulang siklus instruksi, mini-game, dan hasil ronde sampai semua mini-game selesai, lalu ditutup dengan podium.

&#91;embedded content: alur permainan · 7 langkah, 1 pengulangan\]

1. **Menu utama:** pilih Turnamen (semua mini-game dalam urutan acak) atau Main Bebas (pilih satu mini-game), plus tombol Kredit.
2. **Pilih pemain:** tiap pemain menekan Tombol 1 miliknya untuk bergabung; slot yang kosong diisi bot.
3. **Layar instruksi (3 detik):** nama mini-game, satu kalimat cara main, dan tombol milik setiap pemain.
4. **Mini-game:** hitung mundur 3-2-1, lalu bermain maksimal 60 detik.
5. **Hasil ronde:** urutan finish dan poin, disusul papan skor kumulatif.
6. **Podium:** 3 besar dengan konfeti; tekan Enter untuk main lagi.

## Daftar mini-game

MVP berisi 3 mini-game yang dipoles sampai rapi; 2 lainnya ditambah hanya kalau waktu masih ada. Setiap mini-game berdurasi maksimal 60 detik; kalau waktu habis, pemenang ditentukan dari posisi atau progres terjauh.

| Mini-game | Cara main | Tombol | Menang jika | Prioritas |
| --- | --- | --- | --- | --- |
| Balap Karung | Tekan Tombol 1 berirama untuk melompat maju. Terlalu cepat menekan membuat karakter jatuh dan diam 1 detik. | T1 | Pertama menyentuh garis finish | MVP |
| Makan Kerupuk | Kerupuk berayun di depan mulut. Tekan Tombol 1 saat kerupuk tepat di depan mulut untuk menggigit; gigitan meleset tidak dihitung. | T1 | Pertama menghabiskan kerupuk | MVP |
| Panjat Pinang | Tekan Tombol 1 dan Tombol 2 bergantian untuk memanjat. Berhenti menekan atau menekan tombol yang sama dua kali membuat karakter merosot karena batang licin. | T1, T2 | Pertama meraih hadiah di puncak | MVP |
| Kelereng Sendok | Karakter berjalan otomatis, sendok terus miring ke arah acak. Tombol 1 dan 2 mengoreksi kemiringan; kelereng jatuh berarti mundur ke checkpoint. | T1, T2 | Pertama sampai finish dengan kelereng | Tambahan |
| Tarik Tambang | Dua tim kiri dan kanan. Tekan Tombol 1 secepat mungkin; tali bergeser ke tim yang menekan lebih banyak. Untuk 3 pemain: 2 lawan 1, pemain sendirian mendapat tarikan dua kali lipat. | T1 | Tali melewati garis tengah tim lawan | Tambahan |

**Sistem poin per mini-game:** juara 1 mendapat 3 poin, juara 2 mendapat 2 poin, juara 3 mendapat 1 poin, juara 4 mendapat 0 poin. Pada Tarik Tambang, setiap anggota tim pemenang mendapat 3 poin.

## Skema kontrol

Setiap pemain hanya punya 2 tombol, ditempatkan berjauhan supaya 4 orang bisa berbagi satu keyboard tanpa saling desak.

| Pemain | Warna | Tombol 1 | Tombol 2 |
| --- | --- | --- | --- |
| Pemain 1 | Merah | Q | W |
| Pemain 2 | Biru | V | B |
| Pemain 3 | Hijau | O | P |
| Pemain 4 | Kuning | Panah kiri | Panah kanan |

- **Navigasi menu:** Enter untuk memilih, Esc untuk jeda.
- **Ghosting keyboard:** banyak keyboard laptop tidak bisa membaca lebih dari 3 sampai 4 tombol yang ditekan bersamaan. Uji kombinasi tombol di atas sejak awal, dan siapkan keyboard eksternal untuk demo.
- **Gamepad (opsional):** dukung stik lewat Gamepad API bawaan Phaser; tombol A sebagai Tombol 1, tombol B sebagai Tombol 2.
- **Layar instruksi:** sebelum tiap mini-game, tampilkan tombol milik setiap pemain selama 3 detik.

## Visual, audio, dan aset

Gaya visualnya kartun 2D datar: karakter bulat berkepala besar dengan warna berbeda per pemain, latar kampung dengan umbul-umbul, bendera merah putih, dan penonton sederhana.

**Efek "juice" yang wajib ada** (pembeda terbesar saat dinilai juri):

- Layar bergetar sedikit saat pemain jatuh atau tali tambang ditarik kuat.
- Partikel debu saat mendarat, remah kerupuk saat menggigit, konfeti saat juara.
- Teks pop-up singkat seperti "MANTAP!", "JATUH!", dan "LICIN!".
- Animasi squash and stretch saat karakter melompat.
- Podium akhir dengan sorakan penonton.

**Audio:** musik latar ceria bernuansa perayaan, efek suara lompat, kriuk kerupuk, merosot, peluit mulai, dan sorakan. Pakai musik berlisensi bebas; jangan memakai lagu kemerdekaan atau lagu populer yang masih dilindungi hak cipta.

**Sumber aset gratis:**

- [Kenney.nl](https://kenney.nl): sprite, UI, dan efek suara berlisensi CC0.
- [OpenGameArt](https://opengameart.org) dan [Freesound](https://freesound.org): cek lisensi tiap file.
- [jsfxr](https://sfxr.me): membuat efek suara retro sendiri.
- Piskel, Aseprite, atau Canva: menggambar karakter dan latar sendiri.

Catat semua aset pihak ketiga di layar Kredit.

## Spesifikasi teknis

Stack: **Phaser 3 + JavaScript + Vite**, dideploy sebagai situs statis. Tidak ada backend dan tidak ada database; semua state disimpan di memori selama sesi berjalan.

| Komponen | Keputusan |
| --- | --- |
| Engine | Phaser 3, renderer otomatis (WebGL, fallback Canvas) |
| Bahasa | JavaScript (ES modules) |
| Build tool | Vite |
| Fisika | Arcade Physics bawaan Phaser, atau gerakan manual tanpa fisika |
| Deploy | Vercel atau itch.io (HTML5) |
| Batas ukuran | Total aset di bawah 15 MB |

**Arsitektur:** setiap layar dan setiap mini-game adalah satu Scene Phaser. Data pemain dan skor disimpan di satu modul `GameState`. Pemetaan tombol dipusatkan di `InputManager` supaya mini-game cukup bertanya "apakah Pemain 2 menekan Tombol 1?".

Setiap mini-game mengikuti kontrak yang sama: menerima daftar pemain aktif, berjalan maksimal 60 detik, lalu mengirim urutan finish ke scene Hasil Ronde.

```text
pesta-17an/
  index.html
  vite.config.js
  PRD.md
  public/assets/
    sprites/  audio/  fonts/
  src/
    main.js              konfigurasi Phaser dan daftar scene
    config.js            konstanta: resolusi, durasi, poin
    state/GameState.js   pemain, warna, skor, urutan mini-game
    input/InputManager.js  pemetaan tombol keyboard dan gamepad
    scenes/
      Boot.js  Preload.js  Menu.js  PlayerSelect.js
      Instructions.js  RoundResult.js  Scoreboard.js  Podium.js  Credits.js
    minigames/
      BaseMiniGame.js    kontrak bersama: timer, hitung mundur, kirim hasil
      BalapKarung.js  MakanKerupuk.js  PanjatPinang.js
      KelerengSendok.js  TarikTambang.js
    bots/BotController.js  logika pemain CPU per mini-game
    fx/Juice.js          screen shake, partikel, teks pop-up
```

## Tahapan pengerjaan

Total sekitar 10 sampai 14 hari kerja. Game harus sudah bisa dimainkan dari awal sampai podium di akhir Fase 2; fase sesudahnya hanya memoles dan menambah.

### Fase 0: Persiapan (hari 1)

- [ ] Buat folder proyek, export PRD ini sebagai `PRD.md` dan taruh di root proyek
- [ ] Setup Vite + Phaser 3, layar hitam 1280 × 720 tampil di browser
- [ ] Inisialisasi Git dan push ke GitHub

### Fase 1: Kerangka game (hari 2 sampai 3)

- [ ] Scene Menu, Pilih Pemain (2 sampai 4, warna), Instruksi, Hasil Ronde, Papan Skor, Podium
- [ ] `GameState` dan `InputManager` sesuai skema kontrol
- [ ] `BaseMiniGame` dengan hitung mundur 3-2-1, timer 60 detik, dan pengiriman hasil
- [ ] Satu mini-game dummy untuk menguji alur dari menu sampai podium

### Fase 2: Tiga mini-game MVP (hari 4 sampai 7)

- [ ] Balap Karung
- [ ] Makan Kerupuk
- [ ] Panjat Pinang
- [ ] Mode Turnamen menjalankan ketiganya berurutan lalu podium

### Fase 3: Polish dan bot (hari 8 sampai 10)

- [ ] Sprite dan latar final menggantikan kotak-kotak sementara
- [ ] Efek juice: screen shake, partikel, teks pop-up, konfeti
- [ ] Musik dan efek suara
- [ ] Bot CPU untuk slot pemain kosong
- [ ] Layar Kredit

### Fase 4: Mini-game tambahan (hari 11 sampai 12, opsional)

- [ ] Kelereng Sendok
- [ ] Tarik Tambang
- [ ] Mode Main Bebas (pilih satu mini-game)

### Fase 5: Uji dan rilis (hari 13 sampai 14)

- [ ] Uji main dengan 4 orang sungguhan, catat bagian yang membingungkan
- [ ] Uji di laptop GPU integrated, pastikan 60 FPS
- [ ] Deploy ke Vercel atau itch.io
- [ ] Rekam video gameplay 60 detik

## Prompt siap pakai untuk Antigravity

Kirim satu prompt per fase, lalu jalankan dan mainkan hasilnya sebelum lanjut. Kalau ada bug, jelaskan apa yang terjadi dan apa yang seharusnya terjadi, jangan langsung minta "perbaiki semuanya".

**Prompt 0: Persiapan**

```text
Baca PRD.md di root proyek ini. Kita membuat game "Pesta 17-an" dengan Phaser 3 + JavaScript + Vite.
Setup proyek sesuai struktur folder di bagian Spesifikasi Teknis PRD.
Target: npm run dev menampilkan kanvas 1280x720 yang otomatis menyesuaikan layar.
Jangan buat mini-game dulu. Setelah selesai, jelaskan cara menjalankannya.
```

**Prompt 1: Kerangka game**

```text
Ikuti PRD.md bagian Alur Permainan dan Skema Kontrol.
Buat GameState, InputManager, dan semua scene alur: Menu, Pilih Pemain (2-4, warna merah/biru/hijau/kuning),
Instruksi, Hasil Ronde, Papan Skor, Podium. Buat BaseMiniGame dengan hitung mundur 3-2-1,
timer 60 detik, dan fungsi selesai(urutanFinish).
Buat satu mini-game dummy (tekan Tombol 1 sepuluh kali untuk menang) untuk menguji alur menu sampai podium.
Pakai bentuk geometri dan teks sementara, tanpa aset gambar.
```

**Prompt 2: Mini-game MVP (kirim satu per satu)**

```text
Buat mini-game Balap Karung sesuai baris Balap Karung di tabel Daftar Mini-game PRD.md.
Turunkan dari BaseMiniGame dan pakai InputManager. Masih pakai bentuk sementara.
Pastikan bisa dimainkan 2, 3, dan 4 pemain. Tambahkan ke mode Turnamen.
```

Ulangi dengan mengganti nama mini-game menjadi Makan Kerupuk, lalu Panjat Pinang.

**Prompt 3: Polish**

```text
Tambahkan efek juice sesuai PRD.md bagian Visual, Audio, dan Aset di file fx/Juice.js:
screen shake, partikel debu dan remah, teks pop-up, squash and stretch saat lompat, konfeti di podium.
Jaga performa 60 FPS di laptop GPU integrated: batasi jumlah partikel, tanpa shader atau post-processing.
```

**Prompt 4: Bot CPU**

```text
Buat BotController untuk mengisi slot pemain kosong. Bot harus bisa dikalahkan:
kecepatan menekan acak dan sesekali melakukan kesalahan. Sediakan tingkat Mudah dan Normal di menu.
```

## Definisi selesai dan checklist demo lomba

Game dianggap siap lomba kalau satu turnamen penuh bisa dimainkan 4 orang dari menu sampai podium tanpa bug, di laptop biasa, lewat satu link.

**Kualitas game**

- [ ] Minimal 3 mini-game MVP selesai dan seimbang (tidak ada pemain yang selalu menang karena posisi tombol)
- [ ] 60 FPS di laptop GPU integrated
- [ ] Semua teks berbahasa Indonesia dan instruksi bisa dipahami tanpa penjelasan lisan
- [ ] Efek juice, musik, dan efek suara aktif di semua mini-game
- [ ] Layar Kredit mencantumkan semua aset pihak ketiga

**Persiapan demo**

- [ ] Link online berfungsi dan sudah dicoba dari perangkat lain
- [ ] Build offline di flashdisk sebagai cadangan kalau internet bermasalah
- [ ] Keyboard eksternal dan, jika ada, 2 gamepad
- [ ] Video gameplay 60 detik untuk dibuka di awal presentasi
- [ ] Pitching 3 menit: masalah (game lokal yang bisa dimainkan bersama masih jarang), solusi, demo langsung, rencana pengembangan (versi HP, mode online)
- [ ] Ajak juri ikut bermain melawan anggota tim saat demo
