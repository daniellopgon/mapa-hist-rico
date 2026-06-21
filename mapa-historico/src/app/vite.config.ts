import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        allowedHosts: true,
        proxy: {
            '/data.json': 'http://localhost:3000',
            '/offline': 'http://localhost:3000',
            '/api': 'http://localhost:3000'
        }
    },
    plugins: [
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            registerType: 'autoUpdate',
            manifest: {
                name: 'Mapa Offline',
                short_name: 'Mapa',
                start_url: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#3b82f6',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
            injectManifest: {
                globPatterns: ['**/!(data.json|*.pmtiles)*.{js,css,html,png,svg,ico,json,webmanifest}'],
            }
        }),
    ],
});
