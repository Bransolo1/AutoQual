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

    expect(screen.getByText("Sensehub Auto Qual")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore Features" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights Review" })).toBeInTheDocument();
    expect(screen.getByText("What you get")).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
  });
});
