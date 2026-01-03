/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GITLAB_INSTANCE_URL: string;
  readonly VITE_GITLAB_API_TOKEN: string;
  readonly VITE_GITLAB_STORAGE_PROJECT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
