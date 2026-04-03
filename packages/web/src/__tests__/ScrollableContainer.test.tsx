import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ScrollableContainer } from "@/components/ui/scrollable-container";

describe("ScrollableContainer", () => {
  it("renders children", () => {
    render(
      <ScrollableContainer>
        <p>Hello world</p>
      </ScrollableContainer>,
    );
    expect(screen.getByText("Hello world")).toBeDefined();
  });

  it("applies overflow-y-auto by default", () => {
    const { container } = render(
      <ScrollableContainer>
        <p>Content</p>
      </ScrollableContainer>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-y-auto");
  });

  it("accepts maxHeight class", () => {
    const { container } = render(
      <ScrollableContainer maxHeight="max-h-96">
        <p>Content</p>
      </ScrollableContainer>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("max-h-96");
  });

  it("merges className", () => {
    const { container } = render(
      <ScrollableContainer className="bg-red-500">
        <p>Content</p>
      </ScrollableContainer>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-red-500");
    expect(wrapper.className).toContain("overflow-y-auto");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScrollableContainer ref={ref}>
        <p>Content</p>
      </ScrollableContainer>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
