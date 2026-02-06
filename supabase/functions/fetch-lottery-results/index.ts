import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
// CollectAPI endpoints
const LOTTERY_ENDPOINTS = {
  powerball: "https://api.collectapi.com/chancegame/usaPowerball",
  mega_millions: "https://api.collectapi.com/chancegame/usaMegaMillions",
};
// Parse date like "Jan 31, 2026" to "2026-01-31"
function parseDrawDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}
// Parse jackpot like "$59 Million" to number
function parseJackpot(jackpotStr: string): number | null {
  if (!jackpotStr) return null;
  const cleaned = jackpotStr.replace(/[$,]/g, "").toLowerCase();
  const match = cleaned.match(/([\d.]+)\s*(million|billion)?/);
  if (!match) return null;
  let amount = parseFloat(match[1]);
  if (match[2] === "million") amount *= 1_000_000;
  if (match[2] === "billion") amount *= 1_000_000_000;
  return amount;
}
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
    // Get API key from environment variable
    const apiKey = Deno.env.get("COLLECTAPI_KEY");
    if (!apiKey) {
      log("ERROR: COLLECTAPI_KEY environment variable not set");
      throw new Error("CollectAPI key not configured");
    }
    log("CollectAPI key retrieved from environment");
    const results: any[] = [];
    for (const gameType of gameTypes) {
      const endpoint = LOTTERY_ENDPOINTS[gameType as keyof typeof LOTTERY_ENDPOINTS];
      if (!endpoint) {
        log(`ERROR: Unknown game type: ${gameType}`);
        continue;
      }
      log(`Fetching ${gameType} from ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "authorization": `apikey ${apiKey}`,
          "content-type": "application/json",
        },
      });
      const data = await response.json();
      log(`${gameType} API response status: ${response.status}`);
      if (!data.success || !data.result) {
        log(`ERROR: ${gameType} API returned unsuccessful response`);
        results.push({ game_type: gameType, success: false, error: "API error" });
        continue;
      }
      const result = data.result;
      log(`${gameType} raw result: ${JSON.stringify(result)}`);
      // Parse the numbers based on game type
      let winningNumbers: number[];
      let bonusNumber: number;
      let multiplier: number | null = null;
      let drawDate: string;
      if (gameType === "powerball") {
        // Powerball format: result.numbers is an OBJECT with n1-n5 and pb
        const nums = result.numbers;
        winningNumbers = [
          parseInt(nums.n1),
          parseInt(nums.n2),
          parseInt(nums.n3),
          parseInt(nums.n4),
          parseInt(nums.n5),
        ];
        bonusNumber = parseInt(nums.pb);
        drawDate = parseDrawDate(nums.date || result.date);
        multiplier = result.powerplay ? parseInt(result.powerplay) : null;
      } else {
        // Mega Millions format: result.numbers is an OBJECT with n1-n5 and mb
        const nums = result.numbers;
        winningNumbers = [
          parseInt(nums.n1),
          parseInt(nums.n2),
          parseInt(nums.n3),
          parseInt(nums.n4),
          parseInt(nums.n5),
        ];
        bonusNumber = parseInt(nums.mb || nums.megaball);
        drawDate = parseDrawDate(nums.date || result.date);
        multiplier = result.megaplier ? parseInt(result.megaplier) : null;
      }
      const jackpotAmount = parseJackpot(result.jackpot);
      log(`${gameType} parsed - Date: ${drawDate}, Numbers: ${winningNumbers}, Bonus: ${bonusNumber}, Multiplier: ${multiplier}, Jackpot: ${jackpotAmount}`);
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
