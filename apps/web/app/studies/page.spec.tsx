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
    // localStorage is used by the wizard to persist state
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("renders the study wizard with step navigation", () => {
    render(<StudiesPage />);

    expect(screen.getByText("Study wizard")).toBeInTheDocument();
    expect(
      screen.getByText("Step-by-step setup for briefs, recruitment, moderation, and activation."),
    ).toBeInTheDocument();
    // Step labels should all be rendered
    expect(screen.getByText(/Objective/)).toBeInTheDocument();
    expect(screen.getByText(/Recruitment/)).toBeInTheDocument();
  });
});
