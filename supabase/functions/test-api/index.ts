import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://shanesfund.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only allow requests to these domains
const ALLOWED_HOSTS = [
  "data.ny.gov",
  "api.collectapi.com",
  "dataapi.io",
  "api.stripe.com",
];

// Block requests to private/internal IP ranges (SSRF protection)
const BLOCKED_PATTERNS = [
  /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^127\./, /^0\./, /^localhost$/i,
];

function isAllowedUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  // Must be HTTPS
  if (parsed.protocol !== "https:") {
    return false;
  }

  // Check against allowlist
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Server misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // --- Auth: verify JWT ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid authorization token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the user's JWT to verify identity
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // --- Admin check ---
  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return new Response(
      JSON.stringify({ success: false, error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // --- Process request ---
  const startTime = Date.now();
  try {
    const requestBody = await req.json();
    const { url, method = "GET", body, connection_id } = requestBody;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connection_id) {
      return new Response(
        JSON.stringify({ success: false, error: "connection_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- URL allowlist check ---
    if (!isAllowedUrl(url)) {
      return new Response(
        JSON.stringify({ success: false, error: "URL not allowed. Only requests to approved API domains are permitted." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Block private IP ranges (SSRF protection) ---
    const parsedUrl = new URL(url);
    if (BLOCKED_PATTERNS.some(p => p.test(parsedUrl.hostname))) {
      return new Response(
        JSON.stringify({ success: false, error: "Blocked destination" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Look up API key server-side ---
    const { data: connection, error: connError } = await supabase
      .from("api_connections")
      .select("api_key, additional_config")
      .eq("id", connection_id)
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ success: false, error: "API connection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connection.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "API connection has no key configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build headers server-side using the retrieved key
    const requestHeaders: Record<string, string> = {
      "authorization": `apikey ${connection.api_key}`,
      "content-type": "application/json",
      ...connection.additional_config?.headers,
    };

    console.log(`Admin ${user.id} calling URL: ${url} via connection ${connection_id}`);

    const response = await fetch(url, {
      method,
      headers: new Headers(requestHeaders),
      body: method !== "GET" && body ? JSON.stringify(body) : undefined,
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { raw: responseText };
    }

    // Log to database (never log request headers — they contain API keys)
    try {
      await supabase.from("api_logs").insert({
        api_connection_id: connection_id || null,
        endpoint: url,
        method,
        request_body: body || null,
        response_status: response.status,
        response_body: responseBody,
        response_time_ms: responseTime,
        success: response.ok,
        error_message: response.ok ? null : responseBody?.message || "Request failed",
        triggered_by: `admin_test (user:${user.id})`,
      });
    } catch (dbError) {
      console.error("DB log error:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        body: responseBody,
        responseTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
