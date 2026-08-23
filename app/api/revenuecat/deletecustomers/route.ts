import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

type DeleteResult = {
  appUserId: string;
  status: "deleted" | "failed";
  httpStatus?: number;
  error?: string;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: staffUser, error: staffError } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (staffError || !staffUser || staffUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secretApiKey = process.env.DELETE_RC_SECRET_API_KEY;

  if (!secretApiKey) {
    return NextResponse.json({ error: "RevenueCat API key is not configured" }, { status: 500 });
  }

  const body = await request.json();
  const customerIds: string[] = Array.isArray(body?.customerIds) ? body.customerIds.filter((value: unknown): value is string => typeof value === "string") : [];

  if (customerIds.length === 0) {
    return NextResponse.json({ error: "No customer IDs provided" }, { status: 400 });
  }

  const invalidCustomerIds = customerIds.filter(customerId => !customerId.startsWith("$RCAnonymousID:"));

  if (invalidCustomerIds.length > 0) {
    return NextResponse.json({ error: "Only RevenueCat anonymous customer IDs may be deleted", invalidCustomerIds }, { status: 400 });
  }

  const results: DeleteResult[] = [];

  for (const appUserId of customerIds) {
    try {
      const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${secretApiKey}` },
        cache: "no-store",
      });

      if (response.ok) {
        results.push({ appUserId, status: "deleted", httpStatus: response.status });
      } else {
        const errorText = await response.text();
        results.push({ appUserId, status: "failed", httpStatus: response.status, error: errorText || response.statusText });
      }
    } catch (error) {
      results.push({ appUserId, status: "failed", error: error instanceof Error ? error.message : "Unknown RevenueCat deletion error" });
    }

    await delay(1000);
  }

  const deleted = results.filter(result => result.status === "deleted").length;
  const failed = results.length - deleted;

  return NextResponse.json({ requested: customerIds.length, deleted, failed, results });
}