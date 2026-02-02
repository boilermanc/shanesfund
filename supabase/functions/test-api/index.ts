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
  const startTime = Date.now();
  try {
    const requestBody = await req.json();
    const { url, method = "GET", headers = {}, body, connection_id } = requestBody;
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Calling URL:", url);
    console.log("Headers:", JSON.stringify(headers));
    const response = await fetch(url, {
      method,
      headers: new Headers(headers),
      body: method !== "GET" && body ? JSON.stringify(body) : undefined,
    });
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText.substring(0, 200));
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { raw: responseText };
    }
    // Log to database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
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
          triggered_by: "admin_test",
        });
      }
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
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
