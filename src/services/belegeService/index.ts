export { belegToDb, dbToBeleg } from './converters';
export * as belege from './belege';
export * as steuerkategorien from './steuerkategorien';
export * as kontierungskonten from './kontierungskonten';
export * as lieferantenRegeln from './lieferantenRegeln';
export * as einstellungen from './einstellungen';

// Re-export for backward compatibility
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
