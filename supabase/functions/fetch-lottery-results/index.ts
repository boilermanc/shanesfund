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

// Jackpot data sources (NY Open Data doesn't include jackpot amounts)
const MM_JACKPOT_URL = "https://www.megamillions.com/cmspages/utilservice.asmx/GetLatestDrawData";
const PB_HOMEPAGE_URL = "https://www.powerball.com/";

// Fetch current estimated jackpot amounts from official sources
async function fetchJackpotAmounts(
  log: (msg: string) => void
): Promise<{ powerball: number | null; mega_millions: number | null }> {
  const jackpots: { powerball: number | null; mega_millions: number | null } = {
    powerball: null,
    mega_millions: null,
  };

  // Mega Millions — official JSON endpoint (returns structured jackpot data)
  try {
    log("Fetching Mega Millions jackpot from megamillions.com");
    const mmResp = await fetch(MM_JACKPOT_URL);
    if (mmResp.ok) {
      const mmData = await mmResp.json();
      // NextPrizePool = estimated jackpot for the upcoming draw
      // CurrentPrizePool = jackpot that was available for the most recent draw
      if (mmData?.Jackpot?.NextPrizePool) {
        jackpots.mega_millions = mmData.Jackpot.NextPrizePool;
        log(`Mega Millions next jackpot: $${(jackpots.mega_millions! / 1_000_000).toFixed(0)}M`);
      } else if (mmData?.Jackpot?.CurrentPrizePool) {
        jackpots.mega_millions = mmData.Jackpot.CurrentPrizePool;
        log(`Mega Millions current jackpot: $${(jackpots.mega_millions! / 1_000_000).toFixed(0)}M`);
      } else {
        log("WARNING: MM jackpot response missing prize pool fields");
      }
    } else {
      log(`WARNING: MM jackpot endpoint returned HTTP ${mmResp.status}`);
    }
  } catch (e) {
    log(`WARNING: Failed to fetch MM jackpot: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Powerball — parse from homepage HTML (no public JSON API exists)
  try {
    log("Fetching Powerball jackpot from powerball.com");
    const pbResp = await fetch(PB_HOMEPAGE_URL);
    if (pbResp.ok) {
      const html = await pbResp.text();
      // Page shows "Estimated Jackpot" followed by "$190 Million" or "$1.2 Billion"
      const match = html.match(/Estimated\s+Jackpot[^$]*?\$([\d.,]+)\s*(Million|Billion)/i);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ""));
        const multiplier = match[2].toLowerCase() === "billion" ? 1_000_000_000 : 1_000_000;
        jackpots.powerball = num * multiplier;
        log(`Powerball next jackpot: $${(jackpots.powerball! / 1_000_000).toFixed(0)}M`);
      } else {
        log("WARNING: Could not parse Powerball jackpot from homepage HTML");
      }
    } else {
      log(`WARNING: Powerball homepage returned HTTP ${pbResp.status}`);
    }
  } catch (e) {
    log(`WARNING: Failed to fetch PB jackpot: ${e instanceof Error ? e.message : String(e)}`);
  }

  return jackpots;
}

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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role (use service role client to bypass RLS on admin_users)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminRow, error: adminError } = await supabaseAdmin
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

    // Fetch jackpot amounts from official lottery sites (runs in parallel with number fetch setup)
    const jackpots = await fetchJackpotAmounts(log);

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
        multiplier = result.multiplier ? parseInt(result.multiplier, 10) : null;
      } else {
        // Mega Millions: winning_numbers has 5 numbers, mega_ball is a separate field
        const parts = result.winning_numbers.trim().split(/\s+/).map(Number);
        if (parts.length < 5) {
          log(`ERROR: Mega Millions winning_numbers has ${parts.length} numbers, expected 5`);
          results.push({ game_type: gameType, success: false, error: "Unexpected number format" });
          continue;
        }
        winningNumbers = parts.slice(0, 5);
        bonusNumber = parseInt(result.mega_ball, 10);
        drawDate = result.draw_date.split("T")[0];
        multiplier = result.multiplier ? parseInt(result.multiplier, 10) : null;
      }

      // Jackpot amount fetched from official lottery sites (MM JSON API, PB homepage scrape)
      const jackpotAmount = jackpots[gameType as keyof typeof jackpots] ?? null;
      log(`${gameType} parsed - Date: ${drawDate}, Numbers: ${winningNumbers}, Bonus: ${bonusNumber}, Multiplier: ${multiplier}, Jackpot: ${jackpotAmount ? `$${(jackpotAmount / 1_000_000).toFixed(0)}M` : "N/A"}`);

      // Build upsert payload — include jackpot_amount only if we have a value
      // so we don't overwrite a previously-set value with null
      const upsertPayload: Record<string, unknown> = {
        game_type: gameType,
        draw_date: drawDate,
        winning_numbers: winningNumbers,
        bonus_number: bonusNumber,
        multiplier: multiplier,
      };
      if (jackpotAmount !== null) {
        upsertPayload.jackpot_amount = jackpotAmount;
      }

      // Upsert into lottery_draws table
      const { error: insertError } = await supabase
        .from("lottery_draws")
        .upsert(upsertPayload, {
          onConflict: "game_type,draw_date",
          ignoreDuplicates: false,
        });

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
    const drawsProcessed = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        draws_processed: drawsProcessed,
        duration_ms: duration,
      }),
      {
        status: overallSuccess ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    log(`FATAL ERROR: ${message}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
