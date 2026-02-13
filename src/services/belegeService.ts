/**
 * Belege Service - Main Entry Point
 * Re-exports from modular architecture for backward compatibility
 * @deprecated Import from './belegeService/' submodules for better tree-shaking
 */

export { belegToDb, dbToBeleg } from './belegeService/converters';

export * as belegeService from './belegeService/belege';
export * as steuerkategorienService from './belegeService/steuerkategorien';
export * as kontierungskontenService from './belegeService/kontierungskonten';
export * as lieferantenRegelnService from './belegeService/lieferantenRegeln';
export * as einstellungenService from './belegeService/einstellungen';

// Re-export types
export type { GetAllOptions } from './belegeService/belege';
