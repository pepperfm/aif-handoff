import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  it("renders single block by default", () => {
    const { container } = render(<Skeleton />);
    const blocks = container.querySelectorAll("div.animate-pulse");
    expect(blocks).toHaveLength(1);
  });

  it("renders multiple blocks with count prop", () => {
    const { container } = render(<Skeleton count={3} />);
    const blocks = container.querySelectorAll("div.animate-pulse");
    expect(blocks).toHaveLength(3);
  });

  it("has animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("merges className for custom sizing", () => {
    const { container } = render(<Skeleton className="h-20 w-full" />);
    expect(container.firstChild).toHaveClass("h-20");
    expect(container.firstChild).toHaveClass("w-full");
  });
});
