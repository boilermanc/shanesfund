import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://shanesfund.vercel.app";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Shane's Fund <noreply@shanesfund.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

    // --- Auth: verify JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing authorization header");
    }

    // Create a client with the user's JWT to verify identity
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return errorResponse(401, "Invalid or expired token");
    }

    // --- Admin check: verify user is an active admin ---
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !adminUser) {
      return errorResponse(403, "Admin access required");
    }

    // --- Basic rate limiting: max 50 emails per admin per hour ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .ilike("triggered_by", `%user:${user.id}%`)
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= 50) {
      return errorResponse(429, "Rate limit exceeded: max 50 emails per hour");
    }

    // --- Parse request body ---
    const body = await req.json();
    const {
      to,
      template_name,
      template_id,
      subject: overrideSubject,
      html_body: overrideHtml,
      variables = {},
      triggered_by = "admin_test",
    } = body;

    if (!to) {
      return errorResponse(400, "Recipient email (to) is required");
    }

    let subject = overrideSubject || "";
    let htmlBody = overrideHtml || "";
    let templateRow: any = null;

    // Resolve template if specified
    if (template_name || template_id) {
      let query = supabase.from("email_templates").select("*");
      if (template_id) {
        query = query.eq("id", template_id);
      } else {
        query = query.eq("name", template_name);
      }
      const { data, error } = await query.eq("is_active", true).single();
      if (error || !data) {
        return errorResponse(404, `Template not found: ${template_name || template_id}`);
      }
      templateRow = data;
      if (!overrideSubject) subject = data.subject;
      if (!overrideHtml) htmlBody = data.html_body;
    }

    if (!subject || !htmlBody) {
      return errorResponse(400, "Subject and html_body are required (provide directly or via template)");
    }

    // Variable interpolation: replace all {{key}} with values
    const interpolate = (text: string, vars: Record<string, string>) => {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    };
    subject = interpolate(subject, variables);
    htmlBody = interpolate(htmlBody, variables);

    // Call Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();
    const success = resendResponse.ok;
    const messageId = resendData.id || null;
    const errorMessage = success ? null : resendData.message || JSON.stringify(resendData);

    // Log to email_logs (includes sender's user ID for audit)
    const { data: logData } = await supabase
      .from("email_logs")
      .insert({
        template_id: templateRow?.id || null,
        template_name: templateRow?.name || null,
        to_email: to,
        from_email: FROM_EMAIL,
        subject,
        html_body: htmlBody,
        variables,
        resend_message_id: messageId,
        status: success ? "sent" : "failed",
        error_message: errorMessage,
        triggered_by: `${triggered_by} (user:${user.id})`,
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        success,
        message_id: messageId,
        log_id: logData?.id,
        error: errorMessage,
      }),
      { status: success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMsg = error?.message || "Unknown error";
    console.error("Email function error:", errorMsg);
    return errorResponse(500, errorMsg);
  }
});
