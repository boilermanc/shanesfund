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

const GEMINI_MODEL = "gemini-2.0-flash";

const PROMPT = `You are reading a photo of a US lottery ticket. Extract ALL plays printed on it.

For each play return:
- gameType: exactly "powerball" or "mega_millions" (determine from the ticket header/logo)
- numbers: array of exactly 5 main numbers (integers)
- bonusNumber: the Powerball or Mega Ball number (single integer)
- multiplier: the Power Play or Megaplier value as integer, or null if not shown
- drawDate: draw date as "YYYY-MM-DD", or null if not readable

Rules:
- Read the EXACT numbers printed on the ticket. Do not guess.
- Mega Millions: 5 numbers 1-70, Mega Ball 1-25
- Powerball: 5 numbers 1-69, Powerball 1-26
- If the ticket shows "QP" that means Quick Pick — still read the numbers.

Return ONLY valid JSON, no markdown fences, no explanation:
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
          maxOutputTokens: 1024,
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

    // Strip markdown code fences if present
    const jsonStr = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-ticket error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
