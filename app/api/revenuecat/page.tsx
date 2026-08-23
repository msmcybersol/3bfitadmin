"use client";

import { ChangeEvent, useMemo, useState } from "react";

type RevenueCatCustomer = {
  app_user_id: string;
  has_made_sandbox_purchase: string;
  latest_entitlement: string;
  latest_product: string;
  first_purchase_at: string;
  total_spent: string;
  latest_store: string;
};

type DeleteResult = {
  appUserId: string;
  status: "deleted" | "failed";
  httpStatus?: number;
  error?: string;
};

type DeleteResponse = {
  requested: number;
  deleted: number;
  failed: number;
  results: DeleteResult[];
  error?: string;
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
}

function parseCsv(content: string): RevenueCatCustomer[] {
  const lines = content.replace(/\r/g, "").split("\n").filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));

    return {
      app_user_id: row.app_user_id ?? "",
      has_made_sandbox_purchase: row.has_made_sandbox_purchase ?? "",
      latest_entitlement: row.latest_entitlement ?? "",
      latest_product: row.latest_product ?? "",
      first_purchase_at: row.first_purchase_at ?? "",
      total_spent: row.total_spent ?? "",
      latest_store: row.latest_store ?? "",
    };
  });
}

function isEligible(customer: RevenueCatCustomer) {
  const totalSpent = Number(customer.total_spent || "0");

  return customer.app_user_id.startsWith("$RCAnonymousID:") &&
    customer.has_made_sandbox_purchase.toLowerCase() !== "true" &&
    customer.latest_entitlement === "" &&
    customer.latest_product === "" &&
    customer.first_purchase_at === "" &&
    totalSpent === 0;
}

export default function RevenueCatPage() {
  const [customers, setCustomers] = useState<RevenueCatCustomer[]>([]);
  const [fileName, setFileName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse | null>(null);

  const eligibleCustomers = useMemo(() => customers.filter(isEligible), [customers]);
  const anonymousCustomers = useMemo(() => customers.filter(customer => customer.app_user_id.startsWith("$RCAnonymousID:")), [customers]);
  const customersWithPurchases = useMemo(() => customers.filter(customer => Number(customer.total_spent || "0") > 0 || customer.first_purchase_at !== ""), [customers]);
  const customersWithEntitlements = useMemo(() => customers.filter(customer => customer.latest_entitlement !== ""), [customers]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const content = await file.text();
    const parsedCustomers = parseCsv(content);

    setFileName(file.name);
    setCustomers(parsedCustomers);
    setDeleteResponse(null);
  }

  async function handleDeleteEligible() {
    if (eligibleCustomers.length === 0 || deleting) {
      return;
    }

    const confirmed = window.confirm(`Delete ${eligibleCustomers.length} eligible RevenueCat anonymous customers? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setDeleteResponse(null);

    try {
      const response = await fetch("/api/revenuecat/deletecustomers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerIds: eligibleCustomers.map(customer => customer.app_user_id) }),
      });

      const result = await response.json() as DeleteResponse;
      setDeleteResponse(result);
    } catch (error) {
      setDeleteResponse({
        requested: eligibleCustomers.length,
        deleted: 0,
        failed: eligibleCustomers.length,
        results: [],
        error: error instanceof Error ? error.message : "Unable to complete RevenueCat deletion.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">RevenueCat Customer Cleanup</h1>
          <p className="mt-2 text-slate-600">Import a RevenueCat customer CSV, review anonymous customer eligibility, and remove selected development data.</p>
        </div>

        <section className="mb-6 rounded-lg bg-white p-6 shadow">
          <label className="mb-2 block font-semibold text-slate-900">RevenueCat Customer Export</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="block w-full text-sm text-slate-700" />
          {fileName && <p className="mt-3 text-sm text-slate-500">Loaded: {fileName}</p>}
        </section>

        {customers.length > 0 && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-white p-5 shadow">
                <div className="text-sm text-slate-500">Imported</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{customers.length}</div>
              </div>
              <div className="rounded-lg bg-white p-5 shadow">
                <div className="text-sm text-slate-500">Anonymous</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{anonymousCustomers.length}</div>
              </div>
              <div className="rounded-lg bg-white p-5 shadow">
                <div className="text-sm text-slate-500">Purchases</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{customersWithPurchases.length}</div>
              </div>
              <div className="rounded-lg bg-white p-5 shadow">
                <div className="text-sm text-slate-500">Entitlements</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{customersWithEntitlements.length}</div>
              </div>
              <div className="rounded-lg bg-white p-5 shadow">
                <div className="text-sm text-slate-500">Eligible</div>
                <div className="mt-1 text-3xl font-bold text-emerald-600">{eligibleCustomers.length}</div>
              </div>
            </section>

            <section className="mb-6 rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Eligible Anonymous Customers</h2>
                  <p className="mt-1 text-sm text-slate-500">No sandbox purchase, entitlement, product, purchase date, or recorded spend.</p>
                </div>
                <button type="button" disabled={eligibleCustomers.length === 0 || deleting} onClick={handleDeleteEligible} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {deleting ? "Deleting..." : `Delete ${eligibleCustomers.length} Customers`}
                </button>
              </div>

              <div className="max-h-96 overflow-auto rounded border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">App User ID</th>
                      <th className="px-4 py-3">Sandbox Purchase</th>
                      <th className="px-4 py-3">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleCustomers.map(customer => (
                      <tr key={customer.app_user_id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{customer.app_user_id}</td>
                        <td className="px-4 py-3 text-slate-700">{customer.has_made_sandbox_purchase || "false"}</td>
                        <td className="px-4 py-3 text-slate-700">{customer.total_spent || "0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {deleteResponse && (
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-slate-900">Deletion Results</h2>
            {deleteResponse.error ? (
              <p className="mt-3 text-red-600">{deleteResponse.error}</p>
            ) : (
              <div className="mt-4 flex gap-8">
                <div><span className="font-semibold">Requested:</span> {deleteResponse.requested}</div>
                <div><span className="font-semibold text-emerald-600">Deleted:</span> {deleteResponse.deleted}</div>
                <div><span className="font-semibold text-red-600">Failed:</span> {deleteResponse.failed}</div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}