import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import * as supabaseService from '../services/supabaseService';
import { logger } from '../src/utils/logger';

interface UseSettingsReturn {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const s = await supabaseService.getSettings();
      setSettings(s);
      setError(null);
    } catch (e) {
      setError('Fehler beim Laden der Einstellungen');
      logger.error('Error loading settings', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await supabaseService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (e) {
      setError('Fehler beim Speichern der Einstellungen');
      throw e;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    updateSettings
  };
};
