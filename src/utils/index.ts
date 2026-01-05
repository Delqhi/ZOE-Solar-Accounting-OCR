/**
 * ZOE Solar Accounting OCR - Utility Index
 * Centralized exports for all utility functions
 */

// Environment & Security
export {
  validateEnvironment,
  getSanitizedConfig,
  logConfigStatus,
} from './environmentValidator';

export type {
  EnvironmentValidationResult,
  EnvironmentConfig,
  GitLabConfig,
} from './environmentValidator';

export { SecurityHeaders } from './securityHeaders';

export { PerformanceMonitor, perf } from './performanceMonitor';
export type { PerformanceMetrics } from './performanceMonitor';

// Validation
export {
  validateFiles,
  validateText,
  validateEmail,
  validateApiKey,
  sanitizeText,
  sanitizeFilename,
  validateDocumentData,
  validateRateLimitData,
  validatePagination,
  validateDate,
  validateAmount,
  validateOCRResult,
  validateBatch,
} from './validation';

export type { ValidationResult, FileValidationOptions } from './validation';

// Rate Limiting
export {
  RateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  ocrRateLimiter,
  authRateLimiter,
  exportRateLimiter,
  createRateLimitMiddleware,
  checkClientRateLimit,
  getRateLimitStats,
  resetAllRateLimits,
} from './rateLimiter';

export type { RateLimitConfig, RateLimitResult } from './rateLimiter';

/**
 * Utility Functions
 */

/**
 * Sleep/delay helper
 */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate UUID v4
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString();
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(key: string, required: boolean = false): string | undefined {
  const value = import.meta.env[key];
  if (required && !value) {
    throw new Error(`Required environment variable missing: ${key}`);
  }
  return value;
}

/**
 * Log with prefix
 */
export function log(prefix: string, ...args: any[]): void {
  console.log(`[${prefix}]`, ...args);
}

/**
 * Log warning with prefix
 */
export function warn(prefix: string, ...args: any[]): void {
  console.warn(`[${prefix}]`, ...args);
}

/**
 * Log error with prefix
 */
export function error(prefix: string, ...args: any[]): void {
  console.error(`[${prefix}]`, ...args);
}

/**
 * Create a memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === bVal) return 0;

    const comparison = aVal > bVal ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter unique values
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Wait for condition to be true
 */
export function waitFor(condition: () => boolean, timeout: number = 10000, interval: number = 100): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Stringify JSON safely
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert string to boolean
 */
export function toBoolean(value: string | boolean | number): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Generate random string
 */
export function randomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate hash (simple string hash)
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Get current timestamp
 */
export function timestamp(): number {
  return Date.now();
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('de-DE');
}

/**
 * Check if value is a number
 */
export function isNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Parse number safely
 */
export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Get nested object property safely
 */
export function getNestedValue(obj: any, path: string, fallback?: any): any {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj) ?? fallback;
}

/**
 * Set nested object property safely
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((acc, key) => {
    if (!(key in acc)) acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
}

/**
 * Merge objects deeply
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Wait for DOM to be ready
 */
export function waitForDOM(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    }
  });
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: Element, offset: number = 0): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight + offset || document.documentElement.clientHeight + offset) &&
    rect.right <= (window.innerWidth + offset || document.documentElement.clientWidth + offset)
  );
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(selector: string, behavior: ScrollBehavior = 'smooth'): void {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' });
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get file from event
 */
export function getFilesFromEvent(event: React.ChangeEvent<HTMLInputElement>): FileList | null {
  return event.target.files;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(part: number, total: number, decimals: number = 2): string {
  return calculatePercentage(part, total).toFixed(decimals) + '%';
}

/**
 * Check if value is email
 */
export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if value is phone number (German format)
 */
export function isPhoneNumber(value: string): boolean {
  const phoneRegex = /^(\+49|0049|0)?[1-9]\d{1,14}$/;
  return phoneRegex.test(value.replace(/\s/g, ''));
}

/**
 * Normalize phone number
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\s/g, '').replace(/^\+49/, '0').replace(/^0049/, '0');
}

/**
 * Check if value is IBAN (German)
 */
export function isIBAN(value: string): boolean {
  const ibanRegex = /^DE\d{20}$/;
  return ibanRegex.test(value.toUpperCase().replace(/\s/g, ''));
}

/**
 * Normalize IBAN
 */
export function normalizeIBAN(iban: string): string {
  return iban.toUpperCase().replace(/\s/g, '');
}

/**
 * Format IBAN with spaces
 */
export function formatIBAN(iban: string): string {
  const normalized = normalizeIBAN(iban);
  return normalized.match(/.{1,4}/g)?.join(' ') || normalized;
}

/**
 * Check if value is VAT number (German)
 */
export function isVATNumber(value: string): boolean {
  const vatRegex = /^DE\d{9}$/;
  return vatRegex.test(value.toUpperCase().replace(/\s/g, ''));
}

/**
 * Normalize VAT number
 */
export function normalizeVATNumber(vat: string): string {
  return vat.toUpperCase().replace(/\s/g, '').replace(/^DE/, 'DE');
}

/**
 * Check if value is date string (YYYY-MM-DD)
 */
export function isDateString(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(value);
}

/**
 * Parse date string to Date object
 */
export function parseDateString(value: string): Date | null {
  if (!isDateString(value)) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date to YYYY-MM-DD
 */
export function toDateString(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if date is valid
 */
export function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

/**
 * Add days to date
 */
export function addDays(date: Date | string | number, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Difference in days between two dates
 */
export function diffDays(date1: Date | string | number, date2: Date | string | number): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are same day
 */
export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if date is between two dates (inclusive)
 */
export function isBetweenDates(date: Date | string | number, start: Date | string | number, end: Date | string | number): boolean {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return d >= s && d <= e;
}

/**
 * Get current financial year (Germany: previous year if after October)
 */
export function getCurrentFinancialYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // In Germany, financial year typically ends on Dec 31
  // But for tax purposes, often uses previous year if after October
  return month >= 9 ? year - 1 : year;
}

/**
 * Format German date (DD.MM.YYYY)
 */
export function formatGermanDate(date: Date | string | number): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Parse German date (DD.MM.YYYY)
 */
export function parseGermanDate(dateStr: string): Date | null {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);
  return isValidDate(date) ? date : null;
}

/**
 * Format German number (with comma as decimal separator)
 */
export function formatGermanNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace('.', ',');
}

/**
 * Parse German number (with comma as decimal separator)
 */
export function parseGermanNumber(str: string): number {
  return Number(str.replace(',', '.'));
}

/**
 * Format German currency (EUR)
 */
export function formatGermanCurrency(amount: number): string {
  return formatGermanNumber(amount, 2) + ' €';
}

/**
 * Check if string is German date format
 */
export function isGermanDateString(value: string): boolean {
  const regex = /^\d{2}\.\d{2}\.\d{4}$/;
  return regex.test(value);
}

/**
 * Get month name in German
 */
export function getMonthNameGerman(month: number): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month] || '';
}

