import { describe, expect, it } from "vitest";
import { normalizePhone, telHref, whatsappHref } from "../phone";

describe("phone helpers", () => {
  it("adds +91 to 10-digit numbers", () => {
    expect(normalizePhone("98765 43210")).toBe("919876543210");
    expect(normalizePhone("098765-43210")).toBe("919876543210");
  });
  it("keeps numbers that already carry a country code", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("919876543210");
  });
  it("builds a call link", () => {
    expect(telHref("9876543210")).toBe("tel:+919876543210");
  });
  it("builds a WhatsApp link, with optional text", () => {
    expect(whatsappHref("9876543210")).toBe("https://wa.me/919876543210");
    expect(whatsappHref("9876543210", "Hi there")).toBe("https://wa.me/919876543210?text=Hi%20there");
  });
  it("copes with empty input", () => {
    expect(normalizePhone(null)).toBe("");
  });
});
