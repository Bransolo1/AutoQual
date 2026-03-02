import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StudiesPage from "./page";

describe("StudiesPage", () => {
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

  it("renders analysis quality guidance", () => {
    render(<StudiesPage />);

    expect(screen.getByText("Studies")).toBeInTheDocument();
    expect(screen.getByText("Analysis quality")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Evidence gaps will block insight set approvals until clips or transcript spans are attached.",
      ),
    ).toBeInTheDocument();
  });
});
