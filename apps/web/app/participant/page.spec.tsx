import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ParticipantPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("token=abc123&studyId=study-1"),
  useRouter: () => ({ push: pushMock }),
}));

describe("ParticipantPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders the email input, consent checkbox, and disabled button", () => {
    render(<ParticipantPage />);

    expect(screen.getByLabelText("Your email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(/I agree to participate in this research interview/),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Begin interview" });
    expect(button).toBeDisabled();
  });

  it("keeps button disabled when only email is filled", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(screen.getByRole("button", { name: "Begin interview" })).toBeDisabled();
  });

  it("keeps button disabled when only consent is checked", () => {
    render(<ParticipantPage />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(screen.getByRole("button", { name: "Begin interview" })).toBeDisabled();
  });

  it("enables button when valid email and consent are both provided", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    const checkbox = screen.getByRole("checkbox");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(checkbox);

    expect(screen.getByRole("button", { name: "Begin interview" })).toBeEnabled();
  });

  it("keeps button disabled for invalid email even with consent", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    const checkbox = screen.getByRole("checkbox");

    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    fireEvent.click(checkbox);

    expect(screen.getByRole("button", { name: "Begin interview" })).toBeDisabled();
  });

  it("shows validation error on submit with invalid email", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    const checkbox = screen.getByRole("checkbox");

    fireEvent.change(emailInput, { target: { value: "bad" } });
    fireEvent.click(checkbox);

    const form = emailInput.closest("form")!;
    fireEvent.submit(form);

    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
  });

  it("clears validation error when user starts typing again", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    const checkbox = screen.getByRole("checkbox");

    fireEvent.change(emailInput, { target: { value: "bad" } });
    fireEvent.click(checkbox);
    fireEvent.submit(emailInput.closest("form")!);

    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: "fixed@example.com" } });
    expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
  });

  it("navigates to interview page with email query param on valid submit", () => {
    render(<ParticipantPage />);
    const emailInput = screen.getByLabelText("Your email");
    const checkbox = screen.getByRole("checkbox");

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: "Begin interview" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/interview?token=abc123&email=user%40test.com",
    );
  });

  it("displays Study ID when present", () => {
    render(<ParticipantPage />);
    expect(screen.getByText("Study ID: study-1")).toBeInTheDocument();
  });

  it("preserves existing page content (hero, instruction cards, checklist)", () => {
    render(<ParticipantPage />);

    expect(screen.getByRole("heading", { name: "Welcome to your research interview" })).toBeInTheDocument();
    expect(screen.getByText("Speak naturally")).toBeInTheDocument();
    expect(screen.getByText("Take your time")).toBeInTheDocument();
    expect(screen.getByText("Be specific")).toBeInTheDocument();
    expect(screen.getByText("Allow microphone access when prompted")).toBeInTheDocument();
  });
});
