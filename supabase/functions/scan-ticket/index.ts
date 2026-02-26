import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://shanesfund.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

const GEMINI_MODEL = "gemini-2.5-flash";

const PROMPT = `You are an expert OCR system for US lottery tickets. Your job is to extract EVERY play printed on the ticket with 100% accuracy.

TICKET LAYOUT:
- Tickets have one or more play rows, labeled A, B, C, D, E (up to 5 plays per slip).
- Each play row contains a set of main numbers followed by a bonus ball number.
- Powerball tickets: 5 main numbers (1-69) + 1 Powerball (1-26). The Powerball is often marked "PB" or appears after a gap/separator.
- Mega Millions tickets: 5 main numbers (1-70) + 1 Mega Ball (1-25). The Mega Ball is often marked "MB" or appears after a gap/separator.
- Numbers may be printed with leading spaces (e.g., " 7" for single digits).
- "QP" means Quick Pick — the numbers are still printed, read them.
- The multiplier (Power Play / Megaplier) is typically shown once for the whole ticket, not per play.

INSTRUCTIONS:
1. Identify the game type from the ticket header/logo.
2. Read EACH play row independently. Do not mix numbers between rows.
3. For each row, read the numbers LEFT to RIGHT exactly as printed.
4. Count carefully: you MUST have exactly 5 main numbers and exactly 1 bonus number per play.
5. If a number looks ambiguous (e.g., could be 6 or 8), look at the print style and context to decide.
6. Look for the draw date — usually near the top or bottom of the ticket.

DOUBLE CHECK: After reading, verify each play has exactly 5 main numbers + 1 bonus. If you have 4 or 6 main numbers, re-read that row.

For each play return:
- gameType: exactly "powerball" or "mega_millions"
- numbers: array of exactly 5 main numbers (integers)
- bonusNumber: the Powerball or Mega Ball (single integer)
- multiplier: Power Play or Megaplier value as integer, or null
- drawDate: "YYYY-MM-DD" or null if not readable

Return ONLY valid JSON, no markdown, no explanation:
{"plays":[{"gameType":"...","numbers":[1,2,3,4,5],"bonusNumber":6,"multiplier":null,"drawDate":null}]}`;

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // --- Parse request ---
  let image: string;
  try {
    const body = await req.json();
    image = body.image; // base64 string (no data: prefix)
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (!image) {
    return new Response(
      JSON.stringify({ error: "No image provided" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini API not configured" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // --- Call Gemini ---
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        {
          status: 502,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const geminiResult = await geminiRes.json();
    const rawText =
      geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "No result from Gemini", plays: [] }),
        {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    // Log raw Gemini response for debugging
    console.log("Raw Gemini response:", rawText);

    // Strip markdown code fences if present (Gemini often wraps JSON in ```json ... ```)
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }
    cleaned = cleaned.trim();

    // Parse the cleaned JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", rawText);
      console.error("Cleaned text:", cleaned);
      console.error("Parse error:", parseErr);
      return new Response(
        JSON.stringify({
          error: "Couldn't read ticket. Try again with better lighting or enter numbers manually.",
          plays: [],
        }),
        {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-ticket error:", err);
    return new Response(
      JSON.stringify({
        error: "Couldn't read ticket. Try again or enter numbers manually.",
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
