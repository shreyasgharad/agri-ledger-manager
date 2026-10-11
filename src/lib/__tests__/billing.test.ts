import { describe, expect, it } from "vitest";
import { commissionOn, computeBill, grossAmount } from "../billing";
import { formatINR, formatQuintal } from "../format";

describe("grossAmount", () => {
  it("converts kg to quintal times rate", () => {
    expect(grossAmount(100, 5000)).toBe(5000);
    expect(grossAmount(1234.5, 4800)).toBe(59256);
  });
  it("rounds to paise half-up", () => {
    expect(grossAmount(0.005, 100)).toBe(0.01); // 0.005 kg * 100/100 = 0.005 -> 0.01
    expect(grossAmount(33.333, 4999.99)).toBe(1666.65);
  });
});

describe("computeBill", () => {
  it("matches the database sample: 10000 gross, 1.5% each, 500 advance", () => {
    const r = computeBill({ totalKg: 200, ratePerQuintal: 5000, advances: 500 });
    expect(r.gross).toBe(10000);
    expect(r.farmerCommission).toBe(150);
    expect(r.buyerCommission).toBe(150);
    expect(r.farmerNet).toBe(9350);
    expect(r.buyerPayable).toBe(10150);
  });
  it("supports 2% on both sides", () => {
    const r = computeBill({ totalKg: 200, ratePerQuintal: 5000, farmerPct: 2, buyerPct: 2 });
    expect(r.farmerNet).toBe(9800);
    expect(r.buyerPayable).toBe(10200);
  });
  it("allows different percentages per party", () => {
    const r = computeBill({ totalKg: 200, ratePerQuintal: 5000, farmerPct: 1.5, buyerPct: 2 });
    expect(r.farmerCommission).toBe(150);
    expect(r.buyerCommission).toBe(200);
  });
  it("lets advances exceed the payout (negative net is visible, not hidden)", () => {
    const r = computeBill({ totalKg: 10, ratePerQuintal: 1000, advances: 500 });
    expect(r.gross).toBe(100);
    expect(r.farmerNet).toBe(100 - 1.5 - 500);
  });
  it("rejects commission outside 0..2", () => {
    expect(() => computeBill({ totalKg: 100, ratePerQuintal: 100, farmerPct: 2.5 })).toThrow(RangeError);
    expect(() => computeBill({ totalKg: 100, ratePerQuintal: 100, buyerPct: -0.1 })).toThrow(RangeError);
  });
  it("has no floating point drift", () => {
    const r = computeBill({ totalKg: 333.333, ratePerQuintal: 4321.12, advances: 0.1 });
    for (const v of Object.values(r)) expect(Math.round(v * 100)).toBeCloseTo(v * 100, 6);
  });
});

describe("commissionOn", () => {
  it("rounds half up", () => {
    expect(commissionOn(0.5, 1)).toBe(0.01); // 0.005 -> 0.01
    expect(commissionOn(100.1, 1.5)).toBe(1.5); // 1.5015 -> 1.50
  });
});

describe("format", () => {
  it("formats rupees in en-IN grouping", () => {
    expect(formatINR(1234567.5)).toContain("12,34,567.50");
  });
  it("formats quintals", () => {
    expect(formatQuintal(150)).toBe("1.5 qtl");
  });
});
