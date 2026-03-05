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

  it("renders study wizard with prompt framework", () => {
    render(<StudiesPage />);

    expect(screen.getByText("Study wizard")).toBeInTheDocument();
    expect(screen.getByText("Create study")).toBeInTheDocument();
  });
});
