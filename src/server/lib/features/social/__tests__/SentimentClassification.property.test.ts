// src/server/lib/features/social/__tests__/SentimentClassification.property.test.ts

/**
 * **Feature: rag-knowledge-system, Property 11: Complaint Detection Creates Alert**
 * For any social mention classified as COMPLAINT, the system should
 * create an alert with HIGH or CRITICAL priority.
 * **Validates: Requirements 11.3, 12.1**
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { SocialListenerService, type RawSocialMention, type SocialListenerConfig } from '../SocialListener.service';
import { SentimentClassifier } from '../SentimentClassifier';
import { SentimentType, type SocialMention, type CreateSocialMentionInput, type SocialPlatform } from '../SocialMention.entity';
import type { ISocialMentionRepository } from '../SocialMention.port';
import type { AIService } from '@core/ai';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

/**
 * Mock AIService that returns deterministic sentiment based on content
 */
class MockAIService {
  async prompt(userPrompt: string, _systemPrompt?: string): Promise<string> {
    // Extract the content from the prompt
    const contentMatch = userPrompt.match(/"([^"]+)"/);
    const content = contentMatch ? contentMatch[1].toLowerCase() : '';
    
    // Deterministic classification based on keywords
    // Keywords that indicate a COMPLAINT: estafa, denuncia, devuelvan, robaron
    if (content.includes('estafa') || content.includes('denuncia') || content.includes('devuelvan') || content.includes('robaron')) {
      return JSON.stringify({
        sentiment: 'COMPLAINT',
        confidence: 0.95,
        reasoning: 'Contains complaint keywords',
      });
    }
    if (content.includes('malo') || content.includes('terrible') || content.includes('pésimo')) {
      return JSON.stringify({
        sentiment: 'NEGATIVE',
        confidence: 0.85,
        reasoning: 'Contains negative keywords',
      });
    }
    if (content.includes('excelente') || content.includes('gracias') || content.includes('recomiendo')) {
      return JSON.stringify({
        sentiment: 'POSITIVE',
        confidence: 0.9,
        reasoning: 'Contains positive keywords',
      });
    }
    return JSON.stringify({
      sentiment: 'NEUTRAL',
      confidence: 0.7,
      reasoning: 'No strong sentiment detected',
    });
  }
}

/**
 * Mock repository that stores mentions in memory
 */
class MockSocialMentionRepository implements ISocialMentionRepository {
  private mentions: Map<string, SocialMention> = new Map();
  private idCounter = 0;

  async create(input: CreateSocialMentionInput): Promise<SocialMention> {
    const id = `mention-${++this.idCounter}`;
    const mention: SocialMention = {
      id,
      ...input,
      createdAt: new Date(),
    };
    this.mentions.set(id, mention);
    return mention;
  }

  async findById(id: string): Promise<SocialMention | null> {
    return this.mentions.get(id) || null;
  }

  async findByExternalId(platform: string, externalId: string): Promise<SocialMention | null> {
    for (const mention of this.mentions.values()) {
      if (mention.platform === platform && mention.externalId === externalId) {
        return mention;
      }
    }
    return null;
  }

  async findMany(): Promise<SocialMention[]> {
    return Array.from(this.mentions.values());
  }

  async findPendingReview(): Promise<SocialMention[]> {
    return Array.from(this.mentions.values()).filter(m => !m.reviewedAt);
  }

  async findBySentiment(sentiment: string): Promise<SocialMention[]> {
    return Array.from(this.mentions.values()).filter(m => m.sentiment === sentiment);
  }

  async update(id: string, input: Partial<SocialMention>): Promise<SocialMention> {
    const mention = this.mentions.get(id);
    if (!mention) throw new Error('Mention not found');
    const updated = { ...mention, ...input };
    this.mentions.set(id, updated);
    return updated;
  }

  async markAsReviewed(id: string, reviewedBy: string): Promise<SocialMention> {
    return this.update(id, { reviewedAt: new Date(), reviewedBy });
  }

  async delete(id: string): Promise<void> {
    this.mentions.delete(id);
  }

  async countBySentiment(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const mention of this.mentions.values()) {
      counts[mention.sentiment] = (counts[mention.sentiment] || 0) + 1;
    }
    return counts;
  }

  // Helper for tests
  clear(): void {
    this.mentions.clear();
    this.idCounter = 0;
  }
}

// Arbitraries for generating test data
const platformArbitrary = fc.constantFrom<SocialPlatform>('twitter', 'facebook', 'instagram');
const authorArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const externalIdArbitrary = fc.uuid();
const sourceIdArbitrary = fc.uuid();

// Content arbitraries for different sentiments
const complaintContentArbitrary = fc.constantFrom(
  'Me estafaron con el servicio de visa',
  'Quiero que me devuelvan mi dinero',
  'Voy a denunciarlos por fraude',
  'Llevan semanas sin responder, esto es una estafa',
  'Me robaron, quiero mi dinero de vuelta',
);

const negativeContentArbitrary = fc.constantFrom(
  'El servicio fue malo',
  'Terrible experiencia',
  'Pésimo servicio al cliente',
  'No me gustó nada',
);

const positiveContentArbitrary = fc.constantFrom(
  'Excelente servicio, muy recomendado',
  'Gracias por su ayuda',
  'Los recomiendo ampliamente',
  'Muy profesionales, gracias',
);

const neutralContentArbitrary = fc.constantFrom(
  '¿Cuánto cuesta el servicio?',
  'Información sobre visas',
  'Horarios de atención',
  'Ubicación de oficinas',
);

