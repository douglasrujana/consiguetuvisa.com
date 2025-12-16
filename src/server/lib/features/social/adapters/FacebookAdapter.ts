// src/server/lib/features/social/adapters/FacebookAdapter.ts

/**
 * ADAPTER FACEBOOK/INSTAGRAM API
 * Extrae menciones y comentarios desde Facebook e Instagram.
 * 
 * Requiere: FACEBOOK_ACCESS_TOKEN en .env
 * API: Meta Graph API (requiere Facebook App y permisos de página)
 */

import type { RawSocialMention } from '../SocialListener.service';

export interface FacebookConfig {
  accessToken: string;
  pageId: string;
  instagramAccountId?: string;
}

export class FacebookAdapter {
  private accessToken: string;
  private pageId: string;
  private instagramAccountId?: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookConfig) {
    this.accessToken = config.accessToken;
    this.pageId = config.pageId;
    this.instagramAccountId = config.instagramAccountId;
  }

  /**
   * Obtiene menciones de la página de Facebook
   */
  async fetchFacebookMentions(since?: Date): Promise<RawSocialMention[]> {
    if (!this.accessToken || !this.pageId) {
      console.warn('[Facebook] No credentials configured');
      return [];
    }

    try {
      // Obtener posts con comentarios de la página
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'id,message,from,created_time,comments{id,message,from,created_time}',
        limit: '50',
      });

      if (since) {
        params.set('since', Math.floor(since.getTime() / 1000).toString());
      }

      const response = await fetch(
        `${this.baseUrl}/${this.pageId}/feed?${params}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Facebook] API Error:', response.status, error);
        return [];
      }

      const data = await response.json();
      const mentions: RawSocialMention[] = [];

      // Procesar posts y comentarios
      for (const post of data.data || []) {
        // Comentarios en posts
        if (post.comments?.data) {
          for (const comment of post.comments.data) {
            mentions.push({
              platform: 'facebook',
              externalId: comment.id,
              author: comment.from?.name || 'Usuario',
              content: comment.message || '',
              publishedAt: new Date(comment.created_time),
            });
          }
        }
      }

      return mentions;
    } catch (error) {
      console.error('[Facebook] Fetch error:', error);
      return [];
    }
  }

  /**
   * Obtiene menciones de Instagram (requiere Instagram Business Account)
   */
  async fetchInstagramMentions(since?: Date): Promise<RawSocialMention[]> {
    if (!this.accessToken || !this.instagramAccountId) {
      console.warn('[Instagram] No credentials configured');
      return [];
    }

    try {
      // Obtener comentarios en posts de Instagram
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'id,caption,comments{id,text,username,timestamp}',
        limit: '50',
      });

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media?${params}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instagram] API Error:', response.status, error);
        return [];
      }

      const data = await response.json();
      const mentions: RawSocialMention[] = [];

      for (const post of data.data || []) {
        if (post.comments?.data) {
          for (const comment of post.comments.data) {
            const publishedAt = new Date(comment.timestamp);
            
            // Filtrar por fecha si se especifica
            if (since && publishedAt < since) continue;

            mentions.push({
              platform: 'instagram',
              externalId: comment.id,
              author: comment.username || 'usuario',
              content: comment.text || '',
              publishedAt,
            });
          }
        }
      }

      return mentions;
    } catch (error) {
      console.error('[Instagram] Fetch error:', error);
      return [];
    }
  }

  /**
   * Obtiene menciones de ambas plataformas
   */
  async fetchAllMentions(since?: Date): Promise<RawSocialMention[]> {
    const [facebook, instagram] = await Promise.all([
      this.fetchFacebookMentions(since),
      this.fetchInstagramMentions(since),
    ]);

    return [...facebook, ...instagram];
  }

  /**
   * Verifica si las credenciales son válidas
   */
  async testConnection(): Promise<{ success: boolean; error?: string; pageName?: string }> {
    if (!this.accessToken) {
      return { success: false, error: 'No access token configured' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.accessToken}&fields=id,name`
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, pageName: data.name };
      }

      const error = await response.text();
      return { success: false, error: `API Error: ${response.status}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
