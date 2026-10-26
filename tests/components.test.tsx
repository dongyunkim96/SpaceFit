import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import Templates from "../src/pages/Templates";
import { Dialog } from "../src/components/Dialog";
afterEach(cleanup);
describe("template discovery", () => {
  it("filters rooms and blank variants", () => {
    render(
      <MemoryRouter>
        <Templates />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("article")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Home office" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "The focused space" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Furnishing"), {
      target: { value: "blank" },
    });
    expect(
      screen.getByRole("link", { name: "Use this layout" }),
    ).toHaveAttribute("href", "/new?template=home-office&furnished=false");
  });
  it("shows an actionable empty result", () => {
    render(
      <MemoryRouter>
        <Templates />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Search templates"), {
      target: { value: "not-a-room" },
    });
    expect(
      screen.getByRole("button", { name: "Clear filters" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });
});
describe("accessible modal semantics", () => {
  it("provides an accessible title and a close action", () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    let closed = false;
    render(
      <Dialog
        title="Rename your space"
        onClose={() => {
          closed = true;
        }}
      >
        <input aria-label="Space name" />
      </Dialog>,
    );
    expect(
      screen.getByRole("dialog", { name: "Rename your space" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(closed).toBe(true);
  });
});
