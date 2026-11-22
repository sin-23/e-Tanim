import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    // jsPDF can load these three for features e-Tanim does not use (HTML, SVG and sanitizing).
    // Leaving them out of the single file saves about 400 kB.
    rollupOptions: { external: ['canvg', 'html2canvas', 'dompurify'] },
  }
})