// src/server/lib/adapters/crm/index.ts
// Factory de proveedores de CRM

import type { ICRMProvider } from './CRM.port';
import { HubSpotAdapter } from './HubSpot.adapter';
import { Bitrix24Adapter } from './Bitrix24.adapter';
import { NullCRMAdapter } from './NullCRM.adapter';
import { config } from '../../core/config';

export type { ICRMProvider, CRMContact, CRMLead, CRMDeal, CRMResult } from './CRM.port';
export { HubSpotAdapter } from './HubSpot.adapter';
export { Bitrix24Adapter } from './Bitrix24.adapter';
export { NullCRMAdapter } from './NullCRM.adapter';

/**
 * Factory que crea el proveedor de CRM según la configuración.
 */
export function createCRMProvider(): ICRMProvider {
  if (!config.crm.enabled) {
    console.log('[CRM] Deshabilitado por configuración');
    return new NullCRMAdapter();
  }

  switch (config.crm.provider) {
    case 'hubspot':
      const hubspot = new HubSpotAdapter();
      if (!hubspot.isConfigured()) {
        console.warn('[CRM] HubSpot no configurado, usando Null');
        return new NullCRMAdapter();
      }
      console.log('[CRM] Usando HubSpot');
      return hubspot;

    case 'bitrix24':
      if (!config.crm.webhookUrl) {
        console.warn('[CRM] Bitrix24 no configurado, usando Null');
        return new NullCRMAdapter();
      }
      console.log('[CRM] Usando Bitrix24');
      // Bitrix24Adapter usa el puerto antiguo, crear wrapper si es necesario
      return new NullCRMAdapter(); // TODO: Adaptar Bitrix24Adapter al nuevo puerto

    case 'salesforce':
      // TODO: Implementar SalesforceAdapter
      console.warn('[CRM] Salesforce no implementado, usando Null');
      return new NullCRMAdapter();

    case 'none':
    default:
      return new NullCRMAdapter();
  }
}

// Singleton del proveedor de CRM
let _crmProvider: ICRMProvider | null = null;

export function getCRMProvider(): ICRMProvider {
  if (!_crmProvider) {
    _crmProvider = createCRMProvider();
  }
  return _crmProvider;
}
