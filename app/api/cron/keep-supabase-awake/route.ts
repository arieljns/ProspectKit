import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema/companies";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: companies.id })
    .from(companies)
    .limit(1);

  return NextResponse.json({
    ok: true,
    databaseReachable: true,
    hasCompanies: rows.length > 0,
    checkedAt: new Date().toISOString(),
  });
}
