import { NextResponse } from "next/server";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { buildFromElementModels, layoutVertically } from "@/lib/templates";
import type {
  ElementModel,
  GeneratedWorkflow,
  WorkflowNodeConfig,
  WorkflowNodeType,
} from "@/types/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GeneratedRequest {
  description?: string;
}

interface AINodeSpec {
  type?: string;
  config?: Record<string, unknown>;
}

interface AIEdgeSpec {
  source?: number;
  target?: number;
}

/**
 * Convert an AI-produced node/edge description into a valid workflow.
 * Falls back to null whenever the shape is not sane.
 */
function sanitize(
  name: string,
  description: string,
  nodes: AINodeSpec[],
  edges: AIEdgeSpec[],
): GeneratedWorkflow | null {
  if (!Array.isArray(nodes) || nodes.length < 2) return null;

  const validTypes = Object.keys(NODE_DEFINITION_MAP) as WorkflowNodeType[];
  const mapped = nodes.map((node) => node?.type);
  if (mapped.some((type) => !validTypes.includes(type as WorkflowNodeType))) {
    return null;
  }
  if (!mapped.includes("input")) return null;
  if (!mapped.includes("output")) return null;

  const elements: ElementModel[] = [];
  for (const node of nodes) {
    const type = node.type as WorkflowNodeType;
    const defaults = NODE_DEFINITION_MAP[type].createConfig();
    const overrides = node.config ?? {};
    const config: WorkflowNodeConfig = { ...defaults, ...overrides } as WorkflowNodeConfig;
    elements.push({ type, position: { x: 0, y: 0 }, config });
  }

  layoutVertically(elements);

  const edgeSet = new Set<string>();
  const safeEdges: number[][] = [];
  for (const edge of edges ?? []) {
    const source = Number(edge?.source);
    const target = Number(edge?.target);
    if (
      !Number.isInteger(source) ||
      !Number.isInteger(target) ||
      source < 0 ||
      target < 0 ||
      source >= elements.length ||
      target >= elements.length ||
      source === target
    ) {
      continue;
    }
    const key = `${source}:${target}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    safeEdges.push([source, target]);
  }

  for (const [source, target] of safeEdges) {
    const element = elements[source];
    if (!element.edgesTo) element.edgesTo = [];
    element.edgesTo.push(target);
  }

  const result = buildFromElementModels(
    name || "AI Generated Workflow",
    description,
    elements,
  );

  if (result.edges.length === 0 || result.nodes.length < 2) return null;
  return result;
}

export async function POST(request: Request) {
  let body: GeneratedRequest;
  try {
    body = (await request.json()) as GeneratedRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ demoMode: true, workflow: null });
  }

  const systemPrompt =
    'You design AI workflows. Respond with a single JSON object: {"name": string, "nodes": [{"type": string, "config": {optional per-type fields}}], "edges": [{"source": index, "target": index}]}. Valid node types: input, aiAgent, research, ideaGenerator, writer, rewriter, qualityChecker, output. Start with an "input" node and end with an "output" node. Chain nodes so each stage feeds the next. Prefer 3-6 nodes. Output JSON only.';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Design a workflow for the following request: "${description}". Return a JSON object describing the nodes and edges.`,
                },
              ],
            },
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ demoMode: true, workflow: null });
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ demoMode: true, workflow: null });

    const parsed = JSON.parse(text) as {
      name?: string;
      nodes?: AINodeSpec[];
      edges?: AIEdgeSpec[];
    };
    const workflow = sanitize(
      parsed.name ?? "AI Generated Workflow",
      description,
      parsed.nodes ?? [],
      parsed.edges ?? [],
    );
    if (!workflow) return NextResponse.json({ demoMode: true, workflow: null });

    return NextResponse.json({ demoMode: false, workflow });
  } catch {
    return NextResponse.json({ demoMode: true, workflow: null });
  }
}