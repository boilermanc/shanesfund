import { supabase } from '../lib/supabase';
import type { EmailTemplate, EmailLog } from '../types/database';

// --- Templates CRUD ---

export async function getEmailTemplates(): Promise<{ data: EmailTemplate[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to fetch email templates' };
  }
}

export async function getEmailTemplate(id: string): Promise<{ data: EmailTemplate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to fetch email template' };
  }
}

export async function createEmailTemplate(template: {
  name: string;
  subject: string;
  html_body: string;
  variables?: string[];
  description?: string;
}): Promise<{ data: EmailTemplate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to create email template' };
  }
}

export async function updateEmailTemplate(
  id: string,
  updates: {
    name?: string;
    subject?: string;
    html_body?: string;
    variables?: string[];
    description?: string;
    is_active?: boolean;
  }
): Promise<{ data: EmailTemplate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to update email template' };
  }
}

export async function deleteEmailTemplate(id: string): Promise<{ data: null; error: string | null }> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch {
    return { data: null, error: 'Failed to delete email template' };
  }
}

// --- Send Email via Edge Function ---

export async function sendEmail(params: {
  to: string;
  template_name?: string;
  template_id?: string;
  subject?: string;
  html_body?: string;
  variables?: Record<string, string>;
  triggered_by?: string;
}): Promise<{ data: { success: boolean; message_id?: string; log_id?: string } | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('send-email', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: params,
    });
    if (error) return { data: null, error: error.message };
    if (!data.success) return { data: data, error: data.error || 'Send failed' };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to send email' };
  }
}

// --- Email Logs ---

export async function getEmailLogs(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ data: EmailLog[] | null; error: string | null }> {
  try {
    const limit = options?.limit || 50;
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (options?.status) query = query.eq('status', options.status);
    if (options?.offset) query = query.range(options.offset, options.offset + limit - 1);
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to fetch email logs' };
  }
}
