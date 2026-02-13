export { belegToDb, dbToBeleg } from './converters';

// Service exports with Service suffix for backward compatibility
export * as belegeService from './belege';
export * as steuerkategorienService from './steuerkategorien';
export * as kontierungskontenService from './kontierungskonten';
export * as lieferantenRegelnService from './lieferantenRegeln';
export * as einstellungenService from './einstellungen';

// Re-export for backward compatibility (direct function exports)
export {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove as delete,
  findByFileHash,
  findSemanticDuplicates,
  getStats,
  createPositionen,
  deletePositionen,
  updatePositionen,
} from './belege';
