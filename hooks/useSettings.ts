import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';

interface UseSettingsReturn {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  isSynced: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  saveSettingsWithSync: (newSettings: AppSettings) => Promise<void>;
}

/**
 * Default settings for a new installation
 */
const getDefaultSettings = (): AppSettings => ({
  id: 'app-settings',
  taxDefinitions: [
    { value: '19%', label: '19% USt', ust_satz: 19, vorsteuer: true },
    { value: '7%', label: '7% USt', ust_satz: 7, vorsteuer: true },
    { value: '0%', label: '0% USt', ust_satz: 0, vorsteuer: false },
    { value: '19%VR', label: '19% USt (VR)', ust_satz: 19, vorsteuer: true, reverse_charge: true },
    { value: '7%VR', label: '7% USt (VR)', ust_satz: 7, vorsteuer: true, reverse_charge: true },
    { value: 'privat', label: 'Privatanteil', ust_satz: 0, vorsteuer: false }
  ],
  accountDefinitions: [
    { id: '3400', name: 'Wareneingang', skr03: '3400', steuerkategorien: ['19%', '7%', '0%'] },
    { id: '3401', name: 'Wareneingang 7%', skr03: '3401', steuerkategorien: ['7%'] },
    { id: '3402', name: 'Wareneingang 19%', skr03: '3402', steuerkategorien: ['19%'] },
    { id: '4930', name: 'Bürobedarf', skr03: '4930', steuerkategorien: ['19%', '7%'] },
    { id: '4920', name: 'Betriebliche Steuern', skr03: '4920', steuerkategorien: ['19%', '7%', '0%'] },
    { id: '4500', name: 'Versicherungen', skr03: '4500', steuerkategorien: ['19%', '0%'] },
    { id: '4800', name: 'Strom', skr03: '4800', steuerkategorien: ['19%', '0%'] },
    { id: '4801', name: 'Gas', skr03: '4801', steuerkategorien: ['19%', '0%'] },
    { id: '4802', name: 'Wasser', skr03: '4802', steuerkategorien: ['7%', '0%'] },
    { id: '4510', name: 'Kfz-Versicherung', skr03: '4510', steuerkategorien: ['19%'] },
    { id: '6320', name: 'Werkzeuge und Geräte', skr03: '6320', steuerkategorien: ['19%', '7%'] },
    { id: '6310', name: 'Pacht und Mieten', skr03: '6310', steuerkategorien: ['19%', '0%'] },
    { id: '4200', name: 'Gehälter', skr03: '4200', steuerkategorien: ['0%'] },
    { id: '4130', name: 'Sozialversicherung', skr03: '4130', steuerkategorien: ['0%'] },
    { id: '4960', name: 'Reisekosten', skr03: '4960', steuerkategorien: ['19%', '7%'] },
    { id: '4970', name: 'Bewirtungskosten', skr03: '4970', steuerkategorien: ['19%'] },
    { id: '2420', name: 'Bank', skr03: '2420', steuerkategorien: ['0%'] },
    { id: '1800', name: 'Unternehmerkonto', skr03: '1800', steuerkategorien: ['0%'] },
    { id: '8400', name: 'Erlöse Waren', skr03: '8400', steuerkategorien: ['19%', '7%', '0%'] },
    { id: '8920', name: 'Sonstige Erlöse', skr03: '8920', steuerkategorien: ['19%', '7%', '0%'] }
  ],
  accountGroups: [
    { id: 'waren', name: 'Wareneingang', skr03: '34', taxType: 'aufwand', keywords: ['ware', 'material', 'bestellung', 'lieferung'], isRevenue: false },
    { id: 'buerobedarf', name: 'Bürobedarf', skr03: '49', taxType: 'aufwand', keywords: ['büro', 'papier', 'drucker', 'stift'], isRevenue: false },
    { id: 'versicherung', name: 'Versicherungen', skr03: '45', taxType: 'aufwand', keywords: ['versicherung', 'police', 'beitrag'], isRevenue: false },
    { id: 'energie', name: 'Energie/Strom', skr03: '48', taxType: 'aufwand', keywords: ['strom', 'energie', 'gas', 'wasser'], isRevenue: false },
    { id: 'kfz', name: 'Kfz', skr03: '45', taxType: 'aufwand', keywords: ['auto', 'kfz', 'tank', 'reifen'], isRevenue: false },
    { id: 'gehalt', name: 'Gehälter', skr03: '42', taxType: 'aufwand', keywords: ['gehalt', 'lohn', 'vergütung'], isRevenue: false },
    { id: 'reise', name: 'Reisekosten', skr03: '49', taxType: 'aufwand', keywords: ['reise', 'hotel', 'flug', 'zug'], isRevenue: false },
    { id: 'erloese', name: 'Erlöse', skr03: '84', taxType: 'erloes', keywords: ['verkauf', 'einnahme', 'erlos'], isRevenue: true }
  ],
  ocrConfig: {
    scores: {
      excellent: { min_fields: 8, desc: 'Alle kritischen Felder erkannt' },
      good: { min_fields: 6, desc: 'Die meisten Felder erkannt' },
      partial: { min_fields: 4, desc: 'Einige Felder erkannt' },
      poor: { min_fields: 2, desc: 'Wenige Felder erkannt' }
    },
    required_fields: ['belegDatum', 'lieferantName', 'bruttoBetrag'],
    field_weights: {
      belegDatum: 1.5,
      lieferantName: 1.2,
      bruttoBetrag: 2.0,
      mwstBetrag19: 1.0,
      mwstBetrag7: 1.0,
      nettoBetrag: 1.5
    },
    regex_patterns: {
      datum: '\\d{1,2}[-.]\\d{1,2}[-.]\\d{2,4}',
      betrag: '\\d+[.,]\\d{2}\\s*€',
      steuernummer: '\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{3,4}'
    },
    validation_rules: {
      sum_check: true,
      date_check: true,
      min_confidence: 0.7
    }
  },
  taxCategories: ['19%', '7%', '0%', '19%VR', '7%VR', 'privat'],
  startupChecklist: {
    uploadErsterBeleg: false,
    datevKonfiguriert: false,
    elsterStammdatenKonfiguriert: false
  }
});

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Local-first: Load from IndexedDB first
      const localSettings = await storageService.getSettings();

      if (localSettings) {
        setSettings(localSettings);
        setIsSynced(false);
      }

      // Optionally sync with Supabase if configured
      if (supabaseService.isSupabaseConfigured()) {
        try {
          const cloudSettings = await supabaseService.getSettings();

          if (cloudSettings) {
            if (!localSettings) {
              // No local settings, use cloud settings
              setSettings(cloudSettings);
              setIsSynced(true);
            } else {
              // Merge strategy: Prefer newer settings (simple approach: use cloud)
              await storageService.saveSettings(cloudSettings);
              setSettings(cloudSettings);
              setIsSynced(true);
            }
          }
        } catch (syncError) {
          console.warn('Supabase settings sync failed, using local data:', syncError);
        }
      } else if (!localSettings) {
        // No local settings and no cloud configured - create defaults
        const defaults = getDefaultSettings();
        await storageService.saveSettings(defaults);
        setSettings(defaults);
      }
    } catch (e) {
      setError('Fehler beim Laden der Einstellungen');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      // Local-first: Save to IndexedDB first
      await storageService.saveSettings(newSettings);
      setSettings(newSettings);
      setIsSynced(false);
    } catch (e) {
      setError('Fehler beim Speichern der Einstellungen');
      throw e;
    }
  }, []);

  const saveSettingsWithSync = useCallback(async (newSettings: AppSettings) => {
    try {
      // Save locally first
      await storageService.saveSettings(newSettings);
      setSettings(newSettings);
      setIsSynced(false);

      // Optionally sync to Supabase if configured
      if (supabaseService.isSupabaseConfigured()) {
        try {
          await supabaseService.saveSettings(newSettings);
          setIsSynced(true);
        } catch (syncError) {
          console.warn('Failed to sync settings to Supabase:', syncError);
        }
      }
    } catch (e) {
      setError('Fehler beim Speichern der Einstellungen');
      throw e;
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    isSynced,
    refreshSettings,
    updateSettings,
    saveSettingsWithSync
  };
};
