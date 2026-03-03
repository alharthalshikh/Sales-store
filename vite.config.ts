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
                name: 'أرض الجنتين - المتجر السحابي',
                short_name: 'أرض الجنتين',
                description: 'متجر أرض الجنتين للأدوات والتجهيزات',
                theme_color: '#C8860A',
                background_color: '#0D0A06',
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
                        src: 'icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any'
                    },
                    {
                        src: 'icon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'maskable'
                    },
                    {
                        src: 'icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
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
