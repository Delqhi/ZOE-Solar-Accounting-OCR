import { v4 as uuidv4 } from 'uuid';

// GitLab Storage Configuration
const GITLAB_INSTANCE_URL = process.env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
const GITLAB_API_TOKEN = process.env.GITLAB_API_TOKEN || '';
const GITLAB_STORAGE_PROJECT_PATH = process.env.GITLAB_STORAGE_PROJECT_PATH || 'zukunftsorientierte.energie/zoe-solar-storage';

interface GitLabUploadResult {
  url: string;
  path: string;
  fileId: string;
}

export const uploadToGitLabStorage = async (
  base64Data: string,
  fileName: string,
  mimeType: string
): Promise<GitLabUploadResult> => {
  if (!GITLAB_API_TOKEN) {
    throw new Error('GitLab API token not configured');
  }

  const projectEncoded = encodeURIComponent(GITLAB_STORAGE_PROJECT_PATH);
  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || 'pdf';
  const storagePath = `documents/${fileId}.${extension}`;

  // Upload to GitLab using the generic package contents API
  const response = await fetch(
    `${GITLAB_INSTANCE_URL}/api/v4/projects/${projectEncoded}/repository/files/${encodeURIComponent(storagePath)}`,
    {
      method: 'PUT',
      headers: {
        'PRIVATE-TOKEN': GITLAB_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: 'main',
        author_email: 'system@zoe-solar.de',
        author_name: 'ZOE Solar System',
        content: base64Data,
        commit_message: `Add document: ${fileName}`,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitLab upload failed: ${error}`);
  }

  const result = await response.json();

  return {
    url: `${GITLAB_INSTANCE_URL}/${GITLAB_STORAGE_PROJECT_PATH}/-/raw/main/${storagePath}`,
    path: storagePath,
    fileId,
  };
};

export const deleteFromGitLabStorage = async (storagePath: string): Promise<void> => {
  if (!GITLAB_API_TOKEN) {
    throw new Error('GitLab API token not configured');
  }

  const projectEncoded = encodeURIComponent(GITLAB_STORAGE_PROJECT_PATH);

  const response = await fetch(
    `${GITLAB_INSTANCE_URL}/api/v4/projects/${projectEncoded}/repository/files/${encodeURIComponent(storagePath)}`,
    {
      method: 'DELETE',
      headers: {
        'PRIVATE-TOKEN': GITLAB_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: 'main',
        commit_message: `Delete document: ${storagePath}`,
      }),
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`GitLab delete failed: ${error}`);
  }
};

export const getGitLabStorageUrl = (storagePath: string): string => {
  return `${GITLAB_INSTANCE_URL}/${GITLAB_STORAGE_PROJECT_PATH}/-/raw/main/${storagePath}`;
};
