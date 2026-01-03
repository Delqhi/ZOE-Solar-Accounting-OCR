import { getSupabase } from './supabaseClient';
import { AppSettings, VendorRule } from '../types';

class SettingsService {
  private settingsTable = 'app_settings';
  private vendorRulesTable = 'vendor_rules';

  async getSettings(userId: string): Promise<AppSettings> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.settingsTable)
      .select('settings_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return default settings if not found
      return this.getDefaultSettings();
    }

    return data.settings_data as AppSettings;
  }

  async saveSettings(userId: string, settings: AppSettings): Promise<void> {
    const client = getSupabase();

    const { error } = await client
      .from(this.settingsTable)
      .upsert({
        user_id: userId,
        settings_data: settings as any,
        settings_version: 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  // Vendor rules (migrated from IndexedDB)
  async getVendorRule(userId: string, vendorName: string): Promise<VendorRule | null> {
    const client = getSupabase();
    const normalized = vendorName.trim().toLowerCase();

    const { data, error } = await client
      .from(this.vendorRulesTable)
      .select('*')
      .eq('user_id', userId)
      .eq('vendor_name_normalized', normalized)
      .single();

    if (error) return null;

    return {
      vendorName: data.vendor_name,
      accountGroupName: '', // Legacy
      accountId: data.account_id,
      taxCategoryValue: data.tax_category_value,
      lastUpdated: data.last_updated,
      useCount: data.use_count
    };
  }

  async getAllVendorRules(userId: string): Promise<VendorRule[]> {
    const client = getSupabase();

    const { data, error } = await client
      .from(this.vendorRulesTable)
      .select('*')
      .eq('user_id', userId)
      .order('use_count', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      vendorName: d.vendor_name,
      accountGroupName: '',
      accountId: d.account_id,
      taxCategoryValue: d.tax_category_value,
      lastUpdated: d.last_updated,
      useCount: d.use_count
    }));
  }

  async saveVendorRule(
    userId: string,
    vendorName: string,
    accountId: string,
    taxCategoryValue: string
  ): Promise<void> {
    const client = getSupabase();
    const normalized = vendorName.trim().toLowerCase();

    // Get existing to increment count
    const existing = await this.getVendorRule(userId, vendorName);

    const ruleData = {
      user_id: userId,
      vendor_name: vendorName,
      vendor_name_normalized: normalized,
      account_id: accountId,
      tax_category_value: taxCategoryValue,
      use_count: (existing?.useCount || 0) + 1,
      last_used_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { error } = await client
      .from(this.vendorRulesTable)
      .upsert(ruleData, {
        onConflict: 'user_id,vendor_name_normalized'
      });

    if (error) throw error;
  }

  async deleteVendorRule(userId: string, vendorName: string): Promise<void> {
    const client = getSupabase();
    const normalized = vendorName.trim().toLowerCase();

    const { error } = await client
      .from(this.vendorRulesTable)
      .delete()
      .eq('user_id', userId)
      .eq('vendor_name_normalized', normalized);

    if (error) throw error;
  }

  async incrementVendorRuleUsage(userId: string, vendorName: string): Promise<void> {
    const client = getSupabase();
    const normalized = vendorName.trim().toLowerCase();

    const { error } = await client
      .from(this.vendorRulesTable)
      .update({
        use_count: client!.from(this.vendorRulesTable).select('use_count').eq('vendor_name_normalized', normalized).single() as any + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('vendor_name_normalized', normalized);

    // Note: This is a simplified version - in production use a proper RPC function
  }

  private getDefaultSettings(): AppSettings {
    return {
      id: 'global',
      taxDefinitions: [
        { value: '0', label: '0% Ust', ust_satz: 0, vorsteuer: false },
        { value: '7', label: '7% Ust (ermäßigt)', ust_satz: 0.07, vorsteuer: true },
        { value: '19', label: '19% Ust (normal)', ust_satz: 0.19, vorsteuer: true },
        { value: 'auslagen', label: 'Auslagen', ust_satz: 0, vorsteuer: false },
        { value: 'netto', label: 'Netto (kein Ust)', ust_satz: 0, vorsteuer: false }
      ],
      accountDefinitions: [],
      accountGroups: [],
      ocrConfig: {
        scores: {
          perfect: { min_fields: 9, desc: 'Alle kritischen Felder gefunden' },
          good: { min_fields: 7, desc: 'Die meisten Felder gefunden' },
          partial: { min_fields: 5, desc: 'Einige Felder fehlen' },
          poor: { min_fields: 0, desc: 'Kaum Felder erkannt' }
        },
        required_fields: ['bruttoBetrag', 'belegDatum', 'lieferantName'],
        field_weights: {
          bruttoBetrag: 3,
          belegDatum: 2,
          lieferantName: 2,
          mwstBetrag19: 1,
          mwstBetrag7: 1,
          nettoBetrag: 1,
          belegNummerLieferant: 1
        },
        regex_patterns: {
          // German tax number patterns
          steuernummer: '\\d{3}\\s*\\d{3}\\s*\\d{4}',
          // German VAT ID
          ust_id: 'DE\\d{9}',
          // Date patterns
          date: '\\d{1,2}[.-]\\d{1,2}[.-]\\d{2,4}',
          // Currency
          amount: '\\d+[.,]\\d{2}\\s*€?'
        },
        validation_rules: {
          sum_check: true,
          date_check: true,
          min_confidence: 0.7
        }
      }
    };
  }
}

export const settingsService = new SettingsService();
