import { supabase } from '../lib/supabase';
import type { ConfigSetting } from '../types/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a config_settings value string into its typed JS equivalent. */
function parseValue(value: string | null, dataType: string): any {
  if (value === null || value === undefined) return value;
  switch (dataType) {
    case 'boolean':
      return value === 'true' || value === '1';
    case 'number':
      return parseFloat(value) || 0;
    case 'json':
      try { return JSON.parse(value); } catch { return value; }
    default:
      return value;
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Fetch all settings, optionally filtered by category. */
export async function getSettings(
  category?: string
): Promise<{ data: ConfigSetting[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('config_settings')
      .select('*')
      .order('key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/** Fetch a single setting by category + key. */
export async function getSetting(
  category: string,
  key: string
): Promise<{ data: ConfigSetting | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('config_settings')
      .select('*')
      .eq('category', category)
      .eq('key', key)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch all settings for a category as a typed key-value map.
 * Boolean and number values are auto-parsed from their string storage.
 */
export async function getSettingsMap(
  category: string
): Promise<{ data: Record<string, any> | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('config_settings')
      .select('*')
      .eq('category', category);

    if (error) return { data: null, error: error.message };

    const map: Record<string, any> = {};
    (data || []).forEach((row: ConfigSetting) => {
      map[row.key] = parseValue(row.value, row.data_type);
    });

    return { data: map, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/** Update a single setting's value. */
export async function updateSetting(
  category: string,
  key: string,
  value: string | null
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('config_settings')
      .update({ value })
      .eq('category', category)
      .eq('key', key);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

/** Bulk update multiple settings. Each item needs category + key + value. */
export async function updateSettings(
  updates: { category: string; key: string; value: string | null }[]
): Promise<{ error: string | null }> {
  try {
    // Use individual updates wrapped in a loop — Supabase doesn't support
    // bulk upsert on composite keys easily from the client.
    for (const { category, key, value } of updates) {
      const { error } = await supabase
        .from('config_settings')
        .update({ value })
        .eq('category', category)
        .eq('key', key);

      if (error) return { error: error.message };
    }
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// Test Slack connection (calls edge function)
// ---------------------------------------------------------------------------

export async function testSlackConnection(): Promise<{
  data: { success: boolean; message: string } | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('test-integration', {
      body: { integration: 'slack' },
    });

    if (error) {
      // Edge function errors: try to extract real message from context
      let errorMsg = error.message || 'Test failed';
      try {
        if (error.context && typeof error.context.json === 'function') {
          const body = await error.context.json();
          if (body?.error) errorMsg = body.error;
        }
      } catch { /* context parsing failed */ }
      return { data: null, error: errorMsg };
    }

    if (!data?.success) {
      return { data, error: data?.error || 'Test failed' };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to test Slack connection' };
  }
}
