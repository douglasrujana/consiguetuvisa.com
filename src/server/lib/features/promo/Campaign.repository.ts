// src/server/lib/features/promo/Campaign.repository.ts

/**
 * REPOSITORIO DE CAMPAÑAS (Sanity)
 * Implementa ICampaignRepository usando Sanity como fuente de datos.
 */

import { getSanityClient } from '@adapters/cms/sanity.client';
import type { ICampaignRepository } from './Promo.port';
import type { 
  Campaign, 
  CampaignSummary, 
  Prize, 
  CardBrand 
} from './Promo.entity';
import type { ListCampaignsDTO } from './Promo.dto';

export class CampaignRepository implements ICampaignRepository {
  private client = getSanityClient();

  async findBySlug(slug: string): Promise<Campaign | null> {
    const query = `*[_type == "campaign" && slug.current == $slug][0]{
      "id": _id,
      name,
      "slug": slug.current,
      description,
      country,
      startDate,
      endDate,
      maxParticipationsPerEmail,
      "prizes": prizes[]->{
        "id": _id,
        name,
        description,
        type,
        value,
        image,
        color,
        probability,
        inventory,
        expirationDays
      },
      "cardBrands": cardBrands[]->{
        "id": _id,
        name,
        "slug": slug.current,
        logo,
        variants,
        countries,
        spinsPerCard,
        order
      } | order(order asc),
      agencyInfo,
      termsAndConditions,
      privacyPolicy,
      theme,
      isActive
    }`;

    const result = await this.client.fetch(query, { slug });
    
    if (!result) return null;

    return this.mapToCampaign(result);
  }

  async findAll(options: ListCampaignsDTO): Promise<CampaignSummary[]> {
    const { country, activeOnly, limit, offset } = options;
    
    let filter = '*[_type == "campaign"';
    if (country) filter += ` && country == "${country}"`;
    if (activeOnly) filter += ' && isActive == true';
    filter += ']';

    const query = `${filter} | order(startDate desc) [${offset}...${offset + limit}]{
      "id": _id,
      name,
      "slug": slug.current,
      country,
      startDate,
      endDate,
      isActive
    }`;

    const results = await this.client.fetch(query);
    return results.map(this.mapToCampaignSummary);
  }

  async exists(slug: string): Promise<boolean> {
    const query = `count(*[_type == "campaign" && slug.current == $slug]) > 0`;
    return this.client.fetch(query, { slug });
  }

  async getCardBrandsByCountry(country: string): Promise<CardBrand[]> {
    const query = `*[_type == "cardBrand" && $country in countries] | order(order asc){
      "id": _id,
      name,
      "slug": slug.current,
      logo,
      variants,
      countries,
      spinsPerCard,
      order
    }`;

    const results = await this.client.fetch(query, { country });
    return results.map(this.mapToCardBrand);
  }

  async getPrizesByCampaign(campaignId: string): Promise<Prize[]> {
    const query = `*[_type == "campaign" && _id == $campaignId][0].prizes[]->{
      "id": _id,
      name,
      description,
      type,
      value,
      image,
      color,
      probability,
      inventory,
      expirationDays
    }`;

    const results = await this.client.fetch(query, { campaignId });
    return results?.map(this.mapToPrize) ?? [];
  }

  async decrementPrizeInventory(prizeId: string): Promise<boolean> {
    // Sanity mutations require write token
    // For now, we'll track inventory in Prisma instead
    // This is a design decision: Sanity = config, Prisma = state
    console.warn('Prize inventory should be tracked in Prisma, not Sanity');
    return true;
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapToCampaign(data: any): Campaign {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      country: data.country,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      maxParticipationsPerEmail: data.maxParticipationsPerEmail,
      prizes: data.prizes?.map(this.mapToPrize) ?? [],
      cardBrands: data.cardBrands?.map(this.mapToCardBrand) ?? [],
      agencyInfo: data.agencyInfo ?? {},
      termsAndConditions: data.termsAndConditions,
      privacyPolicy: data.privacyPolicy,
      theme: data.theme,
      isActive: data.isActive,
    };
  }

  private mapToCampaignSummary(data: any): CampaignSummary {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      country: data.country,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
    };
  }

  private mapToPrize(data: any): Prize {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      image: data.image,
      color: data.color,
      probability: data.probability,
      inventory: data.inventory ?? -1,
      expirationDays: data.expirationDays ?? 30,
    };
  }

  private mapToCardBrand(data: any): CardBrand {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      variants: data.variants ?? [],
      countries: data.countries ?? [],
      spinsPerCard: data.spinsPerCard ?? 1,
      order: data.order ?? 0,
    };
  }
}
