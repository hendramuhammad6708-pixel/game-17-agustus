import { defineConfig } from 'vite';

export default defineConfig({
  // Path relatif supaya hasil build bisa dihosting di subfolder (itch.io) atau dibuka dari folder dist.
  base: './',
  server: {
    open: true,
  },
});
