// src/lib/sanity/trustLogos.service.ts
/**
 * TRUST LOGOS SERVICE - Carga logos de métodos de pago desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface TrustLogo {
  name: string;
  imageUrl: string;
}

const LOGOS_QUERY = `*[_type == "siteSettings"][0].paymentLogos[]{
  name,
  "imageUrl": image.asset->url
}`;

// Fallback con logos locales
const FALLBACK_LOGOS: TrustLogo[] = [
  { name: 'Visa', imageUrl: '/images/payments/visa.svg' },
  { name: 'Mastercard', imageUrl: '/images/payments/mastercard.svg' },
  { name: 'American Express', imageUrl: '/images/payments/amex.svg' },
  { name: 'PayPal', imageUrl: '/images/payments/paypal.svg' },
  { name: 'Diners Club', imageUrl: '/images/payments/diners.svg' },
];

/**
 * Obtiene logos de métodos de pago desde Sanity
 */
export async function getTrustLogos(): Promise<TrustLogo[]> {
  try {
    const data = await sanityFetch<TrustLogo[] | null>(LOGOS_QUERY);
    
    if (data && data.length > 0) {
      console.log('[Sanity] TrustLogos cargados desde CMS');
      return data;
    }
    
    return FALLBACK_LOGOS;
  } catch (error) {
    console.log('[Sanity] TrustLogos usando fallback');
    return FALLBACK_LOGOS;
  }
}