describe('Sentiment Classification - Property Tests', () => {
  let repository: MockSocialMentionRepository;
  let sentimentClassifier: SentimentClassifier;
  let socialListenerService: SocialListenerService;

  beforeEach(() => {
    repository = new MockSocialMentionRepository();
    sentimentClassifier = new SentimentClassifier(new MockAIService() as unknown as AIService);
    socialListenerService = new SocialListenerService({
      repository,
      sentimentClassifier,
    });
  });

  /**
   * Property 11.1: Complaint content is classified as COMPLAINT
   * WHEN a mention contains complaint keywords THEN the SentimentClassifier
   * SHALL classify it as COMPLAINT
   */
  test('complaint content is classified as COMPLAINT', async () => {
    await fc.assert(
      fc.asyncProperty(
        complaintContentArbitrary,
        async (content) => {
          const result = await sentimentClassifier.classify(content);
          return result.sentiment === SentimentType.COMPLAINT;
        }
      )
    );
  });

  /**
   * Property 11.2: Complaints trigger requiresAlert flag
   * WHEN a mention is classified as COMPLAINT THEN the SocialListenerService
   * SHALL set requiresAlert to true
   */
  test('complaints trigger requiresAlert flag', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceIdArbitrary,
        platformArbitrary,
        externalIdArbitrary,
        authorArbitrary,
        complaintContentArbitrary,
        async (sourceId, platform, externalId, author, content) => {
          repository.clear();
          
          const rawMention: RawSocialMention = {
            platform,
            externalId,
            author,
            content,
            publishedAt: new Date(),
          };

          const result = await socialListenerService.processMention(sourceId, rawMention);
          
          // Complaint mentions should require an alert
          return result.requiresAlert === true;
        }
      )
    );
  });

  /**
   * Property 11.3: Non-complaint sentiments do not trigger alerts
   * WHEN a mention is classified as POSITIVE, NEUTRAL, or NEGATIVE THEN
   * the SocialListenerService SHALL set requiresAlert to false
   */
  test('non-complaint sentiments do not trigger alerts', async () => {
    const nonComplaintContent = fc.oneof(
      positiveContentArbitrary,
      neutralContentArbitrary,
      negativeContentArbitrary
    );

    await fc.assert(
      fc.asyncProperty(
        sourceIdArbitrary,
        platformArbitrary,
        externalIdArbitrary,
        authorArbitrary,
        nonComplaintContent,
        async (sourceId, platform, externalId, author, content) => {
          repository.clear();
          
          const rawMention: RawSocialMention = {
            platform,
            externalId,
            author,
            content,
            publishedAt: new Date(),
          };

          const result = await socialListenerService.processMention(sourceId, rawMention);
          
          // Non-complaint mentions should NOT require an alert
          return result.requiresAlert === false;
        }
      )
    );
  });

  /**
   * Property 11.4: Complaint mentions are stored with COMPLAINT sentiment
   * WHEN a complaint mention is processed THEN the stored mention SHALL
   * have sentiment set to COMPLAINT
   */
  test('complaint mentions are stored with COMPLAINT sentiment', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceIdArbitrary,
        platformArbitrary,
        externalIdArbitrary,
        authorArbitrary,
        complaintContentArbitrary,
        async (sourceId, platform, externalId, author, content) => {
          repository.clear();
          
          const rawMention: RawSocialMention = {
            platform,
            externalId,
            author,
            content,
            publishedAt: new Date(),
          };

          const result = await socialListenerService.processMention(sourceId, rawMention);
          
          // The stored mention should have COMPLAINT sentiment
          return result.mention.sentiment === SentimentType.COMPLAINT;
        }
      )
    );
  });

  /**
   * Property 11.5: isComplaint helper correctly identifies complaints
   * WHEN isComplaint is called with complaint content THEN it SHALL return true
   */
  test('isComplaint helper correctly identifies complaints', async () => {
    await fc.assert(
      fc.asyncProperty(
        complaintContentArbitrary,
        async (content) => {
          const isComplaint = await sentimentClassifier.isComplaint(content);
          return isComplaint === true;
        }
      )
    );
  });

  /**
   * Property 11.6: isComplaint returns false for non-complaints
   * WHEN isComplaint is called with non-complaint content THEN it SHALL return false
   */
  test('isComplaint returns false for non-complaints', async () => {
    const nonComplaintContent = fc.oneof(
      positiveContentArbitrary,
      neutralContentArbitrary,
      negativeContentArbitrary
    );

    await fc.assert(
      fc.asyncProperty(
        nonComplaintContent,
        async (content) => {
          const isComplaint = await sentimentClassifier.isComplaint(content);
          return isComplaint === false;
        }
      )
    );
  });

  /**
   * Property 11.7: Sentiment classification is deterministic
   * For any content, classifying it multiple times should return the same sentiment
   */
  test('sentiment classification is deterministic', async () => {
    const anyContent = fc.oneof(
      complaintContentArbitrary,
      positiveContentArbitrary,
      neutralContentArbitrary,
      negativeContentArbitrary
    );

    await fc.assert(
      fc.asyncProperty(
        anyContent,
        async (content) => {
          const result1 = await sentimentClassifier.classify(content);
          const result2 = await sentimentClassifier.classify(content);
          const result3 = await sentimentClassifier.classify(content);
          
          return (
            result1.sentiment === result2.sentiment &&
            result2.sentiment === result3.sentiment
          );
        }
      )
    );
  });
});
