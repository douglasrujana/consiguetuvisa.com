
import { describe, it, expect, beforeAll } from 'vitest';

describe('E2E API Flow: Citas', { timeout: 30000 }, () => {
    // ...
    // Targeting Vercel Emulator (Port 3000 confirmed specific)
  const BASE_URL = 'http://localhost:3000/api/graphql';

  it('should allow booking an appointment', async () => {
    // 1. Prepare Data
    const mutation = `
      mutation AgendarCita($input: AgendarCitaInput!) {
        agendarCita(input: $input) {
          id
          status
          serviceType
          scheduledDate
        }
      }
    `;
    
    const variables = {
      input: {
        serviceType: 'Visa_Turista',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        notes: "E2E Automated Test"
      }
    };

    // 2. Execute Request
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables })
    });

    // 3. Assertions
    expect(response.status).toBe(200);
    
    const json: any = await response.json();
    expect(json.errors).toBeUndefined();
    expect(json.data.agendarCita).toBeDefined();
    expect(json.data.agendarCita.id).toBeTypeOf('string');
    expect(json.data.agendarCita.status).toBe('PENDING');
  });

  it('should fail if service type is missing', async () => {
     // Negative Test Case
     const mutation = `
      mutation AgendarCita($input: AgendarCitaInput!) {
        agendarCita(input: $input) {
          id
        }
      }
    `;
    
    // Missing serviceType in variables
    const variables = {
      input: {
        scheduledDate: new Date().toISOString()
      }
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables })
    });

    const json: any = await response.json();
    expect(json.errors).toBeDefined();
  });
});
