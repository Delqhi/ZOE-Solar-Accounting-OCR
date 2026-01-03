// GitLab Storage Service for uploading PDFs and images
// Files are stored in a GitLab repository using the GitLab API

const GITLAB_URL = import.meta.env['VITE_GITLAB_INSTANCE_URL'] || 'https://gitlab.com';
const GITLAB_API_TOKEN = import.meta.env['VITE_GITLAB_API_TOKEN'] || '';
const GITLAB_STORAGE_PROJECT = import.meta.env['VITE_GITLAB_STORAGE_PROJECT'] || 'zukunftsorientierte.energie/zoe-solar-storage';

export interface GitLabFileInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  content: string; // Base64 encoded
  branch?: string;
}

export interface GitLabUploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

// Check if GitLab is configured
export function isGitLabConfigured(): boolean {
  return Boolean(GITLAB_URL && GITLAB_API_TOKEN && GITLAB_STORAGE_PROJECT);
}

// Get project ID from project path
export class GitLabStorageError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'GitLabStorageError';
  }
}

async function getProjectId(): Promise<number> {
  const response = await fetch(`${GITLAB_URL}/api/v4/projects/${encodeURIComponent(GITLAB_STORAGE_PROJECT)}`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new GitLabStorageError(`Failed to get GitLab project: ${response.status} ${response.statusText}`, errorText);
  }

  const project = await response.json();
  return project.id;
}

// Create or update a file in GitLab
async function createOrUpdateFile(
  projectId: number,
  filePath: string,
  content: string,
  commitMessage: string,
  branch: string = 'main'
): Promise<GitLabUploadResult> {
  const response = await fetch(
    `${GITLAB_URL}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITLAB_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch,
        author_name: 'Zoe Solar Accounting OCR',
        author_email: 'system@zoe-solar.de',
        commit_message: commitMessage,
        content: content,
        encoding: 'base64',
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GitLabStorageError(`Failed to upload file to GitLab: ${response.status} ${response.statusText}`, errorText);
  }

  const data = await response.json();
  return {
    success: true,
    filePath,
    url: data.url || `${GITLAB_URL}/${GITLAB_STORAGE_PROJECT}/-/raw/${branch}/${filePath}`,
  };
}

// Generate file path for a document
function generateFilePath(dateiname: string, belegDatum?: string): string {
  const now = new Date();
  const year = belegDatum ? new Date(belegDatum).getFullYear() : now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const sanitizedName = dateiname.replace(/[^a-zA-Z0-9.-]/g, '_');

  return `belege/${year}/${month}/${timestamp}-${sanitizedName}`;
}

// Upload a file to GitLab Storage
export async function uploadToGitLabStorage(
  fileName: string,
  base64Content: string,
  belegDatum?: string,
  options?: {
    branch?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<GitLabUploadResult> {
  if (!isGitLabConfigured()) {
    return {
      success: false,
      error: 'GitLab storage not configured. Please set VITE_GITLAB_API_TOKEN and VITE_GITLAB_STORAGE_PROJECT.',
    };
  }

  try {
    const projectId = await getProjectId();

    const filePath = generateFilePath(fileName, belegDatum);
    const commitMessage = `Upload: ${fileName} - ${new Date().toISOString()}`;

    // Progress callback (GitLab API doesn't support chunked uploads natively for small files)
    if (options?.onProgress) {
      options.onProgress(50);
    }

    const result = await createOrUpdateFile(projectId, filePath, base64Content, commitMessage, options?.branch);

    if (result.success && options?.onProgress) {
      options.onProgress(100);
    }

    return result;
  } catch (error) {
    if (error instanceof GitLabStorageError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during GitLab upload',
    };
  }
}

// Upload PDF file
export async function uploadPdfToGitLab(
  fileName: string,
  pdfBase64: string,
  belegDatum?: string
): Promise<GitLabUploadResult> {
  return uploadToGitLabStorage(fileName, pdfBase64, belegDatum);
}

// Upload image file (for previews)
export async function uploadImageToGitLab(
  fileName: string,
  imageBase64: string,
  belegDatum?: string
): Promise<GitLabUploadResult> {
  return uploadToGitLabStorage(fileName, imageBase64, belegDatum);
}

// Delete a file from GitLab
export async function deleteFromGitLabStorage(
  filePath: string,
  branch: string = 'main'
): Promise<GitLabUploadResult> {
  if (!isGitLabConfigured()) {
    return {
      success: false,
      error: 'GitLab storage not configured',
    };
  }

  try {
    const projectId = await getProjectId();

    const response = await fetch(
      `${GITLAB_URL}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITLAB_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch,
          author_name: 'Zoe Solar Accounting OCR',
          author_email: 'system@zoe-solar.de',
          commit_message: `Delete: ${filePath}`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new GitLabStorageError(`Failed to delete file from GitLab: ${response.status} ${response.statusText}`, errorText);
    }

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    if (error instanceof GitLabStorageError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during GitLab delete',
    };
  }
}

// Get file content from GitLab
export async function getFileFromGitLab(
  filePath: string,
  branch: string = 'main'
): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!isGitLabConfigured()) {
    return { success: false, error: 'GitLab storage not configured' };
  }

  try {
    const projectId = await getProjectId();

    const response = await fetch(
      `${GITLAB_URL}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${GITLAB_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    const data = await response.json();
    return { success: true, content: data.content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during GitLab getFile',
    };
  }
}

// List files in a directory
export async function listFilesInGitLab(
  path: string = '',
  branch: string = 'main'
): Promise<{ success: boolean; files?: Array<{ name: string; path: string; type: string }>; error?: string }> {
  if (!isGitLabConfigured()) {
    return { success: false, error: 'GitLab storage not configured' };
  }

  try {
    const projectId = await getProjectId();

    const response = await fetch(
      `${GITLAB_URL}/api/v4/projects/${projectId}/repository/tree?path=${encodeURIComponent(path)}&ref=${branch}&per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${GITLAB_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const files = await response.json();
    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during GitLab listFiles',
    };
  }
}

// Create the GitLab storage service
export const gitlabStorageService = {
  isConfigured: isGitLabConfigured,
  upload: uploadToGitLabStorage,
  uploadPdf: uploadPdfToGitLab,
  uploadImage: uploadImageToGitLab,
  delete: deleteFromGitLabStorage,
  getFile: getFileFromGitLab,
  listFiles: listFilesInGitLab,
  generateFilePath,
};