/**
 * Get weekday name in German
 */
export function getWeekdayGerman(date: Date | string | number): string {
  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return weekdays[new Date(date).getDay()];
}

/**
 * Check if string contains German umlauts
 */
export function hasGermanUmlauts(str: string): boolean {
  return /[äöüÄÖÜß]/.test(str);
}

/**
 * Normalize German umlauts (for search)
 */
export function normalizeGermanText(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE');
}

/**
 * Check if string is valid German tax number format
 */
export function isGermanTaxNumber(value: string): boolean {
  // Format: 12/345/67890 or similar
  const regex = /^\d{2,}\/\d{3,}\/\d{5,}$/;
  return regex.test(value);
}

/**
 * Normalize German tax number
 */
export function normalizeGermanTaxNumber(tax: string): string {
  return tax.replace(/\s/g, '');
}

/**
 * Check if string is valid German VAT ID format
 */
export function isGermanVATId(value: string): boolean {
  // DE followed by 9 digits
  const regex = /^DE\d{9}$/;
  return regex.test(value.toUpperCase().replace(/\s/g, ''));
}

/**
 * Normalize German VAT ID
 */
export function normalizeGermanVATId(vat: string): string {
  return vat.toUpperCase().replace(/\s/g, '').replace(/^DE/, 'DE');
}

/**
 * Check if string is valid German postal code
 */
export function isGermanPostalCode(value: string): boolean {
  const regex = /^\d{5}$/;
  return regex.test(value);
}

/**
 * Check if string is valid German phone number
 */
export function isGermanPhone(value: string): boolean {
  const regex = /^(\+49|0049|0)[1-9]\d{1,14}$/;
  return regex.test(value.replace(/\s/g, ''));
}

/**
 * Normalize German phone number
 */
export function normalizeGermanPhone(phone: string): string {
  return phone
    .replace(/\s/g, '')
    .replace(/^\+49/, '0')
    .replace(/^0049/, '0');
}

/**
 * Format German phone number with spaces
 */
export function formatGermanPhone(phone: string): string {
  const normalized = normalizeGermanPhone(phone);
  // Format: 0176 12345678 or 030 12345678
  if (normalized.startsWith('01')) {
    return normalized.replace(/(\d{5})(\d{3,})/, '$1 $2');
  } else {
    return normalized.replace(/(\d{3,5})(\d+)$/, '$1 $2');
  }
}

/**
 * Check if string is valid German bank account number
 */
export function isGermanAccountNumber(value: string): boolean {
  const regex = /^\d{1,10}$/;
  return regex.test(value);
}

/**
 * Check if string is valid German BLZ (Bankleitzahl)
 */
export function isGermanBLZ(value: string): boolean {
  const regex = /^\d{8}$/;
  return regex.test(value);
}

/**
 * Format German amount with comma separator and EUR symbol
 */
export function formatGermanAmount(amount: number): string {
  return formatGermanNumber(amount, 2) + ' €';
}

/**
 * Parse German amount (handles "1.234,56 €" or "1234,56" or "1.234,56")
 */
export function parseGermanAmount(str: string): number {
  // Remove currency symbol and whitespace
  const cleaned = str.replace(/[€\s]/g, '');
  // Remove thousand separators (dots)
  const withoutThousands = cleaned.replace(/\./g, '');
  // Replace comma with dot for parseFloat
  const normalized = withoutThousands.replace(',', '.');
  return parseFloat(normalized);
}

/**
 * Check if string is valid German date format (DD.MM.YYYY)
 */
export function isValidGermanDate(value: string): boolean {
  return isGermanDateString(value);
}

/**
 * Parse German date string to Date object
 */
export function parseGermanDateString(value: string): Date | null {
  if (!isValidGermanDate(value)) return null;
  const [day, month, year] = value.split('.').map(Number);
  const date = new Date(year, month - 1, day);
  return isValidDate(date) ? date : null;
}

/**
 * Format Date to German date string (DD.MM.YYYY)
 */
export function toGermanDateString(date: Date | string | number): string {
  return formatGermanDate(date);
}

/**
 * Check if string is valid German time format (HH:MM)
 */
export function isValidGermanTime(value: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(value);
}

/**
 * Format German datetime (DD.MM.YYYY HH:MM)
 */
export function formatGermanDateTime(date: Date | string | number): string {
  const d = new Date(date);
  const dateStr = formatGermanDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Parse German datetime string
 */
export function parseGermanDateTime(value: string): Date | null {
  const parts = value.split(' ');
  if (parts.length !== 2) return null;

  const date = parseGermanDate(parts[0]);
  const time = parts[1];

  if (!date || !isValidGermanTime(time)) return null;

  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

/**
 * Check if string is valid German currency format
 */
export function isValidGermanCurrency(value: string): boolean {
  // Matches: 1234,56 €, 1.234,56 €, 1234,56€, etc.
  const regex = /^[\d.]+,\d{2}\s*€?$/;
  return regex.test(value);
}

/**
 * Format number as German percentage
 */
export function formatGermanPercentage(value: number, decimals: number = 2): string {
  return formatGermanNumber(value, decimals) + ' %';
}

/**
 * Parse German percentage string
 */
export function parseGermanPercentage(value: string): number {
  return parseGermanNumber(value.replace('%', '').trim());
}

/**
 * Check if string is valid German IBAN
 */
export function isValidGermanIBAN(value: string): boolean {
  const normalized = normalizeIBAN(value);
  return normalized.startsWith('DE') && normalized.length === 22;
}

/**
 * Format German IBAN with spaces
 */
export function formatGermanIBAN(iban: string): string {
  return formatIBAN(iban);
}

/**
 * Check if string is valid German BIC
 */
export function isValidGermanBIC(value: string): boolean {
  const regex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return regex.test(value.toUpperCase());
}

/**
 * Normalize German text for search (remove umlauts, lowercase)
 */
export function normalizeForSearch(text: string): string {
  return normalizeGermanText(text);
}

/**
 * Check if string contains only German letters (including umlauts)
 */
export function isGermanAlphabetic(value: string): boolean {
  return /^[a-zA-ZäöüÄÖÜß\s\-]+$/.test(value);
}

/**
 * Check if string contains only German alphanumeric characters
 */
export function isGermanAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9äöüÄÖÜß\s\-]+$/.test(value);
}

