/**
 * POST /api/estimate
 *
 * Server-side proxy to the n8n pricing webhook. The browser never talks to n8n
 * directly — this keeps N8N_WEBHOOK_URL out of the client bundle and sidesteps
 * CORS. Accepts internal FormState, validates it, maps to the wire payload,
 * forwards it, unwraps the response, and returns a clean envelope.
 */

import { formSchema } from "@/lib/schema";
import { toN8nPayload, unwrapEstimateResult } from "@/lib/payload";
import type { EstimateApiResponse } from "@/lib/types";

// Always run dynamically — this proxies a live POST and must never be cached.
export const dynamic = "force-dynamic";

const WEBHOOK_TIMEOUT_MS = 30_000;

function json(body: EstimateApiResponse, status: number): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return json(
      { ok: false, error: "Server is not configured (missing webhook URL)." },
      500
    );
  }

  // Parse the incoming form state.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  // Re-validate server-side; never trust the client.
  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path.join(".") || "form";
    return json(
      { ok: false, error: `Validation failed: ${field} — ${first?.message}` },
      400
    );
  }

  const payload = toN8nPayload(parsed.data);

  // Forward to n8n with a hard timeout (cold starts can be slow).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      return json(
        {
          ok: false,
          error: `Pricing service returned an error (${res.status}). Please retry.`,
        },
        502
      );
    }

    const raw = await res.json();
    const data = unwrapEstimateResult(raw);
    return json({ ok: true, data }, 200);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return json(
        {
          ok: false,
          error:
            "The pricing service took too long to respond. Your inputs are saved — please retry.",
        },
        504
      );
    }
    const message =
      err instanceof Error ? err.message : "Unexpected error contacting the pricing service.";
    return json({ ok: false, error: message }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
