import { DocumentRecord } from '../../types';

/**
 * Merges local and cloud documents, preferring newer versions
 * Cloud documents take precedence if timestamps differ
 */
export function mergeDocuments(
  localDocs: DocumentRecord[],
  cloudDocs: DocumentRecord[]
): DocumentRecord[] {
  const merged = new Map<string, DocumentRecord>();

  // Add local documents first
  for (const doc of localDocs) {
    merged.set(doc.id, doc);
  }

  // Merge cloud documents (cloud takes precedence if newer)
  for (const cloudDoc of cloudDocs) {
    const localDoc = merged.get(cloudDoc.id);

    if (!localDoc) {
      // Cloud doc doesn't exist locally - add it
      merged.set(cloudDoc.id, cloudDoc);
    } else {
      // Both exist - compare timestamps
      const cloudDate = new Date(cloudDoc.uploadDate).getTime();
      const localDate = new Date(localDoc.uploadDate).getTime();

      if (cloudDate > localDate) {
        // Cloud version is newer - use it
        merged.set(cloudDoc.id, cloudDoc);
      }
      // Otherwise keep local version (it's newer or same age)
    }
  }

  return Array.from(merged.values());
}
