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
      vi.fn(async () => {
        return {
          ok: true,
          json: async () => [],
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
});
