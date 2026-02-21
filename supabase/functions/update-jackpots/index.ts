import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://shanesfund.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Jackpot data sources
const MM_JACKPOT_URL = "https://www.megamillions.com/cmspages/utilservice.asmx/GetLatestDrawData";
const PB_HOMEPAGE_URL = "https://www.powerball.com/";

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

  // --- Authorized — fetch and update jackpots ---
  const startTime = Date.now();
  const log = (message: string) => {
    console.log(`[${new Date().toISOString()}] [update-jackpots] ${message}`);
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const updated: string[] = [];

    // --- Mega Millions jackpot ---
    // JSON API is the only reliable source (homepage uses JS-rendered content)
    try {
      let mmJackpot: number | null = null;

      try {
        log("Fetching MM jackpot from JSON API");
        const mmResp = await fetch(MM_JACKPOT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (mmResp.ok) {
          const mmRaw = await mmResp.json();
          // ASMX services wrap response in {"d": "<json string>"}
          const mmInner = mmRaw?.d ?? mmRaw;
          const mmData = typeof mmInner === "string" ? JSON.parse(mmInner) : mmInner;
          log(`MM JSON API raw response: ${JSON.stringify(mmData).slice(0, 500)}`);
          // Try multiple paths — API response structure may vary
          mmJackpot = mmData?.Jackpot?.NextPrizePool
            ?? mmData?.Jackpot?.CurrentPrizePool
            ?? mmData?.NextPrizePool
            ?? mmData?.CurrentPrizePool
            ?? null;
          // Sanity check: MM jackpot minimum is $20M
          if (mmJackpot !== null && mmJackpot < 20_000_000) {
            log(`WARNING: MM jackpot $${mmJackpot} seems too low, ignoring`);
            mmJackpot = null;
          }
          if (mmJackpot !== null) {
            log(`MM jackpot: $${(mmJackpot / 1_000_000).toFixed(0)}M`);
          } else {
            log("WARNING: MM JSON API response missing valid jackpot fields");
          }
        } else {
          log(`WARNING: MM JSON API returned HTTP ${mmResp.status}`);
        }
      } catch (e) {
        log(`WARNING: MM JSON API failed: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Update DB if we got a valid jackpot
      if (mmJackpot !== null) {
        const { data: latestMm } = await supabase
          .from("lottery_draws")
          .select("draw_date")
          .eq("game_type", "mega_millions")
          .order("draw_date", { ascending: false })
          .limit(1)
          .single();

        if (latestMm) {
          const { error } = await supabase
            .from("lottery_draws")
            .update({ jackpot_amount: mmJackpot })
            .eq("game_type", "mega_millions")
            .eq("draw_date", latestMm.draw_date);

          if (error) {
            log(`ERROR: Failed to update MM jackpot: ${error.message}`);
          } else {
            log(`Updated MM jackpot: $${(mmJackpot / 1_000_000).toFixed(0)}M on ${latestMm.draw_date}`);
            updated.push("mega_millions");
          }
        } else {
          log("WARNING: No MM draw record found to update");
        }
      }
    } catch (e) {
      log(`WARNING: MM jackpot fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // --- Powerball jackpot (parsed from homepage HTML) ---
    try {
      log("Fetching Powerball jackpot");
      const pbResp = await fetch(PB_HOMEPAGE_URL);
      if (pbResp.ok) {
        const html = await pbResp.text();
        const match = html.match(/Estimated\s+Jackpot[^$]*?\$([\d.,]+)\s*(Million|Billion)/i);
        if (match) {
          const num = parseFloat(match[1].replace(/,/g, ""));
          const multiplier = match[2].toLowerCase() === "billion" ? 1_000_000_000 : 1_000_000;
          const pbJackpot = num * multiplier;

          const { data: latestPb } = await supabase
            .from("lottery_draws")
            .select("draw_date")
            .eq("game_type", "powerball")
            .order("draw_date", { ascending: false })
            .limit(1)
            .single();

          if (latestPb) {
            const { error } = await supabase
              .from("lottery_draws")
              .update({ jackpot_amount: pbJackpot })
              .eq("game_type", "powerball")
              .eq("draw_date", latestPb.draw_date);

            if (error) {
              log(`ERROR: Failed to update PB jackpot: ${error.message}`);
            } else {
              log(`Updated PB jackpot: $${(pbJackpot / 1_000_000).toFixed(0)}M on ${latestPb.draw_date}`);
              updated.push("powerball");
            }
          } else {
            log("WARNING: No PB draw record found to update");
          }
        } else {
          log("WARNING: Could not parse PB jackpot from homepage");
        }
      } else {
        log(`WARNING: PB homepage returned HTTP ${pbResp.status}`);
      }
    } catch (e) {
      log(`WARNING: PB jackpot fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    const duration = Date.now() - startTime;
    log(`Completed in ${duration}ms — updated: ${updated.join(", ") || "none"}`);

    return new Response(
      JSON.stringify({
        success: updated.length > 0,
        updated,
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    log(`FATAL ERROR: ${message}`);

    return new Response(
      JSON.stringify({ success: false, error: message, duration_ms: duration }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
