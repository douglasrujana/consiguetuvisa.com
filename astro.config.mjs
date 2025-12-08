// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import svelte from '@astrojs/svelte';
import clerk from '@clerk/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    integrations: [
        svelte(),
        clerk({
            afterSignInUrl: '/dashboard',
            afterSignUpUrl: '/dashboard',
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});