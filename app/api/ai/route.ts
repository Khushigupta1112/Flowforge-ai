import { NextResponse } from "next/server";
import { mockResultForPrompt } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-pro",
]);

interface AIRequest {
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  /** Clean upstream content this node consumes (never the node's own instructions). */
  context?: string;
  /** Short subject propagated from the workflow's root input. */
  subject?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

export async function POST(request: Request) {
  let body: AIRequest;
  try {
    body = (await request.json()) as AIRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      result: mockResultForPrompt(
        prompt,
        body.systemPrompt ?? "",
        body.context,
        body.subject,
      ),
      demoMode: true,
    });
  }

  const model = ALLOWED_MODELS.has(body.model ?? "")
    ? (body.model as string)
    : "gemini-2.5-flash";
  const temperature = Math.min(1, Math.max(0, body.temperature ?? 0.7));

  try {
    const wantsJson = /respond with a single json object/i.test(body.systemPrompt ?? "");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(body.systemPrompt
            ? {
                systemInstruction: {
                  parts: [{ text: body.systemPrompt }],
                },
              }
            : {}),
          generationConfig: {
            temperature,
            ...(wantsJson ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Gemini request failed (${response.status}): ${text}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (data.error?.message || !textPart) {
      throw new Error(data.error?.message ?? "Empty response from Gemini.");
    }

    return NextResponse.json({ result: textPart, demoMode: false });
  } catch (error) {
    return NextResponse.json({
      result: mockResultForPrompt(
        prompt,
        body.systemPrompt ?? "",
        body.context,
        body.subject,
      ),
      demoMode: true,
      warning:
        error instanceof Error ? error.message : "Gemini request failed",
    });
  }
}