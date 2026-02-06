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
    return { data, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}
