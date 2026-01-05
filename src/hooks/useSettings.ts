/** useSettings Hook - Placeholder */

import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getSettings } from '../services/supabaseService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    };
    load();
  }, []);

  return { settings, loading, setSettings };
}
