import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://shanesfund.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// NY Open Data API endpoints (free, no API key required)
const NY_OPEN_DATA_ENDPOINTS = {
  powerball: "https://data.ny.gov/resource/d6yy-54nr.json?$limit=1&$order=draw_date%20DESC",
  mega_millions: "https://data.ny.gov/resource/5xaw-6ayf.json?$limit=1&$order=draw_date%20DESC",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

  // --- Auth: cron secret OR JWT + admin role ---
  const authHeader = req.headers.get("authorization") ?? "";
  const cronHeader = req.headers.get("x-cron-secret") ?? "";

  const isCron =
    (cronSecret && cronHeader === cronSecret) ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isCron) {
    // Verify JWT via Supabase auth
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: adminRow, error: adminError } = await supabaseAuth
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // --- Authorized — proceed with lottery fetch ---
  const startTime = Date.now();
  const log = (message: string) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };

  try {
    // Get game type from request (default to both)
    let gameTypes: string[] = ["powerball", "mega_millions"];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.game_type) {
        gameTypes = [body.game_type];
      }
    }

    log(`Starting lottery fetch for: ${gameTypes.join(", ")}`);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any[] = [];

    for (const gameType of gameTypes) {
      const endpoint = NY_OPEN_DATA_ENDPOINTS[gameType as keyof typeof NY_OPEN_DATA_ENDPOINTS];
      if (!endpoint) {
        log(`ERROR: Unknown game type: ${gameType}`);
        continue;
      }

      log(`Fetching ${gameType} from NY Open Data`);

      const response = await fetch(endpoint);

      if (!response.ok) {
        log(`ERROR: ${gameType} API returned status ${response.status}`);
        results.push({ game_type: gameType, success: false, error: `HTTP ${response.status}` });
        continue;
      }

      const data = await response.json();
      log(`${gameType} API response status: ${response.status}`);

      if (!Array.isArray(data) || data.length === 0) {
        log(`ERROR: ${gameType} API returned empty results`);
        results.push({ game_type: gameType, success: false, error: "No data returned" });
        continue;
      }

      const result = data[0];
      log(`${gameType} raw result: ${JSON.stringify(result)}`);

      // Parse the numbers based on game type
      let winningNumbers: number[];
      let bonusNumber: number;
      let multiplier: number | null = null;
      let drawDate: string;

      if (gameType === "powerball") {
        // Powerball: winning_numbers has 6 space-separated numbers, last is the Powerball
        const parts = result.winning_numbers.trim().split(/\s+/).map(Number);
        if (parts.length < 6) {
          log(`ERROR: Powerball winning_numbers has ${parts.length} numbers, expected 6`);
          results.push({ game_type: gameType, success: false, error: "Unexpected number format" });
          continue;
        }
        winningNumbers = parts.slice(0, 5);
        bonusNumber = parts[5];
        drawDate = result.draw_date.split("T")[0];
        multiplier = result.multiplier ? parseInt(result.multiplier) : null;
      } else {
        // Mega Millions: winning_numbers has 5 numbers, mega_ball is a separate field
        const parts = result.winning_numbers.trim().split(/\s+/).map(Number);
        winningNumbers = parts;
        bonusNumber = parseInt(result.mega_ball);
        drawDate = result.draw_date.split("T")[0];
        multiplier = result.multiplier ? parseInt(result.multiplier) : null;
      }

      // NY Open Data does not provide jackpot amounts.
      // Jackpot amounts must be set manually via admin panel or a secondary API.
      // When null, check-wins will flag jackpot wins for manual review instead of storing $0.
      const jackpotAmount: number | null = null;
      log(`${gameType} parsed - Date: ${drawDate}, Numbers: ${winningNumbers}, Bonus: ${bonusNumber}, Multiplier: ${multiplier}, Jackpot: ${jackpotAmount ?? "unknown"}`);

      // Upsert into lottery_draws table
      const { data: insertData, error: insertError } = await supabase
        .from("lottery_draws")
        .upsert(
          {
            game_type: gameType,
            draw_date: drawDate,
            winning_numbers: winningNumbers,
            bonus_number: bonusNumber,
            multiplier: multiplier,
            jackpot_amount: jackpotAmount,
          },
          {
            onConflict: "game_type,draw_date",
          }
        )
        .select()
        .single();

      if (insertError) {
        log(`ERROR: Failed to save ${gameType} results: ${insertError.message}`);
        results.push({ game_type: gameType, success: false, error: insertError.message });
      } else {
        log(`SUCCESS: Saved ${gameType} draw for ${drawDate}`);
        results.push({ game_type: gameType, success: true, draw_date: drawDate });
      }
    }

    const duration = Date.now() - startTime;
    log(`Completed in ${duration}ms`);

    const overallSuccess = results.some(r => r.success);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results,
        duration_ms: duration,
      }),
      {
        status: overallSuccess ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`FATAL ERROR: ${error.message}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
