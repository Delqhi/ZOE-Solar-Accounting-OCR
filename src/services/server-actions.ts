/**
 * Server Actions - React 19 Production Implementation
 *
 * Implements 2026 best practices for server actions with:
 * - Comprehensive rate limiting
 * - Input validation and sanitization
 * - Error classification and handling
 * - Performance monitoring
 * - Local-first + cloud sync architecture
 */

import { DocumentRecord, AppSettings, DocumentStatus } from '../types';
import * as storageService from './storageService';
import * as supabaseService from './supabaseService';
import { apiRateLimiter, exportRateLimiter } from '../utils/rateLimiter';
import { validateDocumentData, validateSettingsData } from '../utils/validation';
import { PerformanceMonitor } from '../utils/performanceMonitor';

// ========================================
// ERROR CLASSIFICATION
// ========================================

class ServerActionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "ServerActionError";
  }
}

// ========================================
// 📤 SERVER ACTIONS - Document Management
// ========================================

/**
 * Server Action: Save Document
 * @throws ServerActionError if validation or storage fails
 */
export async function saveDocumentAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; data?: DocumentRecord; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `save-doc-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting save document action...`);

    // Step 1: Extract and validate input
    const rawDoc = formData.get('document') as string;
    if (!rawDoc) {
      throw new ServerActionError(
        "No document data provided",
        "MISSING_INPUT",
        false
      );
    }

    let document: DocumentRecord;
    try {
      document = JSON.parse(rawDoc);
    } catch (parseError) {
      throw new ServerActionError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        "INVALID_JSON",
        false,
        parseError
      );
    }

    // Step 2: Validate document structure
    const validation = validateDocumentData(document);
    if (!validation.valid) {
      throw new ServerActionError(
        `Document validation failed: ${validation.errors.join(', ')}`,
        "VALIDATION_FAILED",
        false
      );
    }

    // Step 3: Check rate limit
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await apiRateLimiter.check(`action-save:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 4: Sanitize document data (XSS prevention)
    const sanitizedDoc = sanitizeDocumentData(document);

    // Step 5: Local-first storage
    await storageService.saveDocument(sanitizedDoc);

    // Step 6: Optional Supabase sync
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveDocument(sanitizedDoc);
      } catch (syncError) {
        console.warn(`⚠️  [${operationId}] Cloud sync failed, local save successful:`, syncError);
        // Don't fail the action, local storage succeeded
      }
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Document saved in ${duration.toFixed(2)}ms`);

    return {
      success: true,
      message: 'Document saved successfully',
      data: sanitizedDoc
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Save document action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("save_document_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to save document',
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Server Action: Delete Document
 * @throws ServerActionError if deletion fails
 */
export async function deleteDocumentAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `delete-doc-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting delete document action...`);

    // Step 1: Extract and validate input
    const id = formData.get('id') as string;
    if (!id) {
      throw new ServerActionError(
        "Document ID is required",
        "MISSING_INPUT",
        false
      );
    }

    // Step 2: Check rate limit
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await apiRateLimiter.check(`action-delete:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Delete from local storage
    await storageService.deleteDocument(id);

    // Step 4: Delete from cloud if configured
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.deleteDocument(id);
      } catch (syncError) {
        console.warn(`⚠️  [${operationId}] Cloud delete failed, local delete successful:`, syncError);
      }
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Document deleted in ${duration.toFixed(2)}ms`);

    return {
      success: true,
      message: 'Document deleted successfully'
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Delete document action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("delete_document_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to delete document',
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Server Action: Batch Process Documents
 * @throws ServerActionError if batch processing fails
 */
export async function batchProcessAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; processed?: number; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `batch-process-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting batch process action...`);

    // Step 1: Extract and validate input
    const rawDocs = formData.get('documents') as string;
    if (!rawDocs) {
      throw new ServerActionError(
        "No documents provided",
        "MISSING_INPUT",
        false
      );
    }

    let documents: DocumentRecord[];
    try {
      documents = JSON.parse(rawDocs);
    } catch (parseError) {
      throw new ServerActionError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        "INVALID_JSON",
        false,
        parseError
      );
    }

    if (!Array.isArray(documents) || documents.length === 0) {
      throw new ServerActionError(
        "Documents must be a non-empty array",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Rate limit check (stricter for batch operations)
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await apiRateLimiter.check(`action-batch:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Validate all documents
    const validationErrors: string[] = [];
    const validDocuments: DocumentRecord[] = [];

    for (const doc of documents) {
      const validation = validateDocumentData(doc);
      if (!validation.valid) {
        validationErrors.push(`Document ${doc.id || 'unknown'}: ${validation.errors.join(', ')}`);
      } else {
        validDocuments.push(sanitizeDocumentData(doc));
      }
    }

    if (validationErrors.length > 0) {
      throw new ServerActionError(
        `Batch validation failed: ${validationErrors.join('; ')}`,
        "VALIDATION_FAILED",
        false
      );
    }

    // Step 4: Process documents
    let processed = 0;
    let syncErrors = 0;

    for (const doc of validDocuments) {
      // Local storage
      await storageService.saveDocument(doc);

      // Cloud sync
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveDocument(doc);
        } catch (syncError) {
          syncErrors++;
          console.warn(`⚠️  [${operationId}] Cloud sync failed for ${doc.id}:`, syncError);
        }
      }

      processed++;
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Batch processed ${processed} documents in ${duration.toFixed(2)}ms${syncErrors > 0 ? ` (${syncErrors} sync errors)` : ''}`);

    return {
      success: true,
      message: `Processed ${processed} documents${syncErrors > 0 ? ` (${syncErrors} cloud sync errors)` : ''}`,
      processed
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Batch process action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("batch_process_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      docCount: formData.get('documents') ? JSON.parse(formData.get('documents') as string).length : 0
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Batch processing failed',
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Server Action: Sync with Supabase
 * @throws ServerActionError if sync fails
 */
export async function syncWithCloudAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; synced?: number; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `sync-cloud-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting cloud sync action...`);

    // Step 1: Check Supabase configuration
    if (!supabaseService.isSupabaseConfigured()) {
      throw new ServerActionError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 2: Check rate limit
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await apiRateLimiter.check(`action-sync:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Get documents from both sources
    const localDocs = await storageService.getAllDocuments();
    const cloudDocs = await supabaseService.getAllDocuments();

    console.log(`📋 [${operationId}] Local: ${localDocs.length}, Cloud: ${cloudDocs.length} documents`);

    // Step 4: Merge strategy - upload local docs that don't exist in cloud
    let synced = 0;
    let errors = 0;

    for (const localDoc of localDocs) {
      const existsInCloud = cloudDocs.some(cd => cd.id === localDoc.id);
      if (!existsInCloud) {
        try {
          await supabaseService.saveDocument(localDoc);
          synced++;
        } catch (syncError) {
          errors++;
          console.warn(`⚠️  [${operationId}] Failed to sync ${localDoc.id}:`, syncError);
        }
      }
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Sync completed in ${duration.toFixed(2)}ms: ${synced} uploaded${errors > 0 ? `, ${errors} failed` : ''}`);

    return {
      success: true,
      message: `Synced ${synced} documents to cloud${errors > 0 ? ` (${errors} failed)` : ''}`,
      synced
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Sync action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("sync_cloud_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Sync failed',
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Server Action: Update Settings
 * @throws ServerActionError if validation or update fails
 */
export async function updateSettingsAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; settings?: AppSettings; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `update-settings-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting update settings action...`);

    // Step 1: Extract and validate input
    const rawSettings = formData.get('settings') as string;
    if (!rawSettings) {
      throw new ServerActionError(
        "No settings data provided",
        "MISSING_INPUT",
        false
      );
    }

    let settings: AppSettings;
    try {
      settings = JSON.parse(rawSettings);
    } catch (parseError) {
      throw new ServerActionError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        "INVALID_JSON",
        false,
        parseError
      );
    }

    // Step 2: Validate settings structure
    const validation = validateSettingsData(settings);
    if (!validation.valid) {
      throw new ServerActionError(
        `Settings validation failed: ${validation.errors.join(', ')}`,
        "VALIDATION_FAILED",
        false
      );
    }

    // Step 3: Check rate limit
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await apiRateLimiter.check(`action-settings:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 4: Save to local storage
    await storageService.saveSettings(settings);

    // Step 5: Sync to cloud if configured
    if (supabaseService.isSupabaseConfigured()) {
      try {
        await supabaseService.saveSettings(settings);
      } catch (syncError) {
        console.warn(`⚠️  [${operationId}] Cloud sync failed, local save successful:`, syncError);
      }
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Settings updated in ${duration.toFixed(2)}ms`);

    return {
      success: true,
      message: 'Settings updated successfully',
      settings
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Update settings action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("update_settings_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to update settings',
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Server Action: Export Documents to SQL
 * @throws ServerActionError if export fails
 */
export async function exportDocumentsAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; sql?: string; errors?: string[] }> {
  const startTime = PerformanceMonitor.now();
  const operationId = `export-action-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting export action...`);

    // Step 1: Extract and validate input
    const rawDocs = formData.get('documents') as string;
    if (!rawDocs) {
      throw new ServerActionError(
        "No documents provided",
        "MISSING_INPUT",
        false
      );
    }

    let documents: DocumentRecord[];
    try {
      documents = JSON.parse(rawDocs);
    } catch (parseError) {
      throw new ServerActionError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        "INVALID_JSON",
        false,
        parseError
      );
    }

    if (!Array.isArray(documents) || documents.length === 0) {
      throw new ServerActionError(
        "Documents must be a non-empty array",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Parse settings (optional)
    let settings: AppSettings | undefined;
    const rawSettings = formData.get('settings') as string;
    if (rawSettings) {
      try {
        settings = JSON.parse(rawSettings);
      } catch (parseError) {
        console.warn(`⚠️  [${operationId}] Invalid settings format, using defaults`);
      }
    }

    // Step 3: Check rate limit (export has stricter limits)
    const userId = formData.get('userId') as string || 'anonymous';
    const rateCheck = await exportRateLimiter.check(`action-export:${userId}`);
    if (!rateCheck.allowed) {
      throw new ServerActionError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 4: Generate SQL export
    const sql = supabaseService.exportDocumentsToSQL(documents, settings);

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Export completed in ${duration.toFixed(2)}ms (${sql.length} bytes)`);

    return {
      success: true,
      message: 'Export generated successfully',
      sql
    };

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Export action failed after ${duration.toFixed(2)}ms`, error);

    PerformanceMonitor.recordMetric("export_documents_action_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      docCount: formData.get('documents') ? JSON.parse(formData.get('documents') as string).length : 0
    });

    if (error instanceof ServerActionError) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }

    return {
      success: false,
      message: error.message || 'Export failed',
      errors: [error.message || 'Unknown error']
    };
  }
}

// ========================================
// 🎯 UTILITY FUNCTIONS
// ========================================

/**
 * Helper: Validate Server Action Input
 * @deprecated Use individual validation functions from utils/validation
 */
export function validateActionInput<T>(
  data: any,
  requiredFields: string[]
): { valid: boolean; errors: string[]; parsed?: T } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors, parsed: data as T };
}

/**
 * Helper: Create Server Action Response
 */
export function createActionResponse<T>(
  success: boolean,
  message: string,
  data?: T
): { success: boolean; message: string; data?: T } {
  return { success, message, data };
}

// ========================================
// 🔒 SECURITY UTILITIES
// ========================================

/**
 * Helper: Sanitize Document Data (XSS Prevention)
 * Removes potentially dangerous characters and patterns from string fields
 */
export function sanitizeDocumentData(document: DocumentRecord): DocumentRecord {
  const sanitized = { ...document };

  // Sanitize filename - remove HTML tags and event handlers
  if (sanitized.fileName) {
    sanitized.fileName = sanitized.fileName
      .replace(/<script[^>]*>.*?<\/script>/gi, '')  // Remove script tags
      .replace(/<[^>]+>/g, '')                      // Remove all HTML tags
      .replace(/javascript:/gi, '')                 // Remove javascript: protocol
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')  // Remove event handlers
      .replace(/[\u0000-\u001F\u007F]/g, '')        // Remove control chars
      .replace(/\s+/g, ' ')                         // Normalize whitespace
      .trim();
  }

  // Sanitize file type
  if (sanitized.fileType) {
    sanitized.fileType = sanitized.fileType.replace(/[^a-zA-Z0-9/+-]/g, '');
  }

  // Sanitize data fields
  if (sanitized.data) {
    const data = { ...sanitized.data };

    // Helper to sanitize any string field
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
        .replace(/<svg[^>]*>.*?<\/svg>/gi, '')
        .replace(/<[^>]+>/g, '')                      // Remove all remaining HTML tags
        .replace(/javascript:/gi, '')                 // Remove javascript: protocol
        .replace(/data:/gi, '')                       // Remove data: protocol
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')  // Remove event handlers onclick=, onerror=, onload=, etc.
        .replace(/expression\s*\([^)]*\)/gi, '')      // Remove CSS expressions
        .replace(/vbscript:/gi, '')                   // Remove vbscript:
        .replace(/[\u0000-\u001F\u007F]/g, '')        // Remove control chars
        .replace(/\s+/g, ' ')                         // Normalize whitespace
        .trim();
    };

    if (data.lieferantName) {
      data.lieferantName = sanitizeString(data.lieferantName);
    }
    if (data.lieferantAdresse) {
      data.lieferantAdresse = sanitizeString(data.lieferantAdresse);
    }
    if (data.beschreibung) {
      data.beschreibung = sanitizeString(data.beschreibung);
    }
    if (data.textContent) {
      data.textContent = sanitizeString(data.textContent);
    }
    if (data.ocr_rationale) {
      data.ocr_rationale = sanitizeString(data.ocr_rationale);
    }

    sanitized.data = data;
  }

  // Sanitize error field
  if (sanitized.error) {
    sanitized.error = sanitized.error
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .trim();
  }

  return sanitized;
}

