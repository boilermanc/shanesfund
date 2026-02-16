import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://shanesfund.vercel.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Prize tables — identical to the original client-side logic
const POWERBALL_PRIZES: Record<string, number> = {
  jackpot: 0, // Variable
  match_5: 1_000_000,
  match_4_bonus: 50_000,
  match_4: 100,
  match_3_bonus: 100,
  match_3: 7,
  match_2_bonus: 7,
  match_1_bonus: 4,
  match_bonus: 4,
};

const MEGA_MILLIONS_PRIZES: Record<string, number> = {
  jackpot: 0, // Variable
  match_5: 1_000_000,
  match_4_bonus: 10_000,
  match_4: 500,
  match_3_bonus: 200,
  match_3: 10,
  match_2_bonus: 10,
  match_1_bonus: 4,
  match_bonus: 2,
};

function determinePrizeTier(
  mainMatches: number,
  bonusMatch: boolean
): string | null {
  if (mainMatches === 5 && bonusMatch) return "jackpot";
  if (mainMatches === 5) return "match_5";
  if (mainMatches === 4 && bonusMatch) return "match_4_bonus";
  if (mainMatches === 4) return "match_4";
  if (mainMatches === 3 && bonusMatch) return "match_3_bonus";
  if (mainMatches === 3) return "match_3";
  if (mainMatches === 2 && bonusMatch) return "match_2_bonus";
  if (mainMatches === 1 && bonusMatch) return "match_1_bonus";
  if (mainMatches === 0 && bonusMatch) return "match_bonus";
  return null;
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
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // --- Authorized — proceed with win checking ---
  const startTime = Date.now();
  const log = (message: string) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };

  try {
    // Parse request body — accept game_type or draw_id
    let gameTypes: Array<"powerball" | "mega_millions"> = [
      "powerball",
      "mega_millions",
    ];
    let drawDate: string | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.game_type) {
        gameTypes = [body.game_type];
      }
      if (body.draw_date) {
        drawDate = body.draw_date;
      }
    }

    log(`Starting win check for: ${gameTypes.join(", ")}${drawDate ? ` on ${drawDate}` : " (latest)"}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Array<{
      game_type: string;
      draw_date: string;
      tickets_checked: number;
      wins_found: number;
      prize_tiers: Record<string, number>;
      jackpot_amount: number | null;
      success: boolean;
      error?: string;
    }> = [];

    for (const gameType of gameTypes) {
      // Get the draw to check against
      let drawQuery = supabase
        .from("lottery_draws")
        .select("*")
        .eq("game_type", gameType);

      if (drawDate) {
        drawQuery = drawQuery.eq("draw_date", drawDate);
      } else {
        drawQuery = drawQuery.order("draw_date", { ascending: false }).limit(1);
      }

      const { data: draw, error: drawError } = await drawQuery.single();

      if (drawError || !draw) {
        log(`No draw data found for ${gameType}${drawDate ? ` on ${drawDate}` : ""}`);
        results.push({
          game_type: gameType,
          draw_date: drawDate || "latest",
          tickets_checked: 0,
          wins_found: 0,
          prize_tiers: {},
          jackpot_amount: null,
          success: false,
          error: "No draw data found",
        });
        continue;
      }

      log(`Checking ${gameType} draw on ${draw.draw_date}: numbers ${draw.winning_numbers}, bonus ${draw.bonus_number}`);

      // Get all unchecked tickets for this game + draw date
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("game_type", gameType)
        .eq("draw_date", draw.draw_date)
        .eq("checked", false);

      if (ticketsError) {
        log(`ERROR fetching tickets for ${gameType}: ${ticketsError.message}`);
        results.push({
          game_type: gameType,
          draw_date: draw.draw_date,
          tickets_checked: 0,
          wins_found: 0,
          prize_tiers: {},
          jackpot_amount: draw.jackpot_amount ?? null,
          success: false,
          error: ticketsError.message,
        });
        continue;
      }

      if (!tickets || tickets.length === 0) {
        log(`No unchecked tickets for ${gameType} on ${draw.draw_date}`);
        results.push({
          game_type: gameType,
          draw_date: draw.draw_date,
          tickets_checked: 0,
          wins_found: 0,
          prize_tiers: {},
          jackpot_amount: draw.jackpot_amount ?? null,
          success: true,
        });
        continue;
      }

      log(`Found ${tickets.length} unchecked tickets for ${gameType}`);

      const winningNumbers = draw.winning_numbers as number[];
      const winningBonus = draw.bonus_number as number;
      const prizeTable =
        gameType === "mega_millions" ? MEGA_MILLIONS_PRIZES : POWERBALL_PRIZES;

      let winsFound = 0;
      const prizeTiers: Record<string, number> = {};

      for (const ticket of tickets) {
        const ticketNumbers = ticket.numbers as number[];
        const ticketBonus = ticket.bonus_number as number;

        // Count main number matches
        const mainMatches = ticketNumbers.filter((n: number) =>
          winningNumbers.includes(n)
        ).length;
        const bonusMatch = ticketBonus === winningBonus;

        const prizeTier = determinePrizeTier(mainMatches, bonusMatch);

        if (prizeTier) {
          // For jackpot, use the actual jackpot amount from the draw data.
          // For non-jackpot tiers, use the fixed prize table.
          // If jackpot amount is unknown, store null (not 0) to flag for review.
          let prizeAmount: number | null;
          if (prizeTier === "jackpot") {
            prizeAmount = draw.jackpot_amount ?? null;
            if (prizeAmount === null) {
              log(`WARNING: Jackpot win detected for ticket ${ticket.id} but jackpot amount is unknown — storing null for manual review`);
            }
          } else {
            prizeAmount = prizeTable[prizeTier] || 0;
          }

          // Upsert winning record (idempotent on ticket_id + draw_date)
          const { error: winError } = await supabase.from("winnings").upsert(
            {
              ticket_id: ticket.id,
              pool_id: ticket.pool_id,
              prize_amount: prizeAmount,
              prize_tier: prizeTier,
              numbers_matched: mainMatches,
              bonus_matched: bonusMatch,
              draw_date: draw.draw_date,
            },
            { onConflict: "ticket_id" }
          );

          if (winError) {
            log(`ERROR inserting win for ticket ${ticket.id}: ${winError.message}`);
          } else {
            winsFound++;
            prizeTiers[prizeTier] = (prizeTiers[prizeTier] || 0) + 1;

            // Log the win in activity_log
            const { error: activityError } = await supabase.from("activity_log").insert({
              user_id: ticket.entered_by,
              pool_id: ticket.pool_id,
              action: "win_detected",
              details: { amount: prizeAmount, prize_tier: prizeTier, needs_review: prizeAmount === null },
            });
            if (activityError) {
              log(`WARNING: Failed to log activity for ticket ${ticket.id}: ${activityError.message}`);
            }
          }

          // Mark ticket as winner
          const { error: updateWinError } = await supabase
            .from("tickets")
            .update({ checked: true, is_winner: true })
            .eq("id", ticket.id);
          if (updateWinError) {
            log(`WARNING: Failed to mark ticket ${ticket.id} as winner: ${updateWinError.message}`);
          }
        } else {
          // Mark ticket as checked (no win)
          const { error: updateCheckError } = await supabase
            .from("tickets")
            .update({ checked: true, is_winner: false })
            .eq("id", ticket.id);
          if (updateCheckError) {
            log(`WARNING: Failed to mark ticket ${ticket.id} as checked: ${updateCheckError.message}`);
          }
        }
      }

      log(`${gameType}: checked ${tickets.length} tickets, found ${winsFound} wins`);
      results.push({
        game_type: gameType,
        draw_date: draw.draw_date,
        tickets_checked: tickets.length,
        wins_found: winsFound,
        prize_tiers: prizeTiers,
        jackpot_amount: draw.jackpot_amount ?? null,
        success: true,
      });
    }

    const duration = Date.now() - startTime;
    log(`Completed in ${duration}ms`);

    const totalChecked = results.reduce((s, r) => s + r.tickets_checked, 0);
    const totalWins = results.reduce((s, r) => s + r.wins_found, 0);
    const overallSuccess = results.some(r => r.success);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        checked_count: totalChecked,
        wins_found: totalWins,
        results,
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
