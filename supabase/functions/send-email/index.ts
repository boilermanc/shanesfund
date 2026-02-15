import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      to,
      template_name,
      template_id,
      subject: overrideSubject,
      html_body: overrideHtml,
      variables = {},
      from,
      triggered_by = "admin_test",
    } = body;

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Recipient email (to) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        return new Response(
          JSON.stringify({ success: false, error: `Template not found: ${template_name || template_id}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      templateRow = data;
      if (!overrideSubject) subject = data.subject;
      if (!overrideHtml) htmlBody = data.html_body;
    }

    if (!subject || !htmlBody) {
      return new Response(
        JSON.stringify({ success: false, error: "Subject and html_body are required (provide directly or via template)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Variable interpolation: replace all {{key}} with values
    const interpolate = (text: string, vars: Record<string, string>) => {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    };
    subject = interpolate(subject, variables);
    htmlBody = interpolate(htmlBody, variables);

    const fromEmail = from || "Shane's Fund <team@sproutify.app>";

    // Call Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();
    const success = resendResponse.ok;
    const messageId = resendData.id || null;
    const errorMessage = success ? null : resendData.message || JSON.stringify(resendData);

    // Log to email_logs
    const { data: logData } = await supabase
      .from("email_logs")
      .insert({
        template_id: templateRow?.id || null,
        template_name: templateRow?.name || null,
        to_email: to,
        from_email: fromEmail,
        subject,
        html_body: htmlBody,
        variables,
        resend_message_id: messageId,
        status: success ? "sent" : "failed",
        error_message: errorMessage,
        triggered_by,
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
