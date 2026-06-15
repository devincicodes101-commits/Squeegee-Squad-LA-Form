/**
 * POST /api/analyze-photo
 *
 * Server-side image analysis for the estimator. Accepts a base64-encoded image
 * (data URL) and an optional service hint, calls OpenAI's vision-capable model
 * (gpt-4o), and returns structured JSON the form can use to auto-fill fields.
 *
 * The OPENAI_API_KEY is read server-side only — never exposed to the browser.
 * The model is instructed to return JSON conforming to a fixed schema so the
 * form can trust the keys; missing fields are returned as empty/null.
 */
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Conservative request body cap — keeps photos under ~5 MB at base64 inflation.
const MAX_BODY_BYTES = 7_000_000;

type AnalysisResult = {
  service_guess: string;
  quantity_estimate: number | null;
  quantity_unit: string;
  stories: number | null;
  condition: "Standard" | "Moderate buildup/staining" | "Heavy buildup/staining" | "Severe/restoration" | "";
  access: "Easy" | "Moderate" | "Difficult" | "Height/Lift/Rope" | "";
  risk_factors: string[];
  confidence: "High" | "Medium" | "Low";
  reasoning: string;
};

type ApiResponse =
  | { ok: true; data: AnalysisResult }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are a property assessment assistant for Squeegee Squad LA, a Los Angeles cleaning services company. You analyze a single photo and return ONLY a JSON object that matches this exact schema:

{
  "service_guess": "<one of: Residential Window Cleaning | Commercial Window Cleaning | High-Access/Lift Window Cleaning | Residential Pressure Washing | Commercial Pressure Washing | Solar Panel Cleaning | Gutter Cleaning | Trash Chute Cleaning | Parking Garage Deep Cleaning | Building Washing / Soft Washing | Sidewalks / Lots / Walkways | Other>",
  "quantity_estimate": <number or null — how many panes, sqft, panels, linear ft, etc. of the implied unit; null if undetectable>,
  "quantity_unit": "<panes | sqft | panels | linear ft | enclosures | docks | spaces | floors | empty string if unknown>",
  "stories": <integer 1-10 or null — number of stories visible if applicable>,
  "condition": "<Standard | Moderate buildup/staining | Heavy buildup/staining | Severe/restoration | empty string if not assessable>",
  "access": "<Easy | Moderate | Difficult | Height/Lift/Rope | empty string if not assessable>",
  "risk_factors": ["<short string per visible risk: hard water staining, gated access, locked area, water containment needed, lift required, steep roof, etc.>"],
  "confidence": "<High | Medium | Low>",
  "reasoning": "<one sentence — what you saw that drove the assessment>"
}

GUIDELINES:
- Use "Standard" when the surface looks clean and you'd expect routine maintenance.
- Use "Moderate buildup/staining" for visible dirt, water spots, mild grime.
- Use "Heavy buildup/staining" for significant grime, staining, mold, residue.
- Use "Severe/restoration" only when there's caked-on damage or restoration-level work needed.
- "Height/Lift/Rope" access is for 4+ stories or any high-rise.
- Be CONSERVATIVE with quantity — under-estimate rather than guess high.
- Confidence "Low" if photo is blurry, dark, partial, or you're guessing more than seeing.
- Return ONLY the JSON. No prose, no markdown fences, no explanation around it.`;

function json(body: ApiResponse, status: number): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(
      { ok: false, error: "Vision analysis is not configured on this server." },
      500
    );
  }

  // Guard against oversized bodies (Next.js doesn't enforce a hard cap by default).
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(
      { ok: false, error: "Image too large. Please use a photo under 5 MB." },
      413
    );
  }

  let body: { image?: string; service_context?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const image = (body.image || "").trim();
  if (!image.startsWith("data:image/")) {
    return json(
      { ok: false, error: "Image must be a data URL (data:image/...)." },
      400
    );
  }

  const serviceContext = (body.service_context || "").trim();
  const userPrompt = serviceContext
    ? `The rep has tentatively selected service: "${serviceContext}". Bias your service_guess accordingly unless the photo strongly contradicts.`
    : `No service has been pre-selected. Infer the most likely service from the photo.`;

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: image, detail: "low" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return json({ ok: false, error: "Vision model returned no content." }, 502);
    }

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(raw) as AnalysisResult;
    } catch {
      return json(
        { ok: false, error: "Vision model returned malformed JSON." },
        502
      );
    }

    // Normalize / safety-default missing fields so the form can trust shape.
    const safe: AnalysisResult = {
      service_guess: String(parsed.service_guess || ""),
      quantity_estimate:
        typeof parsed.quantity_estimate === "number" ? parsed.quantity_estimate : null,
      quantity_unit: String(parsed.quantity_unit || ""),
      stories: typeof parsed.stories === "number" ? parsed.stories : null,
      condition: (parsed.condition || "") as AnalysisResult["condition"],
      access: (parsed.access || "") as AnalysisResult["access"],
      risk_factors: Array.isArray(parsed.risk_factors)
        ? parsed.risk_factors.map((r) => String(r))
        : [],
      confidence: (["High", "Medium", "Low"].includes(parsed.confidence)
        ? parsed.confidence
        : "Low") as AnalysisResult["confidence"],
      reasoning: String(parsed.reasoning || ""),
    };

    return json({ ok: true, data: safe }, 200);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected vision-API error.";
    return json({ ok: false, error: message }, 502);
  }
}
