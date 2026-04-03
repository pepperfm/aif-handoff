import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState message="Empty" description="Try adding something" />);
    expect(screen.getByText("Try adding something")).toBeInTheDocument();
  });

  it("renders icon slot", () => {
    render(<EmptyState message="Empty" icon={<span data-testid="icon">icon</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<EmptyState message="Empty" action={<button type="button">Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(<EmptyState message="Empty" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders without optional props", () => {
    const { container } = render(<EmptyState message="Just a message" />);
    expect(screen.getByText("Just a message")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
