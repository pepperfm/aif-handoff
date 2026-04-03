import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttachmentChip } from "@/components/ui/attachment-chip";

describe("AttachmentChip", () => {
  it("renders file name", () => {
    render(<AttachmentChip name="readme.md" />);
    expect(screen.getByText("readme.md")).toBeDefined();
  });

  it("shows paperclip icon", () => {
    const { container } = render(<AttachmentChip name="file.txt" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("shows remove button when onRemove is provided", () => {
    const onRemove = vi.fn();
    render(<AttachmentChip name="file.txt" onRemove={onRemove} />);
    const removeBtn = screen.getByRole("button", { name: "Remove" });
    expect(removeBtn).toBeDefined();
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("hides remove button when no onRemove", () => {
    render(<AttachmentChip name="file.txt" />);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("truncates long names", () => {
    const { container } = render(
      <AttachmentChip name="this-is-a-very-long-filename-that-should-be-truncated.tsx" />,
    );
    const nameSpan = container.querySelector(".truncate");
    expect(nameSpan).toBeTruthy();
    expect(nameSpan?.className).toContain("max-w-[150px]");
  });

  it("merges className", () => {
    const { container } = render(<AttachmentChip name="file.txt" className="ml-2" />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.className).toContain("ml-2");
    expect(chip.className).toContain("border-border");
  });
});
