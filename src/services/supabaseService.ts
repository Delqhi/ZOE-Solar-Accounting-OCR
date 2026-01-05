/**
 * Supabase Service
 * Production-ready Supabase integration with rate limiting, error handling, and edge case management
 * Implements 2026 best practices for cloud database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentRecord, DocumentStatus, ExtractedData, AppSettings } from '../types';
import { authRateLimiter, apiRateLimiter, exportRateLimiter } from '../utils/rateLimiter';
import { validateEmail, validatePassword, validateBase64Data, validateMimeType } from '../utils/validation';
import { PerformanceMonitor } from '../utils/performanceMonitor';

// Type-safe configuration interface
interface SupabaseConfig {
  url: string;
  anonKey: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  maxUploadSize: number; // 50MB
}

// Service configuration
const CONFIG: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  timeoutMs: 30000, // 30 seconds
  maxRetries: 2,
  retryDelayMs: 1500,
  maxUploadSize: 50 * 1024 * 1024, // 50MB
};

let supabaseClient: SupabaseClient | null = null;
let isInitializing = false;

/**
 * Error classification for better error handling
 */
export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "SupabaseServiceError";
  }
}

/**
 * Utility: Delay execution
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initialize Supabase client with proper error handling
 * @throws SupabaseServiceError if initialization fails
 */
export const initSupabase = (): SupabaseClient | null => {
  // Validate environment
  if (!CONFIG.url || CONFIG.url === "PLACEHOLDER_GET_FROM_VERCEL") {
    console.warn("⚠️  Supabase URL not configured. Cloud sync will be disabled.");
    return null;
  }

  if (!CONFIG.anonKey || CONFIG.anonKey === "PLACEHOLDER_GET_FROM_VERCEL") {
    console.warn("⚠️  Supabase anon key not configured. Cloud sync will be disabled.");
    return null;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    return supabaseClient;
  }

  try {
    isInitializing = true;

    if (!supabaseClient) {
      supabaseClient = createClient(CONFIG.url, CONFIG.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'x-zoe-app': 'solar-accounting-ocr',
            'x-app-version': '1.0.0'
          }
        },
        db: {
          schema: 'public'
        }
      });

      console.log('✅ Supabase client initialized');
    }

    return supabaseClient;
  } catch (error: any) {
    console.error('❌ Supabase initialization failed:', error);
    throw new SupabaseServiceError(
      `Failed to initialize Supabase: ${error.message}`,
      "INITIALIZATION_FAILED",
      false,
      error
    );
  } finally {
    isInitializing = false;
  }
};

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(CONFIG.url && CONFIG.anonKey && CONFIG.url !== "PLACEHOLDER_GET_FROM_VERCEL");
};

/**
 * Execute Supabase operation with timeout and retry logic
 */
async function executeWithTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryCount: number = 0
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${operationName} timeout`)), CONFIG.timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error: any) {
    // Determine if error is retryable
    const isRetryable =
      error.status === 429 ||
      error.status === 503 ||
      error.status === 502 ||
      error.status === 504 ||
      error.message?.includes("429") ||
      error.message?.includes("503") ||
      error.message?.includes("timeout") ||
      error.message?.includes("network") ||
      error.message?.includes("Failed to fetch");

    if (isRetryable && retryCount < CONFIG.maxRetries) {
      console.warn(`⚠️  ${operationName} error (attempt ${retryCount + 1}/${CONFIG.maxRetries}): ${error.message}`);
      console.log(`⏳ Retrying in ${CONFIG.retryDelayMs}ms...`);

      await delay(CONFIG.retryDelayMs);
      return executeWithTimeoutAndRetry(operation, operationName, retryCount + 1);
    }

    throw new SupabaseServiceError(
      `${operationName} failed: ${error.message || "Unknown error"}`,
      isRetryable ? "RETRY_EXHAUSTED" : "OPERATION_FAILED",
      false,
      error
    );
  }
}

// --- Authentication ---

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

/**
 * Sign up with validation and rate limiting
 */
export const signUp = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `signup-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting signup...`);

    // Step 1: Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      PerformanceMonitor.recordMetric("signup_validation_failure", {
        operationId,
        duration: PerformanceMonitor.now() - startTime,
        error: "Invalid email"
      });
      return { user: null, error: emailValidation.errors?.join(", ") || "Invalid email" };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      PerformanceMonitor.recordMetric("signup_validation_failure", {
        operationId,
        duration: PerformanceMonitor.now() - startTime,
        error: "Invalid password"
      });
      return { user: null, error: passwordValidation.errors?.join(", ") || "Invalid password" };
    }

    // Step 2: Check rate limit (very strict for auth)
    const rateCheck = await authRateLimiter.check(`signup:${email}`);
    if (!rateCheck.allowed) {
      return {
        user: null,
        error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter || 60} seconds.`
      };
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      return { user: null, error: 'Supabase not configured' };
    }

    // Step 4: Execute signup with timeout/retry
    const result = await executeWithTimeoutAndRetry(
      () => client.auth.signUp({ email, password }),
      "signUp"
    );

    const { data, error } = result;

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const duration = PerformanceMonitor.now() - startTime;
      console.log(`✅ [${operationId}] Signup successful in ${duration.toFixed(2)}ms`);

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          createdAt: data.user.created_at
        },
        error: null
      };
    }

    return { user: null, error: 'Unknown error' };

  } catch (error: any) {
    PerformanceMonitor.recordMetric("signup_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message
    });

    return { user: null, error: error.message || 'Signup failed' };
  }
};

