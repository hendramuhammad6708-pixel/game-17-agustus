import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOLDER_AUDIO = fileURLToPath(new URL('./public/assets/audio', import.meta.url));
const ID_DAFTAR_AUDIO = 'virtual:daftar-audio';

// Daftar file audio di public/assets/audio, dibaca saat dev dan saat build.
// Game hanya memuat file yang ada, jadi tidak ada permintaan 404 di console browser.
function daftarAudio() {
  const idInternal = `\0${ID_DAFTAR_AUDIO}`;
  return {
    name: 'daftar-audio',
    resolveId: (id) => (id === ID_DAFTAR_AUDIO ? idInternal : null),
    load(id) {
      if (id !== idInternal) return null;
      const file = readdirSync(FOLDER_AUDIO).filter((nama) => /\.(mp3|ogg|wav)$/.test(nama));
      return `export default ${JSON.stringify(file)};`;
    },
    // Saat dev, menambah atau menghapus file audio langsung memuat ulang daftar dan halaman.
    configureServer(server) {
      const segarkan = (file) => {
        if (!resolve(file).startsWith(FOLDER_AUDIO)) return;
        const modul = server.moduleGraph.getModuleById(idInternal);
        if (modul) server.moduleGraph.invalidateModule(modul);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', segarkan);
      server.watcher.on('unlink', segarkan);
    },
  };
}

export default defineConfig({
  // Path relatif supaya hasil build bisa dihosting di subfolder (itch.io) atau dibuka dari folder dist.
  base: './',
  plugins: [daftarAudio()],
  server: {
    open: true,
  },
  build: {
    // Phaser sendiri sekitar 1,2 MB (± 320 KB setelah gzip); batas bawaan 500 KB hanya memunculkan peringatan.
    chunkSizeWarningLimit: 1500,
  },
});
