import {defineConfig} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import path from 'path';
import * as glob from 'glob';

// Get all HTML files from the "src" folder
const htmlFiles = glob.sync('src/**/*.html');

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: Object.fromEntries(
                htmlFiles.map(file => [
                    path.basename(file, '.html'),
                    path.resolve(__dirname, file),
                ]),
            ),
        },
        sourcemap: true,
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern',
            },
        },
    },
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true, // fix for error "Buffer is not defined" from Influence SDK dependencies
            }
        }),
        viteStaticCopy({
            targets: [
                {
                    src: 'assets/**/*', // copy all files from "src/assets"
                    dest: 'assets', // output to "dist/assets"
                },
                {
                    src: 'data/**/*', // copy all files from "src/data"
                    dest: 'data', // output to "dist/data"
                },
            ],
        }),
    ],
});
