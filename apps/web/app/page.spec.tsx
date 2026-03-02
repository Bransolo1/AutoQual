import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

describe("home", () => {
  it("renders primary navigation and hero content", async () => {
    render(await HomePage());

    expect(screen.getByText("OpenQual")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a Study" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure API Key" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How It Works" })).toBeInTheDocument();
    expect(screen.getByText("Why OpenQual?")).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
  });
});
