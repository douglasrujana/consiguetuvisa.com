// @ts-nocheck
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import clerk from '@clerk/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    integrations: [
        svelte(),
        react(),
        clerk({
            afterSignInUrl: '/dashboard',
            afterSignUpUrl: '/dashboard',
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
    },
});