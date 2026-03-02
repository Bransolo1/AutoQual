import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ApprovalsPage from "./page";

vi.mock("next/navigation", () => {
  return {
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("ApprovalsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/approvals?")) {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }
        if (url.includes("/analysis/study/")) {
          return {
            ok: true,
            json: async () => ({ gapCount: 0 }),
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }),
    );
  });

  it("renders evidence requirements and empty state", async () => {
    render(<ApprovalsPage />);

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.startsWith("Evidence requirements: insight set approvals require clips")),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText((content) => content.startsWith("No approvals yet."))).toBeInTheDocument();
    });
  });

  it("disables approval when evidence gaps exist", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/approvals?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: "approval-1",
              linkedEntityType: "insight_set",
              linkedEntityId: "study-1",
              status: "requested",
              requestedByUserId: "demo-user",
            },
          ],
        } as Response;
      }
      if (url.includes("/analysis/study/study-1/evidence-coverage")) {
        return {
          ok: true,
          json: async () => ({ gapCount: 2 }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText("Evidence gaps: 2")).toBeInTheDocument();
    });
    const approveButton = screen.getByRole("button", { name: "Approve" });
    expect(approveButton).toBeDisabled();
  });
});
