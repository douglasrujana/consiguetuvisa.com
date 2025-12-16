// src/server/lib/features/social/adapters/TwitterAdapter.ts

/**
 * ADAPTER TWITTER/X API
 * Extrae menciones de la marca desde Twitter/X.
 * 
 * Requiere: TWITTER_BEARER_TOKEN en .env
 * API: Twitter API v2 (Basic tier: $100/mes o Free tier limitado)
 */

import type { RawSocialMention } from '../SocialListener.service';

export interface TwitterConfig {
  bearerToken: string;
  searchQuery: string; // ej: "@ConsigueTuVisa OR #ConsigueTuVisa"
  maxResults?: number;
}

export interface TwitterMention {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  author?: {
    username: string;
    name: string;
  };
}

export class TwitterAdapter {
  private bearerToken: string;
  private searchQuery: string;
  private maxResults: number;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(config: TwitterConfig) {
    this.bearerToken = config.bearerToken;
    this.searchQuery = config.searchQuery;
    this.maxResults = config.maxResults || 100;
  }

  /**
   * Busca menciones recientes de la marca
   */
  async fetchMentions(sinceId?: string): Promise<RawSocialMention[]> {
    if (!this.bearerToken) {
      console.warn('[Twitter] No bearer token configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        query: this.searchQuery,
        max_results: String(Math.min(this.maxResults, 100)),
        'tweet.fields': 'created_at,author_id,text',
        expansions: 'author_id',
        'user.fields': 'username,name',
      });

      if (sinceId) {
        params.set('since_id', sinceId);
      }

      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Twitter] API Error:', response.status, error);
        return [];
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return [];
      }

      // Mapear usuarios por ID para lookup rápido
      const usersMap = new Map<string, { username: string; name: string }>();
      if (data.includes?.users) {
        for (const user of data.includes.users) {
          usersMap.set(user.id, { username: user.username, name: user.name });
        }
      }

      // Convertir a formato interno
      return data.data.map((tweet: TwitterMention): RawSocialMention => {
        const author = usersMap.get(tweet.author_id);
        return {
          platform: 'twitter',
          externalId: tweet.id,
          author: author?.username || tweet.author_id,
          content: tweet.text,
          publishedAt: new Date(tweet.created_at),
        };
      });
    } catch (error) {
      console.error('[Twitter] Fetch error:', error);
      return [];
    }
  }

  /**
   * Verifica si las credenciales son válidas
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.bearerToken) {
      return { success: false, error: 'No bearer token configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.text();
      return { success: false, error: `API Error: ${response.status} - ${error}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