/**
 * Extract numbers from German text
 */
export function extractNumbersFromGerman(text: string): number[] {
  const matches = text.match(/[\d.]+,\d{2}|[\d,]+/g);
  if (!matches) return [];

  return matches.map(parseGermanAmount).filter(n => !isNaN(n));
}

/**
 * Extract dates from German text
 */
export function extractDatesFromGerman(text: string): Date[] {
  const matches = text.match(/\d{2}\.\d{2}\.\d{4}/g);
  if (!matches) return [];

  return matches
    .map(parseGermanDate)
    .filter((d): d is Date => d !== null);
}

/**
 * Extract IBANs from text
 */
export function extractIBANs(text: string): string[] {
  const matches = text.match(/DE\d{20}/g);
  return matches ? matches.map(normalizeIBAN) : [];
}

/**
 * Extract VAT IDs from text
 */
export function extractVATIds(text: string): string[] {
  const matches = text.match(/DE\d{9}/g);
  return matches ? matches.map(normalizeVATId) : [];
}

/**
 * Extract postal codes from text
 */
export function extractPostalCodes(text: string): string[] {
  const matches = text.match(/\b\d{5}\b/g);
  return matches || [];
}

/**
 * Extract phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  const matches = text.match(/(\+49|0049|0)[1-9]\d{1,14}/g);
  return matches ? matches.map(normalizeGermanPhone) : [];
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const matches = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g);
  return matches || [];
}

/**
 * Extract amounts from text (German format)
 */
export function extractAmounts(text: string): number[] {
  const matches = text.match(/[\d.]+,\d{2}\s*€?/g);
  if (!matches) return [];

  return matches.map(parseGermanAmount).filter(n => !isNaN(n));
}

/**
 * Extract company names from text (heuristic)
 */
export function extractCompanyNames(text: string): string[] {
  // Look for patterns like "GmbH", "AG", "KG", "e.V." followed by names
  const patterns = [
    /([A-Z][a-zA-ZäöüÄÖÜß\s\-]+(?:GmbH|AG|KG|e\.V\.|GmbH\s*&\s*Co\.|OHG))/g,
    /(AG|GmbH|KG|e\.V\.)\s+([A-Z][a-zA-ZäöüÄÖÜß\s\-]+)/g,
  ];

  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches);
    }
  }

  return results;
}

/**
 * Extract supplier names from text (heuristic)
 */
export function extractSupplierNames(text: string): string[] {
  // Look for keywords like "Lieferant", "Supplier", "Rechnung von"
  const keywords = ['lieferant', 'supplier', 'rechnung von', 'von:', 'von'];
  const lines = text.split('\n');

  const suppliers: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of keywords) {
      if (lowerLine.includes(keyword)) {
        // Extract the name after the keyword
        const index = lowerLine.indexOf(keyword);
        const namePart = line.substring(index + keyword.length).trim();
        if (namePart.length > 2) {
          suppliers.push(namePart);
        }
      }
    }
  }

  return suppliers;
}

/**
 * Extract invoice numbers from text (heuristic)
 */
export function extractInvoiceNumbers(text: string): string[] {
  // Common patterns: Rechnungsnr., Invoice No., RNr., etc.
  const patterns = [
    /Rechnungsnr\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /Invoice\s*No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /RNr\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /Rechnungsnummer\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /\b[A-Z]{2,4}\d{3,10}\b/g, // Generic pattern like AB123456
  ];

  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches.map(m => m.replace(/.*[:\-]?\s*/, '').trim()));
    }
  }

  return results;
}

/**
 * Extract order numbers from text (heuristic)
 */
export function extractOrderNumbers(text: string): string[] {
  const patterns = [
    /Bestellnummer\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /Order\s*No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /Bestellnr\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/gi,
    /\b[A-Z]{2,4}\d{3,10}\b/g,
  ];

  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches.map(m => m.replace(/.*[:\-]?\s*/, '').trim()));
    }
  }

  return results;
}

/**
 * Extract dates from text (German format)
 */
export function extractDates(text: string): string[] {
  const matches = text.match(/\d{2}\.\d{2}\.\d{4}/g);
  return matches || [];
}

/**
 * Extract amounts from text (German format with currency)
 */
export function extractAmountsFromText(text: string): string[] {
  const matches = text.match(/[\d.]+,\d{2}\s*€?/g);
  return matches || [];
}

/**
 * Extract VAT amounts from text
 */
