// src/server/lib/features/knowledge/__tests__/Document.property.test.ts

/**
 * **Feature: rag-knowledge-system, Property 2: Content Hash Determinism**
 * For any document content, calculating the hash twice should produce identical results.
 * **Validates: Requirements 2.1**
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { calculateContentHash, hasContentChanged } from '../Document.entity';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('Document Content Hash - Property Tests', () => {
  /**
   * Property 2.1: Hash determinism - same content always produces same hash
   */
  test('calculating hash twice on same content produces identical results', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const hash1 = calculateContentHash(content);
        const hash2 = calculateContentHash(content);
        return hash1 === hash2;
      })
    );
  });

  /**
   * Property 2.2: Hash is always a valid SHA-256 hex string (64 characters)
   */
  test('hash is always a 64-character hex string', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const hash = calculateContentHash(content);
        return hash.length === 64 && /^[a-f0-9]+$/.test(hash);
      })
    );
  });

  /**
   * Property 2.3: Different content produces different hashes (collision resistance)
   * Note: This is probabilistic - SHA-256 has extremely low collision probability
   */
  test('different content produces different hashes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (content1, content2) => {
          // Skip if contents are the same
          if (content1 === content2) return true;

          const hash1 = calculateContentHash(content1);
          const hash2 = calculateContentHash(content2);
          return hash1 !== hash2;
        }
      )
    );
  });

  /**
   * Property 2.4: hasContentChanged returns false for same content
   */
  test('hasContentChanged returns false when content matches hash', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const hash = calculateContentHash(content);
        return hasContentChanged(content, hash) === false;
      })
    );
  });

  /**
   * Property 2.5: hasContentChanged returns true for different content
   */
  test('hasContentChanged returns true when content differs from hash', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (content1, content2) => {
          // Skip if contents are the same
          if (content1 === content2) return true;

          const hash1 = calculateContentHash(content1);
          return hasContentChanged(content2, hash1) === true;
        }
      )
    );
  });

  /**
   * Property 2.6: Hash is consistent across unicode content (including emojis and special chars)
   */
  test('hash is deterministic for unicode content', () => {
    // Test with various unicode strings including emojis
    const unicodeStrings = [
      '你好世界',
      'مرحبا بالعالم',
      '🎉🚀💻',
      'Ñoño español',
      'Привет мир',
      '日本語テスト',
      'Mixed: Hello 世界 🌍',
    ];

    for (const content of unicodeStrings) {
      const hash1 = calculateContentHash(content);
      const hash2 = calculateContentHash(content);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    }
  });

  /**
   * Property 2.7: Empty string has a consistent hash
   */
  test('empty string always produces the same hash', () => {
    const emptyHash1 = calculateContentHash('');
    const emptyHash2 = calculateContentHash('');
    expect(emptyHash1).toBe(emptyHash2);
    expect(emptyHash1.length).toBe(64);
  });

  /**
   * Property 2.8: Whitespace-only content produces deterministic hashes
   */
  test('whitespace content produces deterministic hashes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map((arr) => arr.join('')),
        (whitespace) => {
          const hash1 = calculateContentHash(whitespace);
          const hash2 = calculateContentHash(whitespace);
          return hash1 === hash2;
        }
      )
    );
  });
});
