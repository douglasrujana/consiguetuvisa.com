// Test Layer 3: Service Layer
// Objetivo: Verificar la lógica de negocio del servicio

import { describe, it, expect, beforeAll } from 'vitest';
import { AsesoriaService } from '../src/server/lib/features/asesoria/Asesoria.service';
import { AsesoriaRepository } from '../src/server/lib/features/asesoria/Asesoria.repository';

describe('Layer 3: Service', () => {
  let service: AsesoriaService;
  let repository: AsesoriaRepository;

  beforeAll(() => {
    repository = new AsesoriaRepository();
    service = new AsesoriaService(repository);
  });

  it('should instantiate service with repository dependency', () => {
    expect(service).toBeDefined();
    expect(service.getCitasUsuario).toBeDefined();
  });

  it('should be able to get user appointments through service', async () => {
    const testUserId = 'test-user-id';
    const result = await service.getCitasUsuario(testUserId);
    expect(Array.isArray(result)).toBeTruthy();
  });
});
