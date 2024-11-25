import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: './index.html',
                background: './src/background.js',
                content: './src/content.js',
            },
            output: {
                format: "esm",
                entryFileNames: "[name].js",
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
});