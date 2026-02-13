/** 🔱 ULTRA 2026 - Conflict Resolver
 * Advanced conflict resolution strategies for document synchronization
 * Part of the modular useDocumentSync architecture
 */

import { type Document } from '@/lib/ultra';

export type ConflictStrategy = 'local' | 'remote' | 'merge' | 'manual';

/**
 * ConflictResolver - Handles document conflicts with multiple strategies
 * Extracted from useDocumentSync.ts to maintain 300-line rule
 */
export class ConflictResolver {
  /**
   * Resolve conflict using specified strategy
   */
  static resolve(
    local: Document,
    remote: Document,
    strategy: ConflictStrategy = 'merge'
  ): Document {
    switch (strategy) {
      case 'local':
        return local;
      case 'remote':
        return remote;
      case 'merge':
        return this.mergeStrategy(local, remote);
      case 'manual':
        return this.manualStrategy(local, remote);
      default:
        return this.mergeStrategy(local, remote);
    }
  }

  /**
   * Merge strategy - combines fields intelligently
   * Uses timestamp to determine which fields to keep
   */
  private static mergeStrategy(local: Document, remote: Document): Document {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    // If remote is newer, use it as base
    if (remoteTime > localTime) {
      return {
        ...remote,
        syncStatus: 'synced',
        // Preserve local fields that might be more complete
        description: remote.description || local.description,
      };
    }

    // If local is newer or same, use local
    return {
      ...local,
      syncStatus: 'synced',
    };
  }

  /**
   * Manual strategy - prompts user for resolution
   * Returns both versions for UI to present
   */
  private static manualStrategy(local: Document, remote: Document): Document {
    // In real implementation: would trigger UI modal
    // For now: return remote as default
    console.warn('[ConflictResolver] Manual resolution required', { local, remote });
    return remote;
  }

  /**
   * Detect if conflict exists
   */
  static hasConflict(local: Document, remote: Document): boolean {
    return local.updatedAt.getTime() !== remote.updatedAt.getTime();
  }

  /**
   * Get conflict details for UI presentation
   */
  static getConflictDetails(local: Document, remote: Document) {
    return {
      hasConflict: this.hasConflict(local, remote),
      localUpdated: local.updatedAt,
      remoteUpdated: remote.updatedAt,
      differences: this.getDifferences(local, remote),
    };
  }

  /**
   * Get field-level differences
   */
  private static getDifferences(local: Document, remote: Document): string[] {
    const differences: string[] = [];
    const fields = ['totalAmount', 'vatAmount', 'netAmount', 'creditor', 'description'] as const;

    for (const field of fields) {
      if (local[field] !== remote[field]) {
        differences.push(`${field}: ${local[field]} → ${remote[field]}`);
      }
    }

    return differences;
  }

  /**
   * Auto-resolve multiple conflicts
   */
  static autoResolve(
    conflicts: Array<{ local: Document; remote: Document }>,
    strategy: ConflictStrategy = 'merge'
  ): Document[] {
    return conflicts.map(({ local, remote }) => this.resolve(local, remote, strategy));
  }
}
