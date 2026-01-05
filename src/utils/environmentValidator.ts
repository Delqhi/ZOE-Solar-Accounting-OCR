/**
 * Environment Validator - Security & Configuration Check
 * Validates all required environment variables before app startup
 */

export interface EnvironmentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

export interface EnvironmentConfig {
  geminiApiKey: string;
  siliconFlowApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  gitlabConfig?: GitLabConfig;
}

export interface GitLabConfig {
  instanceUrl: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  apiToken?: string;
  storageProject?: string;
  defaultBranch?: string;
  commitMessage?: string;
  authorName?: string;
  authorEmail?: string;
}

/**
 * Validates all environment variables required for the application
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const required = {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
  };

  // Optional environment variables
  const optional = {
    siliconFlowApiKey: import.meta.env.VITE_SILICONFLOW_API_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    gitlabInstanceUrl: import.meta.env.VITE_GITLAB_INSTANCE_URL,
    gitlabClientId: import.meta.env.VITE_GITLAB_CLIENT_ID,
    gitlabClientSecret: import.meta.env.VITE_GITLAB_CLIENT_SECRET,
    gitlabCallbackUrl: import.meta.env.VITE_GITLAB_CALLBACK_URL,
    gitlabApiToken: import.meta.env.VITE_GITLAB_API_TOKEN,
    gitlabStorageProject: import.meta.env.VITE_GITLAB_STORAGE_PROJECT,
    gitlabDefaultBranch: import.meta.env.VITE_GITLAB_DEFAULT_BRANCH,
    gitlabCommitMessage: import.meta.env.VITE_GITLAB_COMMIT_MESSAGE,
    gitlabAuthorName: import.meta.env.VITE_GITLAB_AUTHOR_NAME,
    gitlabAuthorEmail: import.meta.env.VITE_GITLAB_AUTHOR_EMAIL,
  };

  // Validate required variables
  if (!required.geminiApiKey || required.geminiApiKey.includes('PLACEHOLDER')) {
    errors.push('VITE_GEMINI_API_KEY is required and must be a valid API key');
  }

  // Validate format of API keys
  if (required.geminiApiKey && !isValidGeminiKey(required.geminiApiKey)) {
    errors.push('VITE_GEMINI_API_KEY format is invalid (should start with "AIzaSy")');
  }

  // Check for placeholder values in optional variables
  if (optional.siliconFlowApiKey && optional.siliconFlowApiKey.includes('PLACEHOLDER')) {
    warnings.push('VITE_SILICONFLOW_API_KEY is using placeholder value - OCR fallback will be disabled');
  }

  if (optional.supabaseUrl && optional.supabaseUrl.includes('PLACEHOLDER')) {
    warnings.push('VITE_SUPABASE_URL is using placeholder value - Cloud sync will be disabled');
  }

  if (optional.supabaseAnonKey && optional.supabaseAnonKey.includes('PLACEHOLDER')) {
    warnings.push('VITE_SUPABASE_ANON_KEY is using placeholder value - Cloud sync will be disabled');
  }

  // GitLab validation (all or nothing)
  const gitlabConfig = buildGitLabConfig(optional);
  if (gitlabConfig && !validateGitLabConfig(gitlabConfig)) {
    warnings.push('GitLab configuration is incomplete - Cloud storage will be disabled');
  }

  // Check for potential security issues
  if (required.geminiApiKey && isLikelyLeakedKey(required.geminiApiKey)) {
    errors.push('⚠️ SECURITY: API key appears to be leaked or compromised');
  }

  // Build configuration object
  const config: EnvironmentConfig = {
    geminiApiKey: required.geminiApiKey || '',
    siliconFlowApiKey: optional.siliconFlowApiKey,
    supabaseUrl: optional.supabaseUrl,
    supabaseAnonKey: optional.supabaseAnonKey,
    gitlabConfig: gitlabConfig,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Validates Gemini API key format
 * Gemini keys typically start with "AIzaSy"
 */
function isValidGeminiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('PLACEHOLDER')) return false;
  if (key.length < 20) return false;
  // Gemini keys typically start with AIzaSy
  return key.startsWith('AIzaSy') || key.length > 40;
}

/**
 * Checks if an API key appears to be leaked or compromised
 */
function isLikelyLeakedKey(key: string): boolean {
  const patterns = [
    /example/i,
    /placeholder/i,
    /your_key/i,
    /fake/i,
    /test/i,
    /demo/i,
  ];

  return patterns.some(pattern => pattern.test(key));
}

/**
 * Builds GitLab configuration from environment variables
 */
function buildGitLabConfig(optional: any): GitLabConfig | null {
  const hasAnyGitlab =
    optional.gitlabInstanceUrl ||
    optional.gitlabClientId ||
    optional.gitlabClientSecret ||
    optional.gitlabApiToken;

  if (!hasAnyGitlab) return null;

  return {
    instanceUrl: optional.gitlabInstanceUrl || 'https://gitlab.com',
    clientId: optional.gitlabClientId,
    clientSecret: optional.gitlabClientSecret,
    callbackUrl: optional.gitlabCallbackUrl,
    apiToken: optional.gitlabApiToken,
    storageProject: optional.gitlabStorageProject,
    defaultBranch: optional.gitlabDefaultBranch || 'main',
    commitMessage: optional.gitlabCommitMessage || 'Uploaded via ZOE Solar OCR',
    authorName: optional.gitlabAuthorName || 'ZOE Solar OCR',
    authorEmail: optional.gitlabAuthorEmail,
  };
}

/**
 * Validates GitLab configuration completeness
 */
function validateGitLabConfig(config: GitLabConfig): boolean {
  // Need at least API token for cloud storage
  if (!config.apiToken) return false;

  // If callback URL is set, need OAuth credentials
  if (config.callbackUrl && (!config.clientId || !config.clientSecret)) {
    return false;
  }

  return true;
}

/**
 * Gets sanitized configuration (without sensitive values)
 */
export function getSanitizedConfig(): Record<string, any> {
  const env = import.meta.env;

  return {
    hasGeminiKey: !!env.VITE_GEMINI_API_KEY && !env.VITE_GEMINI_API_KEY.includes('PLACEHOLDER'),
    hasSiliconFlowKey: !!env.VITE_SILICONFLOW_API_KEY && !env.VITE_SILICONFLOW_API_KEY.includes('PLACEHOLDER'),
    hasSupabase: !!env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.includes('PLACEHOLDER'),
    hasGitLab: !!env.VITE_GITLAB_API_TOKEN && !env.VITE_GITLAB_API_TOKEN.includes('PLACEHOLDER'),
    isProduction: env.PROD === true,
    mode: env.MODE,
  };
}

/**
 * Logs configuration status (without exposing secrets)
 */
export function logConfigStatus(): void {
  const sanitized = getSanitizedConfig();

  console.group('📋 Configuration Status');
  console.log('Environment:', sanitized.mode);
  console.log('Production:', sanitized.isProduction);
  console.log('Gemini API:', sanitized.hasGeminiKey ? '✅ Configured' : '❌ Missing');
  console.log('SiliconFlow API:', sanitized.hasSiliconFlowKey ? '✅ Configured' : '⚠️ Optional');
  console.log('Supabase:', sanitized.hasSupabase ? '✅ Configured' : '⚠️ Optional');
  console.log('GitLab:', sanitized.hasGitLab ? '✅ Configured' : '⚠️ Optional');
  console.groupEnd();
}
