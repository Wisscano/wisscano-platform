import { NextRequest, NextResponse } from "next/server";
import { submitProcurementRequest } from "@/actions/procurement";
import { createProcurementRequestSchema } from "@/validation/procurement";

/**
 * REST alternative to the submitProcurementRequest server action — useful
 * for future non-Next.js clients (mobile app, partner integrations, CRM
 * webhooks) without duplicating business logic. The server action remains
 * the primary path for the web UI.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProcurementRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const result = await submitProcurementRequest(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
