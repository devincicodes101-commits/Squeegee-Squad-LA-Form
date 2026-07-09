/**
 * POST /api/analyze-photo
 *
 * Server-side image analysis for the estimator. Accepts one OR many base64
 * data-URL images and returns a single combined AnalysisResult across the
 * whole photo set — one GPT-4o Vision call, one verdict.
 *
 * The OPENAI_API_KEY is read server-side only — never exposed to the browser.
 * The model is instructed to return JSON matching a fixed schema so the
 * form can trust the keys; missing fields are returned as empty/null.
 *
 * Request body (both shapes accepted for backward compatibility):
 *   { image: "data:image/…;base64,…", service_context?: string }
 *   { images: ["data:image/…;base64,…", …], service_context?: string }
 */
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Conservative request-body cap. Each ~5MB image at base64 inflation ≈ 6.7MB
// of JSON; give ourselves headroom for 8-ish photos in one shot before we
// start refusing. Rare cases beyond this can chunk client-side later.
const MAX_BODY_BYTES = 60_000_000;

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

const SYSTEM_PROMPT = `You are a property assessment assistant for Squeegee Squad LA, a Los Angeles cleaning services company. You may receive ONE or MANY photos of the same job. Look at all of them together as evidence of the same property/site, and return ONLY a JSON object that matches this exact schema:

{
  "service_guess": "<one of: Residential Window Cleaning | Commercial Window Cleaning | High-Access/Lift Window Cleaning | Residential Pressure Washing | Commercial Pressure Washing | Solar Panel Cleaning | Gutter Cleaning | Trash Chute Cleaning | Parking Garage Deep Cleaning | Building Washing / Soft Washing | Sidewalks / Lots / Walkways | Other>",
  "quantity_estimate": <number or null — total across ALL the photos for the implied unit; null if undetectable>,
  "quantity_unit": "<panes | sqft | panels | linear ft | enclosures | docks | spaces | floors | empty string if unknown>",
  "stories": <integer 1-10 or null — number of stories visible if applicable>,
  "condition": "<Standard | Moderate buildup/staining | Heavy buildup/staining | Severe/restoration | empty string if not assessable>",
  "access": "<Easy | Moderate | Difficult | Height/Lift/Rope | empty string if not assessable>",
  "risk_factors": ["<short string per visible risk: hard water staining, gated access, locked area, water containment needed, lift required, steep roof, etc.>"],
  "confidence": "<High | Medium | Low>",
  "reasoning": "<one sentence — what you saw across the photos that drove the assessment>"
}

GUIDELINES:
- Treat ALL photos as evidence of the SAME job. Combine what you see.
- For quantity_estimate: report the TOTAL across the job (sum unique surfaces you can see), not per-photo. If photos show overlapping areas of the same wall, don't double-count.
- Use "Standard" when the surfaces look clean and you'd expect routine maintenance.
- Use "Moderate buildup/staining" for visible dirt, water spots, mild grime.
- Use "Heavy buildup/staining" for significant grime, staining, mold, residue.
- Use "Severe/restoration" only for caked-on damage or restoration-level work.
- "Height/Lift/Rope" access is for 4+ stories or any high-rise.
- Be CONSERVATIVE with quantity — under-estimate rather than guess high.
- Confidence "High" only if photos are clear and cover the job well. Drop to Medium/Low if any are blurry, dark, partial, or contradict each other.
- If the photos disagree (e.g., one shows clean, another shows heavy grime), pick the WORSE condition and explain in reasoning.
- Return ONLY the JSON. No prose, no markdown fences, no explanation around it.`;

function json(body: ApiResponse, status: number): Response {
  return Response.json(body, { status });
}

function normalizeImages(body: {
  image?: unknown;
  images?: unknown;
}): string[] {
  const collected: string[] = [];
  if (Array.isArray(body.images)) {
    for (const v of body.images) {
      if (typeof v === "string" && v.startsWith("data:image/")) collected.push(v);
    }
  }
  if (typeof body.image === "string" && body.image.startsWith("data:image/")) {
    collected.push(body.image);
  }
  return collected;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(
      { ok: false, error: "Vision analysis is not configured on this server." },
      500,
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(
      { ok: false, error: "Photo batch is too large. Split into smaller uploads (each photo under 5 MB)." },
      413,
    );
  }

  let body: { image?: unknown; images?: unknown; service_context?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const images = normalizeImages(body);
  if (images.length === 0) {
    return json(
      { ok: false, error: "No valid images provided. Send images as data URLs (data:image/...)." },
      400,
    );
  }

  const serviceContext = (typeof body.service_context === "string" ? body.service_context : "").trim();
  const userPrompt = serviceContext
    ? `The rep has tentatively selected service: "${serviceContext}". Bias your service_guess accordingly unless the photos strongly contradict. You are looking at ${images.length} photo${images.length > 1 ? "s" : ""} of the same job — analyze them together.`
    : `No service has been pre-selected. Infer the most likely service. You are looking at ${images.length} photo${images.length > 1 ? "s" : ""} of the same job — analyze them together.`;

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...images.map(
              (image) =>
                ({
                  type: "image_url" as const,
                  image_url: { url: image, detail: "low" as const },
                }),
            ),
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
        502,
      );
    }

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
