/**
 * Belege Service - Main Entry Point
 * Re-exports from modular architecture for backward compatibility
 * @deprecated Import from './belegeService/' submodules for better tree-shaking
 */

export {
  belegToDb,
  dbToBeleg,
} from './belegeService/converters';

export {
  belegeService,
  steuerkategorienService,
  kontierungskontenService,
  lieferantenRegelnService,
  einstellungenService,
} from './belegeService';

// Re-export types
export type { GetAllOptions } from './belegeService/belege';
