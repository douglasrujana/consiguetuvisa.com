// scripts/upload-payment-logo.ts
// Sube una imagen de logo de pago a Sanity

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

const client = createClient({
  projectId: 'zvbggttz',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function uploadPaymentLogo(imagePath: string, logoName: string) {
  console.log(`📤 Subiendo ${logoName}...`);
  
  // Leer el archivo
  const imageBuffer = fs.readFileSync(imagePath);
  const fileName = path.basename(imagePath);
  
  // Subir a Sanity
  const asset = await client.assets.upload('image', imageBuffer, {
    filename: fileName,
  });
  
  console.log(`✅ Imagen subida: ${asset._id}`);
  console.log(`   URL: ${asset.url}`);
  
  // Obtener siteSettings actual
  const settings = await client.fetch(`*[_type == "siteSettings"][0]`);
  
  if (!settings) {
    console.log('⚠️ No se encontró siteSettings, creando...');
    await client.create({
      _type: 'siteSettings',
      siteName: 'ConsigueTuVisa',
      paymentLogos: [
        {
          _key: logoName.toLowerCase().replace(/\s/g, '-'),
          name: logoName,
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
        },
      ],
    });
  } else {
    // Agregar al array existente
    const existingLogos = settings.paymentLogos || [];
    await client
      .patch(settings._id)
      .set({
        paymentLogos: [
          ...existingLogos,
          {
            _key: logoName.toLowerCase().replace(/\s/g, '-') + '-' + Date.now(),
            name: logoName,
            image: {
              _type: 'image',
              asset: { _type: 'reference', _ref: asset._id },
            },
          },
        ],
      })
      .commit();
    
    console.log(`✅ Logo agregado a siteSettings`);
  }
  
  return asset.url;
}

// Ejecutar
const imagePath = process.argv[2] || 'public/images/payments/classic_mastercard-produbanco.png';
const logoName = process.argv[3] || 'Mastercard Produbanco';

uploadPaymentLogo(imagePath, logoName)
  .then((url) => {
    console.log('\n🎉 Completado!');
    console.log(`URL de la imagen: ${url}`);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
