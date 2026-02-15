import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const startTime = Date.now();
  const logs: string[] = [];
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    logs.push(entry);
    console.log(entry);
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
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
      // NY Open Data does not provide jackpot amounts
      const jackpotAmount: number | null = null;
      log(`${gameType} parsed - Date: ${drawDate}, Numbers: ${winningNumbers}, Bonus: ${bonusNumber}, Multiplier: ${multiplier}`);
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
        results.push({ game_type: gameType, success: true, draw_date: drawDate, data: insertData });
      }
    }
    const duration = Date.now() - startTime;
    log(`Completed in ${duration}ms`);
    return new Response(
      JSON.stringify({
        success: true,
        results,
        duration_ms: duration,
        logs,
      }),
      {
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
        logs,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
