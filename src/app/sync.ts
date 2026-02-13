import { DocumentRecord } from '../types';

export const mergeDocuments = (
  localDocs: DocumentRecord[],
  cloudDocs: DocumentRecord[]
): DocumentRecord[] => {
  const docMap = new Map<string, DocumentRecord>();

  for (const doc of localDocs) {
    docMap.set(doc.id, doc);
  }

  for (const cloudDoc of cloudDocs) {
    const existing = docMap.get(cloudDoc.id);
    if (!existing) {
      docMap.set(cloudDoc.id, cloudDoc);
    } else {
      const localDate = new Date(existing.uploadDate).getTime();
      const cloudDate = new Date(cloudDoc.uploadDate).getTime();
      if (cloudDate > localDate) {
        docMap.set(cloudDoc.id, cloudDoc);
      }
    }
  }

  return Array.from(docMap.values());
};
