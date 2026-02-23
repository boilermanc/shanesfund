import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://shanesfund.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // --- Auth: verify JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing authorization header");
    }

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return errorResponse(401, "Invalid or expired token");
    }

    // --- Admin check ---
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

    // --- Parse request ---
    const { integration } = await req.json();

    let result: { success: boolean; message: string };

    switch (integration) {
      case "slack":
        result = await testSlack(supabase);
        break;
      default:
        return errorResponse(400, `Unknown integration: ${integration}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error?.message || "Unknown error";
    console.error("test-integration error:", msg);
    return errorResponse(500, msg);
  }
});

// ---------------------------------------------------------------------------
// Slack test
// ---------------------------------------------------------------------------

async function testSlack(
  supabase: any
): Promise<{ success: boolean; message: string }> {
  // Read Slack settings from config_settings
  const { data: settings, error: settingsError } = await supabase
    .from("config_settings")
    .select("key, value")
    .eq("category", "slack")
    .in("key", ["slack_enabled", "slack_webhook_url"]);

  if (settingsError) {
    return {
      success: false,
      message: `Failed to read settings: ${settingsError.message}`,
    };
  }

  const getValue = (key: string) =>
    settings?.find((s: any) => s.key === key)?.value;

  const enabled = getValue("slack_enabled");
  const webhookUrl = getValue("slack_webhook_url");

  if (enabled !== "true") {
    return { success: false, message: "Slack is not enabled" };
  }

  if (!webhookUrl) {
    return { success: false, message: "Slack webhook URL is not configured" };
  }

  // Validate URL to prevent SSRF
  if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
    return {
      success: false,
      message: "Invalid webhook URL — must start with https://hooks.slack.com/",
    };
  }

  // Send test message
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const payload = {
    text: "Shane's Fund — Slack integration test successful!",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: *Shane's Fund* — Slack integration test successful!",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Sent from Admin Panel at ${timestamp}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      success: false,
      message: `Slack returned ${response.status}: ${body}`,
    };
  }

  return { success: true, message: "Test message sent to Slack successfully" };
}
