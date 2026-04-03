import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { FileInput } from "@/components/ui/file-input";

describe("FileInput", () => {
  it("renders styled button with default label", () => {
    render(<FileInput />);
    expect(screen.getByRole("button", { name: /Choose file/i })).toBeDefined();
  });

  it("has a hidden file input", () => {
    const { container } = render(<FileInput />);
    const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.className).toContain("hidden");
  });

  it("accepts custom label text", () => {
    render(<FileInput label="Upload image" />);
    expect(screen.getByRole("button", { name: /Upload image/i })).toBeDefined();
  });

  it("forwards ref to the hidden input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<FileInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe("file");
  });

  it("merges className onto the button", () => {
    render(<FileInput className="mt-4" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("mt-4");
    expect(button.className).toContain("border-border");
  });

  it("passes accept prop to hidden input", () => {
    const { container } = render(<FileInput accept="image/*" />);
    const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(hiddenInput.getAttribute("accept")).toBe("image/*");
  });
});
