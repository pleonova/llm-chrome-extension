import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: './index.html',
                background: './src/background.js',
                content: './src/content.js',
                popup: './src/popup.js',
            },
            output: {
                entryFileNames: '[name].js',
            },
        }
    },
});