export function extractVATAmounts(text: string): number[] {
  const vatPatterns = [
    /MwSt\.?\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /USt\.?\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Mehrwertsteuer\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /VAT\s*[:\-]?\s*([\d.]+,\d{2})/gi,
  ];

  const results: number[] = [];
  for (const pattern of vatPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const amountMatch = match.match(/[\d.]+,\d{2}/);
        if (amountMatch) {
          const amount = parseGermanAmount(amountMatch[0]);
          if (!isNaN(amount)) {
            results.push(amount);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Extract net amounts from text
 */
export function extractNetAmounts(text: string): number[] {
  const netPatterns = [
    /Netto\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /NetBetrag\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /NettoBetrag\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Net\s*[:\-]?\s*([\d.]+,\d{2})/gi,
  ];

  const results: number[] = [];
  for (const pattern of netPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const amountMatch = match.match(/[\d.]+,\d{2}/);
        if (amountMatch) {
          const amount = parseGermanAmount(amountMatch[0]);
          if (!isNaN(amount)) {
            results.push(amount);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Extract gross amounts from text
 */
export function extractGrossAmounts(text: string): number[] {
  const grossPatterns = [
    /Brutto\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Bruttobetrag\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Gesamtbetrag\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Total\s*[:\-]?\s*([\d.]+,\d{2})/gi,
    /Brut\s*[:\-]?\s*([\d.]+,\d{2})/gi,
  ];

  const results: number[] = [];
  for (const pattern of grossPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const amountMatch = match.match(/[\d.]+,\d{2}/);
        if (amountMatch) {
          const amount = parseGermanAmount(amountMatch[0]);
          if (!isNaN(amount)) {
            results.push(amount);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Extract payment terms from text (heuristic)
 */
export function extractPaymentTerms(text: string): string[] {
  const keywords = [
    'zahlungsziel',
    'zahlungsbedingungen',
    'payment terms',
    'netto',
    'tage',
    'days',
    'fällig',
  ];

  const lines = text.split('\n');
  const results: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(k => lowerLine.includes(k))) {
      results.push(line.trim());
    }
  }

  return results;
}

/**
 * Extract bank details from text (heuristic)
 */
export function extractBankDetails(text: string): string[] {
  const patterns = [
    /IBAN\s*[:\-]?\s*(DE\d{20})/gi,
    /BIC\s*[:\-]?\s*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2,3})/gi,
    /Kontonummer\s*[:\-]?\s*(\d{1,10})/gi,
    /Bankleitzahl\s*[:\-]?\s*(\d{8})/gi,
    /BLZ\s*[:\-]?\s*(\d{8})/gi,
  ];

  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches);
    }
  }

  return results;
}

/**
 * Extract contact information from text (heuristic)
 */
export function extractContactInfo(text: string): string[] {
  const results: string[] = [];

  // Emails
  const emails = extractEmails(text);
  results.push(...emails);

  // Phone numbers
  const phones = extractPhoneNumbers(text);
  results.push(...phones);

  // Addresses (simple heuristic)
  const addressPatterns = [
    /Str\.?\s*\d+/gi,
    /Straße\s*\d+/gi,
    /[\d]{5}\s+[A-Z][a-zA-ZäöüÄÖÜß\s\-]+/g, // Postal code + city
  ];

  for (const pattern of addressPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      results.push(...matches);
    }
  }

  return results;
}

/**
 * Extract VAT rates from text
 */
export function extractVATRates(text: string): number[] {
  const patterns = [
    /(\d{1,2})\s*%/g,
    /MwSt\s*[:\-]?\s*(\d{1,2})\s*%/gi,
    /USt\s*[:\-]?\s*(\d{1,2})\s*%/gi,
  ];

  const results: number[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const numMatch = match.match(/\d{1,2}/);
        if (numMatch) {
          const rate = parseInt(numMatch[0], 10);
          if (!isNaN(rate) && rate > 0 && rate < 100) {
            results.push(rate);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Extract descriptions from text (heuristic)
 */
export function extractDescriptions(text: string): string[] {
  // Look for lines that might be descriptions
  const lines = text.split('\n');
  const results: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 200) {
      // Exclude lines that look like other data
      if (
        !/\d{2}\.\d{2}\.\d{4}/.test(trimmed) && // Not a date
        !/[\d.]+,\d{2}\s*€?/.test(trimmed) && // Not an amount
        !/IBAN|BIC|Kontonummer|BLZ/i.test(trimmed) && // Not bank details
        !/Rechnung|Invoice|Bestellung|Order/i.test(trimmed) && // Not headers
        !/^\d+$/.test(trimmed) // Not just numbers
      ) {
        results.push(trimmed);
      }
    }
  }

  return results;
}

/**
 * Extract all relevant data from OCR text
 */
export function extractAllFromOCR(text: string): Record<string, any> {
  return {
    supplierNames: extractSupplierNames(text),
    invoiceNumbers: extractInvoiceNumbers(text),
    orderNumbers: extractOrderNumbers(text),
    dates: extractDates(text),
    amounts: extractAmountsFromText(text),
    vatAmounts: extractVATAmounts(text),
    netAmounts: extractNetAmounts(text),
    grossAmounts: extractGrossAmounts(text),
    vatRates: extractVATRates(text),
    ibans: extractIBANs(text),
    vatIds: extractVATIds(text),
    postalCodes: extractPostalCodes(text),
    phones: extractPhoneNumbers(text),
    emails: extractEmails(text),
    paymentTerms: extractPaymentTerms(text),
    bankDetails: extractBankDetails(text),
    contactInfo: extractContactInfo(text),
    descriptions: extractDescriptions(text),
  };
}

/**
 * Extract amounts with context (for better validation)
 */
export function extractAmountsWithContext(text: string): Array<{ amount: number; context: string }> {
  const lines = text.split('\n');
  const results: Array<{ amount: number; context: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amountMatches = line.match(/[\d.]+,\d{2}\s*€?/g);

    if (amountMatches) {
      for (const match of amountMatches) {
        const amount = parseGermanAmount(match);
        if (!isNaN(amount)) {
          // Get context from surrounding lines
          const context = [
            i > 0 ? lines[i - 1] : '',
            line,
            i < lines.length - 1 ? lines[i + 1] : '',
          ].filter(Boolean).join(' | ');

          results.push({ amount, context });
        }
      }
    }
  }

  return results;
}

/**
 * Find amounts near keywords
 */
export function findAmountsNearKeywords(text: string, keywords: string[]): Array<{ amount: number; keyword: string }> {
  const lines = text.split('\n');
  const results: Array<{ amount: number; keyword: string }> = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    for (const keyword of keywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        const amountMatch = line.match(/[\d.]+,\d{2}\s*€?/);
        if (amountMatch) {
          const amount = parseGermanAmount(amountMatch[0]);
          if (!isNaN(amount)) {
            results.push({ amount, keyword });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Validate extracted OCR data against expected fields
 */
export function validateExtractedData(data: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  if (!data.supplierNames || data.supplierNames.length === 0) {
    warnings.push('No supplier name found');
  }

  if (!data.invoiceNumbers || data.invoiceNumbers.length === 0) {
    warnings.push('No invoice number found');
  }

  if (!data.dates || data.dates.length === 0) {
    warnings.push('No dates found');
  }

  if (!data.grossAmounts || data.grossAmounts.length === 0) {
    errors.push('No gross amount found');
  }

  // Validate amounts
  if (data.grossAmounts && data.grossAmounts.length > 0) {
    const invalidAmounts = data.grossAmounts.filter((a: number) => a <= 0 || a > 1000000);
    if (invalidAmounts.length > 0) {
      errors.push('Invalid amounts found (too high or negative)');
    }
  }

  // Validate dates
  if (data.dates && data.dates.length > 0) {
    const invalidDates = data.dates.filter((d: string) => !isValidGermanDate(d));
    if (invalidDates.length > 0) {
      errors.push('Invalid date format found');
    }
  }

  // Validate IBANs
  if (data.ibans && data.ibans.length > 0) {
    const invalidIBANs = data.ibans.filter((i: string) => !isValidGermanIBAN(i));
    if (invalidIBANs.length > 0) {
      warnings.push('Invalid IBAN format found');
    }
  }

  // Validate VAT IDs
  if (data.vatIds && data.vatIds.length > 0) {
    const invalidVATIds = data.vatIds.filter((v: string) => !isGermanVATId(v));
    if (invalidVATIds.length > 0) {
      warnings.push('Invalid VAT ID format found');
    }
  }

  // Check consistency
  if (data.netAmounts && data.grossAmounts && data.vatAmounts) {
    for (let i = 0; i < Math.min(data.netAmounts.length, data.grossAmounts.length, data.vatAmounts.length); i++) {
      const net = data.netAmounts[i];
      const gross = data.grossAmounts[i];
      const vat = data.vatAmounts[i];

      // Check if net + vat ≈ gross (within 0.01 tolerance)
      if (Math.abs(net + vat - gross) > 0.01) {
        warnings.push(`Amount mismatch at position ${i}: net(${net}) + vat(${vat}) != gross(${gross})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: data,
  };
}

/**
 * Extract best guess for each field
 */
export function extractBestGuess(text: string): Record<string, any> {
  const extracted = extractAllFromOCR(text);

  // Find the most likely values
  const bestGuess: Record<string, any> = {};

  // Supplier name: take the first one or the one with most context
  if (extracted.supplierNames.length > 0) {
    bestGuess.supplierName = extracted.supplierNames[0];
  }

  // Invoice number: take the first one
  if (extracted.invoiceNumbers.length > 0) {
    bestGuess.invoiceNumber = extracted.invoiceNumbers[0];
  }

  // Order number: take the first one
  if (extracted.orderNumbers.length > 0) {
    bestGuess.orderNumber = extracted.orderNumbers[0];
  }

  // Dates: find the most recent date (likely invoice date)
  if (extracted.dates.length > 0) {
    const parsedDates = extracted.dates
      .map(parseGermanDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    if (parsedDates.length > 0) {
      bestGuess.invoiceDate = toGermanDateString(parsedDates[0]);

      // Look for due date (usually later than invoice date)
      if (parsedDates.length > 1) {
        const futureDates = parsedDates.filter(d => d > parsedDates[0]);
        if (futureDates.length > 0) {
          bestGuess.dueDate = toGermanDateString(futureDates[0]);
        }
      }
    }
  }

  // Amounts: prefer gross amount
  if (extracted.grossAmounts.length > 0) {
    // Take the largest amount as total
    bestGuess.totalAmount = Math.max(...extracted.grossAmounts);

    // If there's a net amount, take the one closest to total
    if (extracted.netAmounts.length > 0) {
      const closestNet = extracted.netAmounts
        .filter(n => n < bestGuess.totalAmount)
        .sort((a, b) => Math.abs(bestGuess.totalAmount - a) - Math.abs(bestGuess.totalAmount - b))[0];
      if (closestNet) {
        bestGuess.netAmount = closestNet;
        bestGuess.vatAmount = bestGuess.totalAmount - closestNet;
      }
    }

    // VAT rate
    if (extracted.vatRates.length > 0) {
      bestGuess.vatRate = extracted.vatRates[0];
    }
  }

  // VAT ID
  if (extracted.vatIds.length > 0) {
    bestGuess.vatId = extracted.vatIds[0];
  }

  // IBAN
  if (extracted.ibans.length > 0) {
    bestGuess.iban = extracted.ibans[0];
  }

  // BIC
  if (extracted.bankDetails.length > 0) {
    const bicMatch = extracted.bankDetails.find((d: string) => d.includes('BIC'));
    if (bicMatch) {
      const bicValue = bicMatch.match(/[A-Z]{4}[A-Z]{2}[A-Z0-9]{2,3}/);
      if (bicValue) {
        bestGuess.bic = bicValue[0];
      }
    }
  }

  // Email
  if (extracted.emails.length > 0) {
    bestGuess.email = extracted.emails[0];
  }

  // Phone
  if (extracted.phones.length > 0) {
    bestGuess.phone = extracted.phones[0];
  }

  // Description: take the first meaningful description
  if (extracted.descriptions.length > 0) {
    bestGuess.description = extracted.descriptions[0];
  }

  // Payment terms
  if (extracted.paymentTerms.length > 0) {
    bestGuess.paymentTerms = extracted.paymentTerms[0];
  }

  return bestGuess;
}

/**
 * Calculate confidence score for extracted data
 */
export function calculateConfidenceScore(extracted: Record<string, any>): number {
  let score = 0;
  let maxScore = 0;

  // Supplier name (15 points)
  maxScore += 15;
  if (extracted.supplierNames && extracted.supplierNames.length > 0) {
    score += 15;
  }

  // Invoice number (15 points)
  maxScore += 15;
  if (extracted.invoiceNumbers && extracted.invoiceNumbers.length > 0) {
    score += 15;
  }

  // Dates (15 points)
  maxScore += 15;
  if (extracted.dates && extracted.dates.length > 0) {
    score += 15;
  }

  // Amounts (20 points)
  maxScore += 20;
  if (extracted.grossAmounts && extracted.grossAmounts.length > 0) {
    score += 20;
  } else if (extracted.netAmounts && extracted.netAmounts.length > 0) {
    score += 10;
  }

  // VAT information (10 points)
  maxScore += 10;
  if (extracted.vatAmounts && extracted.vatAmounts.length > 0) {
    score += 10;
  } else if (extracted.vatRates && extracted.vatRates.length > 0) {
    score += 5;
  }

  // Bank details (10 points)
  maxScore += 10;
  if (extracted.ibans && extracted.ibans.length > 0) {
    score += 10;
  }

  // Contact info (10 points)
  maxScore += 10;
  if (extracted.emails && extracted.emails.length > 0) {
    score += 5;
  }
  if (extracted.phones && extracted.phones.length > 0) {
    score += 5;
  }

  // Descriptions (5 points)
  maxScore += 5;
  if (extracted.descriptions && extracted.descriptions.length > 0) {
    score += 5;
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

/**
 * Format confidence score as text
 */
export function formatConfidenceText(score: number): string {
  if (score >= 90) return 'Sehr hoch';
  if (score >= 70) return 'Hoch';
  if (score >= 50) return 'Mittel';
  if (score >= 30) return 'Niedrig';
  return 'Sehr niedrig';
}

/**
 * Format confidence score as color
 */
export function getConfidenceColor(score: number): string {
  if (score >= 90) return '#22c55e'; // Green
  if (score >= 70) return '#84cc16'; // Lime
  if (score >= 50) return '#eab308'; // Yellow
  if (score >= 30) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Get confidence badge class
 */
export function getConfidenceBadgeClass(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-lime-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Extract all and calculate confidence
 */
export function extractWithConfidence(text: string): {
  extracted: Record<string, any>;
  bestGuess: Record<string, any>;
  confidence: number;
  confidenceText: string;
  confidenceColor: string;
} {
  const extracted = extractAllFromOCR(text);
  const bestGuess = extractBestGuess(text);
  const confidence = calculateConfidenceScore(extracted);
  const confidenceText = formatConfidenceText(confidence);
  const confidenceColor = getConfidenceColor(confidence);

  return {
    extracted,
    bestGuess,
    confidence,
    confidenceText,
    confidenceColor,
  };
}

/**
 * Compare two extracted data objects and find differences
 */
export function compareExtractedData(
  data1: Record<string, any>,
  data2: Record<string, any>
): Record<string, any> {
  const differences: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

  for (const key of allKeys) {
    const val1 = data1[key];
    const val2 = data2[key];

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      differences[key] = {
        value1: val1,
        value2: val2,
      };
    }
  }

  return differences;
}

/**
 * Merge multiple extracted data objects (for batch processing)
 */
export function mergeExtractedData(dataArray: Record<string, any>[]): Record<string, any> {
  const merged: Record<string, any> = {};

  for (const data of dataArray) {
    for (const [key, value] of Object.entries(data)) {
      if (!merged[key]) {
        merged[key] = [];
      }

      if (Array.isArray(value)) {
        merged[key].push(...value);
      } else {
        merged[key].push(value);
      }
    }
  }

  // Remove duplicates
  for (const key in merged) {
    if (Array.isArray(merged[key])) {
      merged[key] = [...new Set(merged[key])];
    }
  }

  return merged;
}

/**
 * Filter extracted data by confidence threshold
 */
export function filterByConfidence(
  extracted: Record<string, any>,
  threshold: number
): Record<string, any> {
  const confidence = calculateConfidenceScore(extracted);

  if (confidence < threshold) {
    return {};
  }

  return extracted;
}

/**
 * Validate extracted data against expected schema
 */
export function validateSchema(
  data: Record<string, any>,
  schema: Record<string, string[]>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [field, types] of Object.entries(schema)) {
    const value = data[field];

    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Validate based on type
    if (types.includes('amount') && typeof value === 'number') {
      if (value <= 0 || value > 1000000) {
        errors.push(`Invalid amount for ${field}: ${value}`);
      }
    }

    if (types.includes('date') && typeof value === 'string') {
      if (!isValidGermanDate(value)) {
        errors.push(`Invalid date for ${field}: ${value}`);
      }
    }

    if (types.includes('string') && typeof value !== 'string') {
      errors.push(`Invalid type for ${field}: expected string`);
    }

    if (types.includes('iban') && typeof value === 'string') {
      if (!isValidGermanIBAN(value)) {
        errors.push(`Invalid IBAN for ${field}: ${value}`);
      }
    }

    if (types.includes('vat') && typeof value === 'string') {
      if (!isGermanVATId(value)) {
        errors.push(`Invalid VAT ID for ${field}: ${value}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: data,
  };
}

/**
 * Standard schema for invoice data
 */
export const INVOICE_SCHEMA: Record<string, string[]> = {
  supplierName: ['string'],
  invoiceNumber: ['string'],
  invoiceDate: ['date'],
  dueDate: ['date'],
  netAmount: ['amount'],
  vatAmount: ['amount'],
  totalAmount: ['amount'],
  vatRate: ['amount'],
  vatId: ['vat', 'optional'],
  iban: ['iban', 'optional'],
  bic: ['string', 'optional'],
  email: ['string', 'optional'],
  phone: ['string', 'optional'],
  description: ['string', 'optional'],
  orderNumber: ['string', 'optional'],
};

/**
 * Validate extracted invoice data
 */
export function validateInvoiceData(data: Record<string, any>): ValidationResult {
  return validateSchema(data, INVOICE_SCHEMA);
}

/**
 * Normalize extracted data to standard format
 */
export function normalizeExtractedData(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Supplier name
  if (data.supplierNames && data.supplierNames.length > 0) {
    normalized.supplierName = data.supplierNames[0];
  }

  // Invoice number
  if (data.invoiceNumbers && data.invoiceNumbers.length > 0) {
    normalized.invoiceNumber = data.invoiceNumbers[0];
  }

  // Order number
  if (data.orderNumbers && data.orderNumbers.length > 0) {
    normalized.orderNumber = data.orderNumbers[0];
  }

  // Dates
  if (data.dates && data.dates.length > 0) {
    const dates = data.dates
      .map(parseGermanDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      normalized.invoiceDate = toGermanDateString(dates[0]);

      if (dates.length > 1) {
        const futureDates = dates.filter(d => d > dates[0]);
        if (futureDates.length > 0) {
          normalized.dueDate = toGermanDateString(futureDates[0]);
        }
      }
    }
  }

  // Amounts
  if (data.grossAmounts && data.grossAmounts.length > 0) {
    normalized.totalAmount = Math.max(...data.grossAmounts);
  }

  if (data.netAmounts && data.netAmounts.length > 0) {
    const closestNet = data.netAmounts
      .filter(n => normalized.totalAmount ? n < normalized.totalAmount : true)
      .sort((a, b) => {
        if (!normalized.totalAmount) return 0;
        return Math.abs(normalized.totalAmount - a) - Math.abs(normalized.totalAmount - b);
      })[0];

    if (closestNet) {
      normalized.netAmount = closestNet;
      if (normalized.totalAmount) {
        normalized.vatAmount = normalized.totalAmount - closestNet;
      }
    }
  }

  if (data.vatRates && data.vatRates.length > 0) {
    normalized.vatRate = data.vatRates[0];
  }

  // Bank details
  if (data.ibans && data.ibans.length > 0) {
    normalized.iban = data.ibans[0];
  }

  if (data.vatIds && data.vatIds.length > 0) {
    normalized.vatId = data.vatIds[0];
  }

  // Contact
  if (data.emails && data.emails.length > 0) {
    normalized.email = data.emails[0];
  }

  if (data.phones && data.phones.length > 0) {
    normalized.phone = data.phones[0];
  }

  // Description
  if (data.descriptions && data.descriptions.length > 0) {
    normalized.description = data.descriptions[0];
  }

  return normalized;
}

/**
 * Format extracted data for display
 */
export function formatExtractedDataForDisplay(data: Record<string, any>): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (data.supplierName) formatted['Lieferant'] = data.supplierName;
  if (data.invoiceNumber) formatted['Rechnungsnr.'] = data.invoiceNumber;
  if (data.orderNumber) formatted['Bestellnr.'] = data.orderNumber;
  if (data.invoiceDate) formatted['Rechnungsdatum'] = data.invoiceDate;
  if (data.dueDate) formatted['Fälligkeitsdatum'] = data.dueDate;
  if (data.netAmount) formatted['Nettobetrag'] = formatGermanAmount(data.netAmount);
  if (data.vatAmount) formatted['MwSt.'] = formatGermanAmount(data.vatAmount);
  if (data.totalAmount) formatted['Gesamtbetrag'] = formatGermanAmount(data.totalAmount);
  if (data.vatRate) formatted['MwSt-Satz'] = data.vatRate + ' %';
  if (data.vatId) formatted['USt-IdNr.'] = data.vatId;
  if (data.iban) formatted['IBAN'] = formatGermanIBAN(data.iban);
  if (data.bic) formatted['BIC'] = data.bic;
  if (data.email) formatted['E-Mail'] = data.email;
  if (data.phone) formatted['Telefon'] = formatGermanPhone(data.phone);
  if (data.description) formatted['Beschreibung'] = data.description;

  return formatted;
}

/**
 * Check if extracted data is complete enough for processing
 */
export function isExtractedDataComplete(data: Record<string, any>): boolean {
  const required = ['supplierName', 'invoiceNumber', 'invoiceDate', 'totalAmount'];
  return required.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
}

/**
 * Get missing fields from extracted data
 */
export function getMissingFields(data: Record<string, any>): string[] {
  const required = ['supplierName', 'invoiceNumber', 'invoiceDate', 'totalAmount'];
  return required.filter(field => !data[field] || data[field] === '');
}

/**
 * Calculate completeness score
 */
export function calculateCompletenessScore(data: Record<string, any>): number {
  const allFields = [
    'supplierName',
    'invoiceNumber',
    'orderNumber',
    'invoiceDate',
    'dueDate',
    'netAmount',
    'vatAmount',
    'totalAmount',
    'vatRate',
    'vatId',
    'iban',
    'bic',
    'email',
    'phone',
    'description',
  ];

  const present = allFields.filter(field => data[field] !== undefined && data[field] !== null && data[field] !== '').length;

  return (present / allFields.length) * 100;
}

/**
 * Format completeness as text
 */
export function formatCompletenessText(score: number): string {
  if (score >= 90) return 'Vollständig';
  if (score >= 70) return 'Fast vollständig';
  if (score >= 50) return 'Teilweise vollständig';
  if (score >= 30) return 'Unvollständig';
  return 'Sehr unvollständig';
}

/**
 * Get completeness color
 */
export function getCompletenessColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#eab308';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

/**
 * Get completeness badge class
 */
export function getCompletenessBadgeClass(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-lime-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Extract and validate with all checks
 */
export function processExtractedData(text: string): {
  normalized: Record<string, any>;
  validation: ValidationResult;
  completeness: number;
  completenessText: string;
  confidence: number;
  confidenceText: string;
} {
  const extracted = extractAllFromOCR(text);
  const normalized = normalizeExtractedData(extracted);
  const validation = validateInvoiceData(normalized);
  const completeness = calculateCompletenessScore(normalized);
  const completenessText = formatCompletenessText(completeness);
  const confidence = calculateConfidenceScore(extracted);
  const confidenceText = formatConfidenceText(confidence);

  return {
    normalized,
    validation,
    completeness,
    completenessText,
    confidence,
    confidenceText,
  };
}

/**
 * Generate summary of extracted data
 */
export function generateSummary(extracted: Record<string, any>): string {
  const parts: string[] = [];

  if (extracted.supplierName) {
    parts.push(`Lieferant: ${extracted.supplierName}`);
  }

  if (extracted.invoiceNumber) {
    parts.push(`Rechnung: ${extracted.invoiceNumber}`);
  }

  if (extracted.totalAmount) {
    parts.push(`Betrag: ${formatGermanAmount(extracted.totalAmount)}`);
  }

  if (extracted.invoiceDate) {
    parts.push(`Datum: ${extracted.invoiceDate}`);
  }

  return parts.join(' | ');
}

/**
 * Compare two extracted data objects and return differences
 */
export function compareInvoiceData(
  data1: Record<string, any>,
  data2: Record<string, any>
): Record<string, { value1: any; value2: any; difference: string }> {
  const differences: Record<string, { value1: any; value2: any; difference: string }> = {};

  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

  for (const key of allKeys) {
    const val1 = data1[key];
    const val2 = data2[key];

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      let difference = '';

      if (typeof val1 === 'number' && typeof val2 === 'number') {
        const diff = val2 - val1;
        difference = `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`;
      } else if (typeof val1 === 'string' && typeof val2 === 'string') {
        difference = 'Different values';
      } else if (val1 === undefined) {
        difference = 'Missing in first';
      } else if (val2 === undefined) {
        difference = 'Missing in second';
      }

      differences[key] = {
        value1: val1,
        value2: val2,
        difference,
      };
    }
  }

  return differences;
}

/**
 * Merge duplicate extractions (for multiple OCR attempts)
 */
export function mergeDuplicateExtractions(
  extractions: Record<string, any>[]
): Record<string, any> {
  if (extractions.length === 0) return {};
  if (extractions.length === 1) return extractions[0];

  const merged: Record<string, any> = {};

  // For each field, take the most common value
  const allKeys = new Set(extractions.flatMap(e => Object.keys(e)));

  for (const key of allKeys) {
    const values = extractions
      .map(e => e[key])
      .filter(v => v !== undefined && v !== null && v !== '');

    if (values.length === 0) continue;

    // Count occurrences
    const counts = new Map<string, number>();
    for (const value of values) {
      const str = JSON.stringify(value);
      counts.set(str, (counts.get(str) || 0) + 1);
    }

    // Get most common
    const mostCommon = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];

    if (mostCommon) {
      merged[key] = JSON.parse(mostCommon[0]);
    }
  }

  return merged;
}

/**
 * Validate and normalize batch of extracted data
 */
export function validateAndNormalizeBatch(
  dataArray: Record<string, any>[]
): {
  valid: Record<string, any>[];
  invalid: Record<string, any>[];
  errors: string[];
} {
  const valid: Record<string, any>[] = [];
  const invalid: Record<string, any>[] = [];
  const errors: string[] = [];

  for (const data of dataArray) {
    const normalized = normalizeExtractedData(data);
    const validation = validateInvoiceData(normalized);

    if (validation.valid) {
      valid.push(normalized);
    } else {
      invalid.push({ data, errors: validation.errors });
      errors.push(...validation.errors);
    }
  }

  return { valid, invalid, errors };
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  data: Record<string, any>,
  validation: ValidationResult,
  confidence: number,
  completeness: number
): string {
  const lines: string[] = [];

  lines.push('=== VALIDATION REPORT ===');
  lines.push('');
  lines.push(`Confidence: ${confidence.toFixed(1)}%`);
  lines.push(`Completeness: ${completeness.toFixed(1)}%`);
  lines.push(`Valid: ${validation.valid ? 'Yes' : 'No'}`);
  lines.push('');

  if (validation.errors.length > 0) {
    lines.push('ERRORS:');
    validation.errors.forEach(err => lines.push(`  - ${err}`));
    lines.push('');
  }

  if (validation.warnings && validation.warnings.length > 0) {
    lines.push('WARNINGS:');
    validation.warnings.forEach(warn => lines.push(`  - ${warn}`));
    lines.push('');
  }

  lines.push('EXTRACTED DATA:');
  const formatted = formatExtractedDataForDisplay(data);
  for (const [key, value] of Object.entries(formatted)) {
    lines.push(`  ${key}: ${value}`);
  }

  return lines.join('\n');
}

/**
 * Export all utility functions
 */
export const utils = {
  // Basic utilities
  sleep,
  uuidv4,
  formatFileSize,
  formatDate,
  formatDateDisplay,
  formatCurrency,
  debounce,
  throttle,
  deepClone,
  isBrowser,
  isProduction,
  getEnvVar,
  log,
  warn,
  error,
  memoize,
  groupBy,
  sortBy,
  unique,
  chunk,
  capitalize,
  truncate,
  isEmpty,
  waitFor,
  retry,
  safeJsonParse,
  safeJsonStringify,
  getFileExtension,
  getFilenameWithoutExtension,
  isValidUrl,
  toBoolean,
  randomString,
  hashString,
  timestamp,
  formatTimestamp,
  isNumber,
  safeNumber,
  getNestedValue,
  setNestedValue,
  deepMerge,
  waitForDOM,
  isInViewport,
  scrollToElement,
  copyToClipboard,
  downloadFile,
  getFilesFromEvent,
  formatNumber,
  calculatePercentage,
  formatPercentage,
  isEmail,
  isPhoneNumber,
  normalizePhoneNumber,
  isIBAN,
  normalizeIBAN,
  formatIBAN,
  isVATNumber,
  normalizeVATNumber,
  isDateString,
  parseDateString,
  toDateString,
  isValidDate,
  addDays,
  diffDays,
  isSameDay,
  startOfDay,
  endOfDay,
  isBetweenDates,
  getCurrentFinancialYear,

  // German utilities
  formatGermanDate,
  parseGermanDate,
  formatGermanNumber,
  parseGermanNumber,
  formatGermanCurrency,
  isGermanDateString,
  getMonthNameGerman,
  getWeekdayGerman,
  hasGermanUmlauts,
  normalizeGermanText,
  isGermanTaxNumber,
  normalizeGermanTaxNumber,
  isGermanVATId,
  normalizeGermanVATId,
  isGermanPostalCode,
  isGermanPhone,
  normalizeGermanPhone,
  formatGermanPhone,
  isGermanAccountNumber,
  isGermanBLZ,
  formatGermanAmount,
  parseGermanAmount,
  isValidGermanDate,
  parseGermanDateString,
  toGermanDateString,
  isValidGermanTime,
  formatGermanDateTime,
  parseGermanDateTime,
  isValidGermanCurrency,
  formatGermanPercentage,
  parseGermanPercentage,
  isValidGermanIBAN,
  formatGermanIBAN,
  isValidGermanBIC,
  normalizeForSearch,
  isGermanAlphabetic,
  isGermanAlphanumeric,

  // OCR extraction utilities
  extractNumbersFromGerman,
  extractDatesFromGerman,
  extractIBANs,
  extractVATIds,
  extractPostalCodes,
  extractPhoneNumbers,
  extractEmails,
  extractAmounts,
  extractCompanyNames,
  extractSupplierNames,
  extractInvoiceNumbers,
  extractOrderNumbers,
  extractDates,
  extractAmountsFromText,
  extractVATAmounts,
  extractNetAmounts,
  extractGrossAmounts,
  extractPaymentTerms,
  extractBankDetails,
  extractContactInfo,
  extractVATRates,
  extractDescriptions,
  extractAllFromOCR,
  extractAmountsWithContext,
  findAmountsNearKeywords,
  validateExtractedData,
  extractBestGuess,
  calculateConfidenceScore,
  formatConfidenceText,
  getConfidenceColor,
  getConfidenceBadgeClass,
  extractWithConfidence,
  compareExtractedData,
  mergeExtractedData,
  filterByConfidence,
  validateSchema,
  validateInvoiceData,
  normalizeExtractedData,
  formatExtractedDataForDisplay,
  isExtractedDataComplete,
  getMissingFields,
  calculateCompletenessScore,
  formatCompletenessText,
  getCompletenessColor,
  getCompletenessBadgeClass,
  processExtractedData,
  generateSummary,
  compareInvoiceData,
  mergeDuplicateExtractions,
  validateAndNormalizeBatch,
  generateValidationReport,

  // Constants
  INVOICE_SCHEMA,
};

export default utils;
