// @ts-nocheck
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import clerk from '@clerk/astro';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://consiguetuvisa.com',
    output: 'server',
    adapter: vercel(),
    prefetch: {
        prefetchAll: false,
        defaultStrategy: 'viewport',
    },
    integrations: [
        svelte(),
        react(),
        clerk({
            afterSignInUrl: '/dashboard',
            afterSignUpUrl: '/dashboard',
        }),
        sitemap({
            filter: (page) => 
                !page.includes('/api/') && 
                !page.includes('/admin/') && 
                !page.includes('/studio/') &&
                !page.includes('/preview/'),
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: new Date(),
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
        optimizeDeps: {
            include: ['lucide-svelte'],
        },
        ssr: {
            noExternal: ['lucide-svelte'],
        },
        build: {
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        // Isolate Sanity Studio and its dependencies into a dedicated chunk
                        if (id.includes('node_modules/sanity') || id.includes('node_modules/@sanity') || id.includes('node_modules/styled-components')) {
                            return 'sanity-studio';
                        }
                        // Isolate Clerk authentication
                        if (id.includes('node_modules/@clerk')) {
                            return 'clerk-vendor';
                        }
                        // Isolate Lucide icons
                        if (id.includes('node_modules/lucide-svelte') || id.includes('node_modules/lucide-react')) {
                            return 'icons-vendor';
                        }
                    },
                },
            },
        },
    },
});