/**
 * Helper: Validate Document Status
 */
export function isValidDocumentStatus(status: string): boolean {
  const validStatuses = ['PROCESSING', 'REVIEW_NEEDED', 'COMPLETED', 'ERROR', 'DUPLICATE', 'PRIVATE'];
  return validStatuses.includes(status);
}

// ========================================
// 📊 HEALTH CHECK
// ========================================

/**
 * Health check for server actions
 */
export async function checkServerActionsHealth(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check storage service
    const dbStatus = await storageService.getDBStatus();

    // Check Supabase if configured
    let supabaseHealthy = true;
    let supabaseMessage = 'Not configured';
    if (supabaseService.isSupabaseConfigured()) {
      const supabaseHealth = await supabaseService.checkSupabaseServiceHealth();
      supabaseHealthy = supabaseHealth.healthy;
      supabaseMessage = supabaseHealth.message;
    }

    // Check rate limiter
    const rateCheck = await apiRateLimiter.check('health-check');
    const rateLimiterHealthy = rateCheck.allowed;

    const allHealthy = dbStatus.isOpen && supabaseHealthy && rateLimiterHealthy;

    return {
      healthy: allHealthy,
      message: allHealthy ? 'All services operational' : 'Some services unhealthy',
      details: {
        storage: {
          isOpen: dbStatus.isOpen,
          documentCount: dbStatus.documentCount
        },
        supabase: {
          healthy: supabaseHealthy,
          message: supabaseMessage
        },
        rateLimiter: {
          healthy: rateLimiterHealthy,
          retryAfter: rateCheck.retryAfter
        }
      }
    };

  } catch (error) {
    return {
      healthy: false,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// ========================================
// 📦 EXPORT SERVICE OBJECT
// ========================================

/**
 * Export for testing and debugging
 */
export const serverActionsService = {
  // Document Actions
  saveDocumentAction,
  deleteDocumentAction,
  batchProcessAction,
  syncWithCloudAction,
  updateSettingsAction,
  exportDocumentsAction,

  // Utilities
  validateActionInput,
  createActionResponse,
  sanitizeDocumentData,
  isValidDocumentStatus,

  // Health Check
  checkServerActionsHealth
};