/**
 * Sign in with validation and rate limiting
 */
export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `signin-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Starting signin...`);

    // Step 1: Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { user: null, error: emailValidation.errors?.join(", ") || "Invalid email" };
    }

    // Step 2: Check rate limit (strict for auth)
    const rateCheck = await authRateLimiter.check(`signin:${email}`);
    if (!rateCheck.allowed) {
      return {
        user: null,
        error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter || 60} seconds.`
      };
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      return { user: null, error: 'Supabase not configured' };
    }

    // Step 4: Execute signin with timeout/retry
    const result = await executeWithTimeoutAndRetry(
      () => client.auth.signInWithPassword({ email, password }),
      "signIn"
    );

    const { data, error } = result;

    // Record performance metric
    PerformanceMonitor.recordMetric("authSignIn", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      success: !error
    });

    if (error) {
      // Count failed attempt for rate limiting
      await authRateLimiter.check(`signin-failed:${email}`);
      return { user: null, error: error.message };
    }

    if (data.user) {
      const duration = PerformanceMonitor.now() - startTime;
      console.log(`✅ [${operationId}] Signin successful in ${duration.toFixed(2)}ms`);

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          createdAt: data.user.created_at
        },
        error: null
      };
    }

    return { user: null, error: 'Unknown error' };

  } catch (error: any) {
    PerformanceMonitor.recordMetric("signin_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message
    });

    return { user: null, error: error.message || 'Signin failed' };
  }
};

/**
 * Sign out with proper cleanup
 */
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const client = initSupabase();
    if (!client) {
      return { error: 'Supabase not configured' };
    }

    await executeWithTimeoutAndRetry(
      () => client.auth.signOut(),
      "signOut"
    );

    console.log('✅ User signed out');
    return { error: null };

  } catch (error: any) {
    console.error('❌ Sign out failed:', error);
    return { error: error.message || 'Sign out failed' };
  }
};

/**
 * Get current user with caching
 */
export const getCurrentUser = async (): Promise<{ user: User | null; error: string | null }> => {
  try {
    const client = initSupabase();
    if (!client) {
      return { user: null, error: 'Supabase not configured' };
    }

    const { data, error } = await executeWithTimeoutAndRetry(
      () => client.auth.getUser(),
      "getCurrentUser"
    );

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          createdAt: data.user.created_at
        },
        error: null
      };
    }

    return { user: null, error: 'No user' };

  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to get user' };
  }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  const client = initSupabase();
  if (!client) {
    callback(null);
    return () => {};
  }

  try {
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          createdAt: session.user.created_at
        });
      } else {
        callback(null);
      }
    });

    // Return cleanup function
    return () => {
      data.subscription.unsubscribe();
    };
  } catch (error) {
    console.error('❌ Auth state change subscription failed:', error);
    callback(null);
    return () => {};
  }
};

// --- Document Operations ---

export interface SupabaseDocument {
  id: string;
  file_data: string; // base64 encoded
  file_name: string;
  file_type: string;
  lieferant_name: string | null;
  lieferant_adresse: string | null;
  beleg_datum: string | null;
  brutto_betrag: number | null;
  mwst_betrag: number | null;
  mwst_satz: number | null;
  steuerkategorie: string | null;
  skr03_konto: string | null;
  line_items: any | null;
  status: string;
  score: number | null;
  created_at: string;
}

export interface PrivateDocumentRecord {
  id: string;
  file_data: string;
  file_name: string;
  file_type: string;
  vendor_name: string | null;
  document_date: string | null;
  total_amount: number | null;
  line_items: any | null;
  private_reason: string;
  created_at: string;
}

/**
 * Get all documents from Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const getAllDocuments = async (): Promise<DocumentRecord[]> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `get-all-docs-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Fetching all documents...`);

    // Step 1: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 2: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 3: Execute query with timeout/retry
    const { data, error } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege')
        .select('*')
        .order('created_at', { ascending: false }),
      "getAllDocuments"
    );

    if (error) {
      console.error(`❌ [${operationId}] Error:`, error);
      throw new SupabaseServiceError(
        `Failed to fetch documents: ${error.message}`,
        "FETCH_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Fetched ${data?.length || 0} documents in ${duration.toFixed(2)}ms`);

    // Record performance metric
    PerformanceMonitor.recordMetric("get_all_documents", {
      operationId,
      duration,
      count: data?.length || 0
    });

    return (data || []).map(doc => transformSupabaseToDocument(doc));

  } catch (error: any) {
    PerformanceMonitor.recordMetric("get_all_documents_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to get all documents',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

/**
 * Get documents with pagination
 * @throws SupabaseServiceError if operation fails
 */
export const getDocumentsPaginated = async (
  page: number = 1,
  pageSize: number = 50
): Promise<{ documents: DocumentRecord[]; total: number; hasMore: boolean }> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `get-docs-paginated-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Fetching page ${page} with ${pageSize} items...`);

    // Step 1: Validate inputs
    if (page < 1 || pageSize < 1) {
      throw new SupabaseServiceError(
        "Invalid pagination parameters",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Step 4: Get total count with timeout/retry
    const { count } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege')
        .select('*', { count: 'exact', head: true }),
      "getDocumentsCount"
    );

    // Step 5: Get paginated data with timeout/retry
    const { data, error } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to),
      "getDocumentsPaginated"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to fetch paginated documents: ${error.message}`,
        "FETCH_FAILED",
        false,
        error
      );
    }

    const documents = (data || []).map(doc => transformSupabaseToDocument(doc));
    const total = count || 0;
    const hasMore = to < total - 1;

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Fetched ${documents.length} documents (total: ${total}, hasMore: ${hasMore}) in ${duration.toFixed(2)}ms`);

    return { documents, total, hasMore };

  } catch (error: any) {
    PerformanceMonitor.recordMetric("get_documents_paginated_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      page,
      pageSize
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to get paginated documents',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

/**
 * Save document to Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `save-doc-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Saving document ${doc.id}...`);

    // Step 1: Validate document
    if (!doc.id || !doc.fileName) {
      throw new SupabaseServiceError(
        "Invalid document: missing id or fileName",
        "INVALID_DOCUMENT",
        false
      );
    }

    // Step 2: Check file size if previewUrl exists
    if (doc.previewUrl) {
      const base64Data = doc.previewUrl.split(',')[1] || '';
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      if (sizeInBytes > CONFIG.maxUploadSize) {
        throw new SupabaseServiceError(
          `Document too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds ${CONFIG.maxUploadSize / 1024 / 1024}MB limit`,
          "FILE_TOO_LARGE",
          false
        );
      }
    }

    // Step 3: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 4: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 5: Transform and save with timeout/retry
    const supabaseDoc = transformDocumentToSupabase(doc);

    const { error } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege')
        .upsert(supabaseDoc, { onConflict: 'id' }),
      "saveDocument"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to save document: ${error.message}`,
        "SAVE_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Document saved in ${duration.toFixed(2)}ms`);

  } catch (error: any) {
    PerformanceMonitor.recordMetric("save_document_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      documentId: doc.id
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to save document',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

/**
 * Delete document from Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const deleteDocument = async (id: string): Promise<void> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `delete-doc-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Deleting document ${id}...`);

    // Step 1: Validate input
    if (!id) {
      throw new SupabaseServiceError(
        "Document ID is required",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 4: Execute delete with timeout/retry
    const { error } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege')
        .delete()
        .eq('id', id),
      "deleteDocument"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to delete document: ${error.message}`,
        "DELETE_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Document deleted in ${duration.toFixed(2)}ms`);

  } catch (error: any) {
    PerformanceMonitor.recordMetric("delete_document_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      documentId: id
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to delete document',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

/**
 * Save private document to Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const savePrivateDocument = async (
  id: string,
  fileName: string,
  fileType: string,
  base64Data: string,
  extractedData: ExtractedData,
  privateReason: string
): Promise<void> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `save-private-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Saving private document ${id}...`);

    // Step 1: Validate inputs
    if (!id || !fileName || !base64Data || !privateReason) {
      throw new SupabaseServiceError(
        "Missing required parameters for private document",
        "INVALID_INPUT",
        false
      );
    }

    const base64Validation = validateBase64Data(base64Data);
    if (!base64Validation.valid) {
      throw new SupabaseServiceError(
        `Invalid base64 data: ${base64Validation.errors?.join(", ")}`,
        "INVALID_INPUT",
        false
      );
    }

    const mimeTypeValidation = validateMimeType(fileType);
    if (!mimeTypeValidation.valid) {
      throw new SupabaseServiceError(
        `Invalid MIME type: ${mimeTypeValidation.errors?.join(", ")}`,
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Check file size
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    if (sizeInBytes > CONFIG.maxUploadSize) {
      throw new SupabaseServiceError(
        `File too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds ${CONFIG.maxUploadSize / 1024 / 1024}MB limit`,
        "FILE_TOO_LARGE",
        false
      );
    }

    // Step 3: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 4: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 5: Execute insert with timeout/retry
    const { error } = await executeWithTimeoutAndRetry(
      () => client
        .from('belege_privat')
        .insert({
          id,
          file_data: base64Data,
          file_name: fileName,
          file_type: fileType,
          vendor_name: extractedData.lieferantName || null,
          document_date: extractedData.belegDatum || null,
          total_amount: extractedData.bruttoBetrag || null,
          line_items: extractedData.lineItems || [],
          private_reason: privateReason
        }),
      "savePrivateDocument"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to save private document: ${error.message}`,
        "SAVE_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Private document saved in ${duration.toFixed(2)}ms`);

  } catch (error: any) {
    PerformanceMonitor.recordMetric("save_private_document_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      documentId: id
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to save private document',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

// --- Transformations ---

function transformSupabaseToDocument(doc: SupabaseDocument): DocumentRecord {
  // Parse line_items if it's a string (from JSON serialization)
  let parsedLineItems = doc.line_items;
  if (typeof doc.line_items === 'string') {
    try {
      parsedLineItems = JSON.parse(doc.line_items);
    } catch {
      parsedLineItems = [];
    }
  }

  return {
    id: doc.id,
    fileName: doc.file_name,
    fileType: doc.file_type,
    uploadDate: doc.created_at,
    status: doc.status as DocumentStatus,
    data: {
      // Basic fields - map from Supabase columns
      lieferantName: doc.lieferant_name || '',
      lieferantAdresse: doc.lieferant_adresse || '',
      belegDatum: doc.beleg_datum || '',
      bruttoBetrag: doc.brutto_betrag || 0,
      mwstBetrag: doc.mwst_betrag || 0,
      mwstSatz19: doc.mwst_satz || 0,
      steuerkategorie: doc.steuerkategorie || '',
      kontierungskonto: doc.skr03_konto || '',
      lineItems: parsedLineItems || [],

      // Legacy fields - derive from available data
      kontogruppe: '',
      konto_skr03: doc.skr03_konto || '',
      ust_typ: '',

      // Derived fields
      sollKonto: '',
      habenKonto: '',
      steuerKategorie: doc.steuerkategorie || '',

      // These fields were not in the original Supabase schema
      // They will be empty/missing when loading from Supabase
      belegNummerLieferant: '',
      steuernummer: '',
      nettoBetrag: 0,
      mwstSatz0: 0,
      mwstBetrag0: 0,
      mwstSatz7: 0,
      mwstBetrag7: 0,
      zahlungsmethode: '',
      eigeneBelegNummer: '',
      zahlungsDatum: '',
      zahlungsStatus: '',
      rechnungsEmpfaenger: '',
      aufbewahrungsOrt: '',
      kleinbetrag: false,
      vorsteuerabzug: false,
      reverseCharge: false,
      privatanteil: false,
      beschreibung: '',
      documentType: undefined,
      kontierungBegruendung: undefined,

      // Quality scores
      qualityScore: doc.score || undefined,
      ocr_score: doc.score || undefined,
      ocr_rationale: undefined,
      textContent: undefined,
      ruleApplied: undefined
    },
    previewUrl: `data:${doc.file_type};base64,${doc.file_data}`
  };
}

function transformDocumentToSupabase(doc: DocumentRecord): SupabaseDocument {
  const data = doc.data;
  return {
    id: doc.id,
    file_data: doc.previewUrl?.split(',')[1] || '',
    file_name: doc.fileName,
    file_type: doc.fileType,
    lieferant_name: data?.lieferantName || null,
    lieferant_adresse: data?.lieferantAdresse || null,
    beleg_datum: data?.belegDatum || null,
    brutto_betrag: data?.bruttoBetrag || null,
    mwst_betrag: data?.mwstBetrag || null,
    mwst_satz: data?.mwstSatz19 || null,
    steuerkategorie: data?.steuerkategorie || null,
    skr03_konto: data?.konto_skr03 || null,
    line_items: data?.lineItems || null,
    status: doc.status,
    score: data?.ocr_score || null,
    created_at: doc.uploadDate
  };
}

// --- Vendor Rules (Memory System) ---

/**
 * Get vendor rule from Supabase
 * @returns undefined if not found or error occurs
 */
export const getVendorRule = async (vendorName: string): Promise<{ accountId?: string; taxCategoryValue?: string } | undefined> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `get-vendor-rule-${Date.now()}`;

  try {
    if (!vendorName || vendorName.length < 2) return undefined;

    // Step 1: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      console.warn(`⚠️  Rate limit exceeded for getVendorRule`);
      return undefined;
    }

    // Step 2: Initialize client
    const client = initSupabase();
    if (!client) return undefined;

    // Step 3: Execute query with timeout/retry
    const { data, error } = await executeWithTimeoutAndRetry(
      () => client
        .from('vendor_rules')
        .select('account_id, tax_category_value')
        .eq('vendor_name', vendorName.toLowerCase().trim())
        .single(),
      "getVendorRule"
    );

    if (error || !data) {
      return undefined;
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Vendor rule found in ${duration.toFixed(2)}ms`);

    return {
      accountId: data.account_id,
      taxCategoryValue: data.tax_category_value
    };

  } catch (error: any) {
    PerformanceMonitor.recordMetric("get_vendor_rule_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      vendorName
    });
    return undefined;
  }
};

/**
 * Save vendor rule to Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const saveVendorRule = async (vendorName: string, accountId: string, taxCategoryValue: string): Promise<void> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `save-vendor-rule-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Saving vendor rule for "${vendorName}"...`);

    // Step 1: Validate inputs
    if (!vendorName || vendorName.length < 2) {
      throw new SupabaseServiceError(
        "Vendor name too short",
        "INVALID_INPUT",
        false
      );
    }

    if (!accountId || !taxCategoryValue) {
      throw new SupabaseServiceError(
        "Missing required parameters",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    const normalizedName = vendorName.toLowerCase().trim();

    // Step 4: Get existing count to increment
    const { data: existing } = await executeWithTimeoutAndRetry(
      () => client
        .from('vendor_rules')
        .select('use_count')
        .eq('vendor_name', normalizedName)
        .single(),
      "getVendorRuleCount"
    );

    const useCount = (existing?.use_count || 0) + 1;

    // Step 5: Upsert rule with timeout/retry
    const { error } = await executeWithTimeoutAndRetry(
      () => client
        .from('vendor_rules')
        .upsert({
          vendor_name: normalizedName,
          account_id: accountId,
          tax_category_value: taxCategoryValue,
          use_count: useCount,
          last_updated: new Date().toISOString()
        }, { onConflict: 'vendor_name' }),
      "saveVendorRule"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to save vendor rule: ${error.message}`,
        "SAVE_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Vendor rule saved in ${duration.toFixed(2)}ms`);

  } catch (error: any) {
    PerformanceMonitor.recordMetric("save_vendor_rule_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      vendorName
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to save vendor rule',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

// --- Settings Operations ---

interface SupabaseSettings {
  id: string;
  settings_data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get settings from Supabase with fallback
 * @throws SupabaseServiceError if operation fails
 */
export const getSettings = async (): Promise<AppSettings> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `get-settings-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Fetching settings...`);

    // Step 1: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 2: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 3: Execute query with timeout/retry
    const { data, error } = await executeWithTimeoutAndRetry(
      () => client
        .from('app_settings')
        .select('settings_data')
        .eq('id', 'global')
        .single(),
      "getSettings"
    );

    if (error || !data) {
      console.log(`⚠️  [${operationId}] Settings not found, returning defaults`);
      return getDefaultSettings();
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Settings fetched in ${duration.toFixed(2)}ms`);

    return data.settings_data as AppSettings;

  } catch (error: any) {
    PerformanceMonitor.recordMetric("get_settings_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof SupabaseServiceError) {
      // Return defaults on error
      return getDefaultSettings();
    }

    // Return defaults on any error
    return getDefaultSettings();
  }
};

/**
 * Save settings to Supabase
 * @throws SupabaseServiceError if operation fails
 */
export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `save-settings-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Saving settings...`);

    // Step 1: Validate input
    if (!settings || typeof settings !== 'object') {
      throw new SupabaseServiceError(
        "Invalid settings object",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Check rate limit
    const rateCheck = await apiRateLimiter.check(operationId);
    if (!rateCheck.allowed) {
      throw new SupabaseServiceError(
        `Rate limit exceeded. Retry after ${rateCheck.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }

    // Step 3: Initialize client
    const client = initSupabase();
    if (!client) {
      throw new SupabaseServiceError(
        "Supabase not configured",
        "NOT_CONFIGURED",
        false
      );
    }

    // Step 4: Execute upsert with timeout/retry
    const { error } = await executeWithTimeoutAndRetry(
      () => client
        .from('app_settings')
        .upsert({
          id: 'global',
          settings_data: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }),
      "saveSettings"
    );

    if (error) {
      throw new SupabaseServiceError(
        `Failed to save settings: ${error.message}`,
        "SAVE_FAILED",
        false,
        error
      );
    }

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Settings saved in ${duration.toFixed(2)}ms`);

  } catch (error: any) {
    PerformanceMonitor.recordMetric("save_settings_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to save settings',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

// --- Helper: Get Default Settings (for migration/fallback) ---

const DEFAULT_TAX_DEFINITIONS = [
  { value: "19_pv", label: "19% Vorsteuer", ust_satz: 0.19, vorsteuer: true },
  { value: "7_pv", label: "7% Vorsteuer", ust_satz: 0.07, vorsteuer: true },
  { value: "0_pv", label: "0% PV (Steuerfrei)", ust_satz: 0.00, vorsteuer: true },
  { value: "0_igl_rc", label: "0% IGL / Reverse Charge", ust_satz: 0.00, vorsteuer: false, reverse_charge: true },
  { value: "steuerfrei_kn", label: "Steuerfrei (Kleinunternehmer)", ust_satz: 0.00, vorsteuer: false },
  { value: "keine_pv", label: "Keine Vorsteuer (Privatanteil)", ust_satz: 0.00, vorsteuer: false }
];

const DEFAULT_ACCOUNT_DEFINITIONS = [
  { id: "wareneingang", name: "Wareneingang / Material", skr03: "3400", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "fremdleistung", name: "Fremdleistungen", skr03: "3100", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "buero", name: "Büromaterial", skr03: "4930", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "reise", name: "Reisekosten", skr03: "4670", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "vertretung", name: "Vertretungskosten", skr03: "4610", steuerkategorien: ["19_pv"] },
  { id: "software", name: "Software/Lizenzen", skr03: "4964", steuerkategorien: ["19_pv"] },
  { id: "internet", name: "Internet/Telefon", skr03: "4920", steuerkategorien: ["19_pv"] },
  { id: "makler", name: "Maklerprovisionen", skr03: "4760", steuerkategorien: ["19_pv", "0_igl_rc"] },
  { id: "abschreibung", name: "Abschreibungen", skr03: "4830", steuerkategorien: ["19_pv"] },
  { id: "fuhrpark", name: "Fuhrpark/Kraftstoff", skr03: "4530", steuerkategorien: ["19_pv"] },
  { id: "maschinen", name: "Maschinen/Anlagen", skr03: "0200", steuerkategorien: ["19_pv"] },
  { id: "werbung", name: "Werbung", skr03: "4600", steuerkategorien: ["19_pv"] },
  { id: "miete", name: "Miete/Pachten", skr03: "4210", steuerkategorien: ["19_pv"] },
  { id: "reparatur", name: "Reparatur/Wartung", skr03: "4800", steuerkategorien: ["19_pv"] },
  { id: "beratung", name: "Beratung/Steuerberater", skr03: "4950", steuerkategorien: ["19_pv"] },
  { id: "versicherung", name: "Versicherungen", skr03: "4360", steuerkategorien: ["19_pv"] },
  { id: "strom", name: "Strom/Gas/Wasser", skr03: "4240", steuerkategorien: ["19_pv"] },
  { id: "ausbildung", name: "Fortbildung", skr03: "4945", steuerkategorien: ["19_pv"] },
  { id: "portokosten", name: "Porto/Versand", skr03: "4910", steuerkategorien: ["19_pv"] },
  { id: "sonstiges", name: "Sonstige Betriebsausgaben", skr03: "4900", steuerkategorien: ["19_pv", "7_pv"] },
  { id: "privat", name: "Privatanteil", skr03: "1800", steuerkategorien: ["keine_pv"] }
];

const DEFAULT_DATEV_CONFIG = {
  beraterNr: '',
  mandantNr: '',
  wirtschaftsjahrBeginn: `${new Date().getFullYear()}0101`,
  sachkontenlaenge: 4,
  waehrung: 'EUR',
  herkunftKz: 'RE',
  diktatkuerzel: '',
  stapelBezeichnung: 'Buchungsstapel',
  taxCategoryToBuKey: {
    '19_pv': '9',
    '7_pv': '8',
    '0_pv': '0',
    'steuerfrei_kn': '0',
    'keine_pv': '0',
    '0_igl_rc': ''
  }
};

const DEFAULT_ELSTER_STAMMDATEN = {
  unternehmensName: '',
  land: 'DE',
  plz: '',
  ort: '',
  strasse: '',
  hausnummer: '',
  eigeneSteuernummer: '',
  eigeneUstIdNr: '',
  finanzamtName: '',
  finanzamtNr: '',
  rechtsform: undefined,
  besteuerungUst: 'unbekannt',
  kleinunternehmer: false,
  iban: '',
  kontaktEmail: '',
};

const getDefaultSettings = (): AppSettings => ({
  id: 'global',
  taxDefinitions: DEFAULT_TAX_DEFINITIONS,
  accountDefinitions: DEFAULT_ACCOUNT_DEFINITIONS,
  datevConfig: DEFAULT_DATEV_CONFIG,
  elsterStammdaten: DEFAULT_ELSTER_STAMMDATEN,
  accountGroups: [],
  ocrConfig: {
    scores: {
      "0": { min_fields: 0, desc: "Kein gültiger Beleg" },
      "5": { min_fields: 4, desc: "Basisdaten vorhanden" },
      "10": { min_fields: 7, desc: "Perfekt erkannt" }
    },
    required_fields: ["belegDatum", "bruttoBetrag", "lieferantName"],
    field_weights: { bruttoBetrag: 3, belegDatum: 3, lieferantName: 2, belegNummerLieferant: 2 },
    regex_patterns: { belegDatum: "\\d{4}-\\d{2}-\\d{2}" },
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.8 }
  }
});

// --- SQL Export ---

/**
 * Export documents to SQL format
 * @throws SupabaseServiceError if operation fails
 */
export const exportDocumentsToSQL = (docs: DocumentRecord[], settings?: AppSettings): string => {
  const startTime = PerformanceMonitor.now();
  const operationId = `export-sql-${Date.now()}`;

  try {
    console.log(`📋 [${operationId}] Exporting ${docs.length} documents to SQL...`);

    // Step 1: Validate inputs
    if (!Array.isArray(docs)) {
      throw new SupabaseServiceError(
        "Invalid documents array",
        "INVALID_INPUT",
        false
      );
    }

    // Step 2: Validate inputs
    if (!Array.isArray(docs)) {
      throw new SupabaseServiceError(
        "Invalid documents array",
        "INVALID_INPUT",
        false
      );
    }

    const timestamp = new Date().toISOString();

    const safeText = (v: unknown) => {
      if (v === null || v === undefined) return 'NULL';
      const s = String(v);
      if (s.trim().length === 0) return 'NULL';
      return `'${s.replace(/'/g, "''")}'`;
    };
    const safeNum = (v: unknown) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : 'NULL';
    };
    const safeBool = (v: unknown) => {
      if (v === true || v === 'true' || v === 1) return 'TRUE';
      if (v === false || v === 'false' || v === 0) return 'FALSE';
      return 'NULL';
    };
    const safeDate = (dateStr: unknown) => {
      const s = dateStr === null || dateStr === undefined ? '' : String(dateStr);
      return /^\\d{4}-\\d{2}-\\d{2}$/.test(s) ? `'${s}'` : 'NULL';
    };

    let sql = `-- ZOE Solar Accounting Export\\n-- Generated: ${timestamp}\\n\\n`;

    // 1. Tables Definition
    sql += `
CREATE TABLE IF NOT EXISTS steuerkategorien (
  id SERIAL PRIMARY KEY,
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100),
  ust_satz NUMERIC(5,4),
  vorsteuer BOOLEAN DEFAULT TRUE,
  reverse_charge BOOLEAN DEFAULT FALSE
);\\n`;

    sql += `
CREATE TABLE IF NOT EXISTS kontierungskonten (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  skr03 VARCHAR(10),
  allowed_tax_categories TEXT[]
);\\n`;

    sql += `
CREATE TABLE IF NOT EXISTS elster_stammdaten (
  id VARCHAR(20) PRIMARY KEY,
  unternehmens_name TEXT,
  land VARCHAR(10),
  plz VARCHAR(20),
  ort TEXT,
  strasse TEXT,
  hausnummer TEXT,
  eigene_steuernummer TEXT,
  eigene_steuernummer_digits TEXT,
  eigene_ust_idnr TEXT,
  finanzamt_name TEXT,
  finanzamt_nr TEXT,
  rechtsform TEXT,
  besteuerung_ust TEXT,
  kleinunternehmer BOOLEAN,
  iban TEXT,
  kontakt_email TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);\\n`;

    sql += `
CREATE TABLE IF NOT EXISTS belege (
    id UUID PRIMARY KEY,
    document_type VARCHAR(100),
    datum DATE,
    belegnummer_lieferant VARCHAR(255),
    eigene_beleg_nummer VARCHAR(255),
    lieferant VARCHAR(255),
    lieferant_adresse TEXT,
    steuernummer VARCHAR(100),
    zahlungsmethode VARCHAR(100),
    zahlungs_datum DATE,
    zahlungs_status VARCHAR(50),
    rechnungs_empfaenger VARCHAR(255),
    aufbewahrungs_ort VARCHAR(255),
    betrag DECIMAL(10,2),
    netto_betrag DECIMAL(10,2),
    mwst_satz_0 NUMERIC(5,4),
    mwst_betrag_0 DECIMAL(10,2),
    mwst_satz_7 NUMERIC(5,4),
    mwst_betrag_7 DECIMAL(10,2),
    mwst_satz_19 NUMERIC(5,4),
    mwst_betrag_19 DECIMAL(10,2),
    steuerkategorie VARCHAR(50),
    kontierungskonto VARCHAR(50),
    soll_konto VARCHAR(10),
    haben_konto VARCHAR(10),
    konto_ust_satz NUMERIC(5,4),
    kontogruppe VARCHAR(100),
    konto_skr03 VARCHAR(10),
    ust_typ VARCHAR(50),
    steuer_kategorie_legacy VARCHAR(100),
    reverse_charge BOOLEAN,
    vorsteuerabzug BOOLEAN,
    kleinbetrag BOOLEAN,
    privatanteil BOOLEAN,
    ocr_score INTEGER,
    ocr_rationale TEXT,
    ocr_text TEXT,
    text_content TEXT,
    beschreibung TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);\\n\\n`;

    sql += `
CREATE TABLE IF NOT EXISTS beleg_positionen (
    doc_id UUID NOT NULL REFERENCES belege(id) ON DELETE CASCADE,
    line_index INTEGER NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (doc_id, line_index)
);\\n\\n`;

    // 2. Insert Config Data
    DEFAULT_TAX_DEFINITIONS.forEach(t => {
        sql += `INSERT INTO steuerkategorien (value, label, ust_satz, vorsteuer, reverse_charge) VALUES ('${t.value}', '${t.label}', ${t.ust_satz}, ${t.vorsteuer}, ${t.reverse_charge || false}) ON CONFLICT (value) DO NOTHING;\\n`;
    });
    DEFAULT_ACCOUNT_DEFINITIONS.forEach(a => {
        sql += `INSERT INTO kontierungskonten (id, name, skr03, allowed_tax_categories) VALUES ('${a.id}', '${a.name}', '${a.skr03}', ARRAY['${a.steuerkategorien.join("','")}']) ON CONFLICT (id) DO NOTHING;\\n`;
    });

    sql += "\\n-- Data Insertion\\n";

    // ELSTER Stammdaten (Settings)
    const elster = settings?.elsterStammdaten;
    const elsterDigits = (elster?.eigeneSteuernummer || '').replace(/\\D/g, '');
    sql += `INSERT INTO elster_stammdaten (
  id, unternehmens_name, land, plz, ort, strasse, hausnummer,
  eigene_steuernummer, eigene_steuernummer_digits, eigene_ust_idnr,
  finanzamt_name, finanzamt_nr, rechtsform, besteuerung_ust,
  kleinunternehmer, iban, kontakt_email, updated_at
) VALUES (
  'global',
  ${safeText(elster?.unternehmensName)},
  ${safeText(elster?.land)},
  ${safeText(elster?.plz)},
  ${safeText(elster?.ort)},
  ${safeText(elster?.strasse)},
  ${safeText(elster?.hausnummer)},
  ${safeText(elster?.eigeneSteuernummer)},
  ${safeText(elsterDigits)},
  ${safeText(elster?.eigeneUstIdNr)},
  ${safeText(elster?.finanzamtName)},
  ${safeText(elster?.finanzamtNr)},
  ${safeText(elster?.rechtsform)},
  ${safeText(elster?.besteuerungUst)},
  ${safeBool(elster?.kleinunternehmer)},
  ${safeText(elster?.iban)},
  ${safeText(elster?.kontaktEmail)},
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  unternehmens_name = EXCLUDED.unternehmens_name,
  updated_at = NOW();\\n\\n`;

    docs.forEach(doc => {
        const d = doc.data || {} as any;

        sql += `INSERT INTO belege (
    id, document_type, datum, belegnummer_lieferant, eigene_beleg_nummer,
    lieferant, lieferant_adresse, steuernummer,
    zahlungsmethode, zahlungs_datum, zahlungs_status, rechnungs_empfaenger, aufbewahrungs_ort,
    betrag, netto_betrag,
    mwst_satz_0, mwst_betrag_0, mwst_satz_7, mwst_betrag_7, mwst_satz_19, mwst_betrag_19,
    steuerkategorie, kontierungskonto, soll_konto, haben_konto,
    kontogruppe, konto_skr03, ust_typ, steuer_kategorie_legacy,
    reverse_charge, vorsteuerabzug, kleinbetrag, privatanteil,
    ocr_score, ocr_rationale, ocr_text, text_content, beschreibung, status
) VALUES (
    '${doc.id}',
    ${safeText(d.documentType)},
    ${safeDate(d.belegDatum)},
    ${safeText(d.belegNummerLieferant)},
    ${safeText(d.eigeneBelegNummer)},
    ${safeText(d.lieferantName)},
    ${safeText(d.lieferantAdresse)},
    ${safeText(d.steuernummer)},
    ${safeText(d.zahlungsmethode)},
    ${safeDate(d.zahlungsDatum)},
    ${safeText(d.zahlungsStatus)},
    ${safeText(d.rechnungsEmpfaenger)},
    ${safeText(d.aufbewahrungsOrt)},
    ${safeNum(d.bruttoBetrag)},
    ${safeNum(d.nettoBetrag)},
    ${safeNum(d.mwstSatz0)},
    ${safeNum(d.mwstBetrag0)},
    ${safeNum(d.mwstSatz7)},
    ${safeNum(d.mwstBetrag7)},
    ${safeNum(d.mwstSatz19)},
    ${safeNum(d.mwstBetrag19)},
    ${safeText(d.steuerkategorie)},
    ${safeText(d.kontierungskonto)},
    ${safeText(d.sollKonto)},
    ${safeText(d.habenKonto)},
    ${safeText(d.kontogruppe)},
    ${safeText(d.konto_skr03)},
    ${safeText(d.ust_typ)},
    ${safeText(d.steuerKategorie)},
    ${safeBool(d.reverseCharge)},
    ${safeBool(d.vorsteuerabzug)},
    ${safeBool(d.kleinbetrag)},
    ${safeBool(d.privatanteil)},
    ${safeNum(d.ocr_score)},
    ${safeText(d.ocr_rationale)},
    ${safeText(d.textContent || '')},
    ${safeText(d.textContent || '')},
    ${safeText(d.beschreibung || '')},
    ${safeText(doc.status)}
);\\n`;

        const items = (d.lineItems || []) as any[];
        items.forEach((it, idx) => {
          sql += `INSERT INTO beleg_positionen (doc_id, line_index, description, amount) VALUES (
    '${doc.id}',
    ${idx},
    ${safeText(it?.description)},
    ${safeNum(it?.amount)}
  ) ON CONFLICT (doc_id, line_index) DO UPDATE SET
    description = EXCLUDED.description,
    amount = EXCLUDED.amount;\\n`;
        });
    });

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] SQL export completed in ${duration.toFixed(2)}ms (${sql.length} bytes)`);

    return sql;

  } catch (error: any) {
    PerformanceMonitor.recordMetric("export_sql_failure", {
      operationId,
      duration: PerformanceMonitor.now() - startTime,
      error: error.message,
      errorCode: error.code || "UNKNOWN",
      docCount: docs?.length || 0
    });

    if (error instanceof SupabaseServiceError) throw error;
    throw new SupabaseServiceError(
      error.message || 'Failed to export to SQL',
      "UNKNOWN_ERROR",
      false,
      error
    );
  }
};

// --- Health Check ---

/**
 * Health check for Supabase service
 */
export async function checkSupabaseServiceHealth(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if configured
    if (!isSupabaseConfigured()) {
      return {
        healthy: false,
        message: "Supabase not configured"
      };
    }

    // Check rate limiter
    const rateCheck = await apiRateLimiter.check("health-check");
    if (!rateCheck.allowed) {
      return {
        healthy: false,
        message: "Rate limit exceeded",
        details: { retryAfter: rateCheck.retryAfter }
      };
    }

    // Try to initialize client
    const client = initSupabase();
    if (!client) {
      return {
        healthy: false,
        message: "Failed to initialize client"
      };
    }

    return {
      healthy: true,
      message: "Service operational"
    };

  } catch (error) {
    return {
      healthy: false,
      message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// --- Export Service Object ---

/**
 * Export for testing and debugging
 */
export const supabaseService = {
  initSupabase,
  isSupabaseConfigured,
  checkSupabaseServiceHealth,
  // Auth
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  // Documents
  getAllDocuments,
  getDocumentsPaginated,
  saveDocument,
  deleteDocument,
  savePrivateDocument,
  // Settings
  getSettings,
  saveSettings,
  // Vendor Rules
  getVendorRule,
  saveVendorRule,
  // Export
  exportDocumentsToSQL,
  // Default settings
  getDefaultSettings,
  // Config
  CONFIG
};
