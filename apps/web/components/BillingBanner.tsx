"use client";
import { useEffect, useState } from "react";
import { useApi } from "../lib/use-api";

type BillingStatus = "trialing" | "active" | "suspended" | "past_due" | string;

interface WorkspaceBilling {
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function BillingBanner() {
  const { apiFetch, user } = useApi();
  const [billing, setBilling] = useState<WorkspaceBilling | null>(null);

  useEffect(() => {
    if (!user?.workspaceId) return;
    apiFetch(`/workspaces/${user.workspaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WorkspaceBilling | null) => {
        if (data) setBilling(data);
      })
      .catch(() => undefined);
  }, [user?.workspaceId]);

  if (!billing) return null;

  const { billingStatus, trialEndsAt } = billing;

  if (billingStatus === "suspended") {
    return (
      <div role="alert" className="bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
        This workspace has been suspended. Contact{" "}
        <a href="mailto:support@sensehub.app" className="underline">
          support@sensehub.app
        </a>
        .
      </div>
    );
  }

  if (billingStatus === "past_due") {
    return (
      <div role="alert" className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
        Payment overdue. Please update your billing details to avoid service interruption.
      </div>
    );
  }

  if (billingStatus === "trialing" && trialEndsAt) {
    const days = daysUntil(trialEndsAt);
    if (days <= 7 && days >= 0) {
      return (
        <div className="bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white">
          Your free trial ends in {days} day{days !== 1 ? "s" : ""}.{" "}
          <a href="/settings/billing" className="underline">
            Upgrade now
          </a>
        </div>
      );
    }
  }

  return null;
}
