import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'هوم ستور - HOME STORE',
                short_name: 'هوم ستور',
                description: 'هوم ستور - كل ما تحتاجه تحت سقف واحد',
                theme_color: '#C5A059',
                background_color: '#0A0A0A',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'any',
                categories: ['shopping', 'business'],
                screenshots: [
                    {
                        src: 'screenshot.png',
                        sizes: '1280x720',
                        type: 'image/png'
                    }
                ],
                icons: [
                    {
                        src: 'hs-logo.png',
                        sizes: 'any',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'hs-logo.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'hs-logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                maximumFileSizeToCacheInBytes: 3000000
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: true
    }
})
