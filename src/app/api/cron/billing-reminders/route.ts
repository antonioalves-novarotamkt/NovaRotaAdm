import { NextRequest, NextResponse } from "next/server";
import { runBillingReminders } from "@/lib/billing-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBillingReminders();
  return NextResponse.json(result);
}
