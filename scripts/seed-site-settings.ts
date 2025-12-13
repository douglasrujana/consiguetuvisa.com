// scripts/seed-site-settings.ts
// Crea la configuración del sitio en Sanity

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { nanoid } from 'nanoid';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const SITE_SETTINGS = {
  _type: 'siteSettings',
  _id: 'siteSettings', // Singleton
  siteName: 'ConsigueTuVisa',
  tagline: 'Asesoría profesional para visas de turismo',
  description: 'Asesoría profesional para visas de turismo. Tu trámite en manos de expertos.',
  location: 'Quito, Ecuador',
  phone: '+593 99 999 9999',
  email: 'info@consiguetuvisa.com',
  whatsapp: '593999999999',
  footerServices: [
    { _key: nanoid(), label: 'Visa EE.UU', href: '/servicios/visa-usa' },
    { _key: nanoid(), label: 'Visa Canadá', href: '/servicios/visa-canada' },
    { _key: nanoid(), label: 'Visa Schengen', href: '/servicios/visa-schengen' },
    { _key: nanoid(), label: 'Visa UK', href: '/servicios/visa-uk' },
    { _key: nanoid(), label: 'Visa México', href: '/servicios/visa-mexico' },
  ],
  footerCompany: [
    { _key: nanoid(), label: 'Sobre Nosotros', href: '/nosotros' },
    { _key: nanoid(), label: 'Testimonios', href: '/#testimonios' },
    { _key: nanoid(), label: 'Preguntas Frecuentes', href: '/#faq' },
    { _key: nanoid(), label: 'Contacto', href: '/#contacto' },
  ],
  footerLegal: [
    { _key: nanoid(), label: 'Términos y Condiciones', href: '/terminos' },
    { _key: nanoid(), label: 'Política de Privacidad', href: '/privacidad' },
    { _key: nanoid(), label: 'Aviso Legal', href: '/aviso-legal' },
  ],
};

async function seed() {
  console.log('🌱 Creando configuración del sitio en Sanity...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN no configurado');
    process.exit(1);
  }

  try {
    // Crear o actualizar (singleton)
    await client.createOrReplace(SITE_SETTINGS);
    
    console.log('✅ Configuración del sitio creada!');
    console.log('\n📝 Edita en /studio → Configuración del Sitio');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
