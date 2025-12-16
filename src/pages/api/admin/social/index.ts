// src/pages/api/admin/social/index.ts
// API REST para Social Listening Dashboard

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';
import { SocialMentionRepository } from '@features/social';

export const GET: APIRoute = async ({ url }) => {
  try {
    const repo = new SocialMentionRepository(prisma);
    
    // Parámetros de filtro
    const platform = url.searchParams.get('platform') || undefined;
    const sentiment = url.searchParams.get('sentiment') || undefined;
    const reviewed = url.searchParams.get('reviewed');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const days = parseInt(url.searchParams.get('days') || '7');

    // Fecha de inicio para stats
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Obtener menciones con filtros
    const filters: any = {};
    if (platform) filters.platform = platform;
    if (sentiment) filters.sentiment = sentiment;
    if (reviewed !== null) filters.reviewed = reviewed === 'true';

    const [mentions, pending, sentimentCounts, allMentions] = await Promise.all([
      repo.findMany(Object.keys(filters).length > 0 ? filters : undefined, limit),
      repo.findPendingReview(1000),
      repo.countBySentiment(fromDate),
      repo.findMany(undefined, 1000),
    ]);

    // Contar por plataforma
    const byPlatform = { twitter: 0, facebook: 0, instagram: 0 };
    for (const m of allMentions) {
      if (m.platform in byPlatform) {
        byPlatform[m.platform as keyof typeof byPlatform]++;
      }
    }

    // Tendencia de sentimiento (últimos N días)
    const trend = await getTrendData(days);

    // Stats
    const stats = {
      total: allMentions.length,
      pendingReview: pending.length,
      reviewed: allMentions.length - pending.length,
      bySentiment: {
        POSITIVE: sentimentCounts.POSITIVE ?? 0,
        NEUTRAL: sentimentCounts.NEUTRAL ?? 0,
        NEGATIVE: sentimentCounts.NEGATIVE ?? 0,
        COMPLAINT: sentimentCounts.COMPLAINT ?? 0,
      },
      byPlatform,
    };

    return new Response(
      JSON.stringify({
        mentions: mentions.map(mapMention),
        stats,
        trend,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Social API Error]', error);
    return new Response(
      JSON.stringify({ error: 'Error fetching social data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function getTrendData(days: number) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const mentions = await prisma.socialMention.findMany({
    where: { publishedAt: { gte: fromDate } },
    select: { publishedAt: true, sentiment: true },
  });

  // Inicializar días
  const byDay: Record<string, { date: string; positive: number; neutral: number; negative: number; complaint: number }> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    byDay[key] = { date: key, positive: 0, neutral: 0, negative: 0, complaint: 0 };
  }

  // Contar
  for (const m of mentions) {
    const key = m.publishedAt.toISOString().split('T')[0];
    if (byDay[key]) {
      const sentiment = m.sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative' | 'complaint';
      if (sentiment in byDay[key]) {
        byDay[key][sentiment]++;
      }
    }
  }

  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
}

function mapMention(m: any) {
  return {
    id: m.id,
    sourceId: m.sourceId,
    platform: m.platform,
    externalId: m.externalId,
    author: m.author,
    content: m.content,
    sentiment: m.sentiment,
    suggestedResponse: m.suggestedResponse,
    reviewedAt: m.reviewedAt?.toISOString() ?? null,
    reviewedBy: m.reviewedBy,
    publishedAt: m.publishedAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}
