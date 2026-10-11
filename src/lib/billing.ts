// Mirrors the Postgres function public.compute_bill(). All arithmetic is done in
// integer paise so floating point never leaks into a bill. Rounding is half-up.

export const COMMISSION_MIN_PCT = 0;
export const COMMISSION_MAX_PCT = 2;
export const DEFAULT_COMMISSION_PCT = 1.5;

export interface BillInput {
  totalKg: number;
  ratePerQuintal: number;
  farmerPct?: number;
  buyerPct?: number;
  advances?: number;
}

export interface BillAmounts {
  gross: number;
  farmerCommission: number;
  buyerCommission: number;
  advancesDeducted: number;
  farmerNet: number;
  buyerPayable: number;
}

const toPaise = (rupees: number) => Math.round(rupees * 100);
const toRupees = (paise: number) => paise / 100;

export function assertCommission(pct: number): void {
  if (!Number.isFinite(pct) || pct < COMMISSION_MIN_PCT || pct > COMMISSION_MAX_PCT) {
    throw new RangeError("Commission must be between 0 and 2 percent");
  }
}

/** gross = total weight (kg) / 100 * rate per quintal, rounded to paise. */
export function grossAmount(totalKg: number, ratePerQuintal: number): number {
  const kgMilli = Math.round(totalKg * 1000);
  const ratePaise = toPaise(ratePerQuintal);
  return toRupees(Math.round((kgMilli * ratePaise) / 100000));
}

export function commissionOn(gross: number, pct: number): number {
  assertCommission(pct);
  const pctHundredths = Math.round(pct * 100);
  return toRupees(Math.round((toPaise(gross) * pctHundredths) / 10000));
}

export function computeBill({
  totalKg,
  ratePerQuintal,
  farmerPct = DEFAULT_COMMISSION_PCT,
  buyerPct = DEFAULT_COMMISSION_PCT,
  advances = 0,
}: BillInput): BillAmounts {
  assertCommission(farmerPct);
  assertCommission(buyerPct);
  const gross = grossAmount(totalKg, ratePerQuintal);
  const farmerCommission = commissionOn(gross, farmerPct);
  const buyerCommission = commissionOn(gross, buyerPct);
  const advancesPaise = toPaise(advances);
  return {
    gross,
    farmerCommission,
    buyerCommission,
    advancesDeducted: toRupees(advancesPaise),
    farmerNet: toRupees(toPaise(gross) - toPaise(farmerCommission) - advancesPaise),
    buyerPayable: toRupees(toPaise(gross) + toPaise(buyerCommission)),
  };
}
