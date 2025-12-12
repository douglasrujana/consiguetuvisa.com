// src/server/lib/features/knowledge/__tests__/Source.property.test.ts

/**
 * **Feature: rag-knowledge-system, Property 1: Source Configuration Validation**
 * For any source configuration, if the configuration is missing required fields
 * for its type, the system should reject it with a validation error.
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateSourceConfig,
  isValidSourceConfig,
  CreateSourceSchema,
  SourceConfigSchema,
} from '../Source.dto';
import { SourceType } from '../Source.entity';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('Source Configuration Validation - Property Tests', () => {
  /**
   * Property 1.1: Valid BLOB configurations should always pass validation
   */
  test('valid BLOB configurations should pass validation', () => {
    const validBlobConfig = fc.record({
      type: fc.constant('BLOB' as const),
      bucket: fc.string({ minLength: 1 }),
      prefix: fc.option(fc.string(), { nil: undefined }),
    });

    fc.assert(
      fc.property(validBlobConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.2: BLOB configurations without bucket should fail validation
   */
  test('BLOB configurations without bucket should fail validation', () => {
    const invalidBlobConfig = fc.record({
      type: fc.constant('BLOB' as const),
      bucket: fc.constant(''), // Empty bucket
      prefix: fc.option(fc.string(), { nil: undefined }),
    });

    fc.assert(
      fc.property(invalidBlobConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.3: Valid SANITY configurations should always pass validation
   */
  test('valid SANITY configurations should pass validation', () => {
    const validSanityConfig = fc.record({
      type: fc.constant('SANITY' as const),
      dataset: fc.string({ minLength: 1 }),
      query: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(validSanityConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.4: SANITY configurations without dataset or query should fail
   */
  test('SANITY configurations without required fields should fail validation', () => {
    const invalidSanityConfigs = fc.oneof(
      fc.record({
        type: fc.constant('SANITY' as const),
        dataset: fc.constant(''),
        query: fc.string({ minLength: 1 }),
      }),
      fc.record({
        type: fc.constant('SANITY' as const),
        dataset: fc.string({ minLength: 1 }),
        query: fc.constant(''),
      })
    );

    fc.assert(
      fc.property(invalidSanityConfigs, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.5: Valid WEB configurations should always pass validation
   */
  test('valid WEB configurations should pass validation', () => {
    const validWebConfig = fc.record({
      type: fc.constant('WEB' as const),
      urls: fc.array(fc.webUrl(), { minLength: 1 }),
      selector: fc.option(fc.string(), { nil: undefined }),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(validWebConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.6: WEB configurations with empty urls array should fail
   */
  test('WEB configurations with empty urls should fail validation', () => {
    const invalidWebConfig = fc.record({
      type: fc.constant('WEB' as const),
      urls: fc.constant([]),
      selector: fc.option(fc.string(), { nil: undefined }),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(invalidWebConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.7: Valid SOCIAL configurations should always pass validation
   */
  test('valid SOCIAL configurations should pass validation', () => {
    const validSocialConfig = fc.record({
      type: fc.constant('SOCIAL' as const),
      platform: fc.constantFrom('twitter', 'facebook', 'instagram'),
      accounts: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(validSocialConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.8: SOCIAL configurations with invalid platform should fail
   */
  test('SOCIAL configurations with invalid platform should fail validation', () => {
    const invalidSocialConfig = fc.record({
      type: fc.constant('SOCIAL' as const),
      platform: fc.string().filter((s) => !['twitter', 'facebook', 'instagram'].includes(s)),
      accounts: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(invalidSocialConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.9: Valid RSS configurations should always pass validation
   */
  test('valid RSS configurations should pass validation', () => {
    const validRSSConfig = fc.record({
      type: fc.constant('RSS' as const),
      feedUrls: fc.array(fc.webUrl(), { minLength: 1 }),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(validRSSConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.10: RSS configurations with empty feedUrls should fail
   */
  test('RSS configurations with empty feedUrls should fail validation', () => {
    const invalidRSSConfig = fc.record({
      type: fc.constant('RSS' as const),
      feedUrls: fc.constant([]),
      schedule: fc.string({ minLength: 1 }),
    });

    fc.assert(
      fc.property(invalidRSSConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.11: MANUAL configurations should always pass validation
   */
  test('MANUAL configurations should always pass validation', () => {
    const validManualConfig = fc.constant({ type: 'MANUAL' as const });

    fc.assert(
      fc.property(validManualConfig, (config) => {
        const result = SourceConfigSchema.safeParse(config);
        return result.success === true;
      })
    );
  });

  /**
   * Property 1.12: CreateSource with mismatched type and config.type should fail
   */
  test('CreateSource with mismatched type and config.type should fail', () => {
    // Generate a source type and a config with a DIFFERENT type
    const mismatchedSource = fc.tuple(
      fc.constantFrom(...Object.values(SourceType)),
      fc.constantFrom(...Object.values(SourceType))
    ).filter(([sourceType, configType]) => sourceType !== configType)
      .chain(([sourceType, configType]) => {
        // Create a valid config for configType
        const configGen = configType === SourceType.MANUAL
          ? fc.constant({ type: 'MANUAL' as const })
          : fc.constant({ type: configType, bucket: 'test' }); // Simplified for test

        return fc.record({
          type: fc.constant(sourceType),
          name: fc.string({ minLength: 1 }),
          config: configGen,
        });
      });

    fc.assert(
      fc.property(mismatchedSource, (source) => {
        const result = CreateSourceSchema.safeParse(source);
        return result.success === false;
      })
    );
  });

  /**
   * Property 1.13: isValidSourceConfig returns boolean consistently
   */
  test('isValidSourceConfig returns boolean for any input', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = isValidSourceConfig(input);
        return typeof result === 'boolean';
      })
    );
  });
});
