import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: './src/popup.html', // Use popup.html as the HTML entry
        background: './src/background.js', // Background script
        content: './src/content.js', // Content script
      },
      output: {
        entryFileNames: '[name].js', // Generate output file names as [name].js
      },
    },
  },
});
