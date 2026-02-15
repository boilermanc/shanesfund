import { supabase } from '../lib/supabase';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactMessage(
  formData: ContactFormData
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      })
      .select('id')
      .single();

    if (error) return { data: null, error: error.message };

    // Fire-and-forget: send auto-reply to submitter
    supabase.functions.invoke('send-email', {
      body: {
        to: formData.email,
        template_name: 'contact_auto_reply',
        variables: {
          name: formData.name,
          subject: formData.subject,
          message: formData.message,
        },
        triggered_by: 'contact_form',
      },
    }).catch((err: unknown) => console.error('Auto-reply email failed:', err));

    // Fire-and-forget: send admin notification
    supabase.functions.invoke('send-email', {
      body: {
        to: 'team@sproutify.app',
        template_name: 'contact_admin_notification',
        variables: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        triggered_by: 'contact_form',
      },
    }).catch((err: unknown) => console.error('Admin notification email failed:', err));

    return { data, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}
