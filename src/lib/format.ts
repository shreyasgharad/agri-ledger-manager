const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num3 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

export const formatINR = (value: number | null | undefined): string => inr.format(value ?? 0);

export const formatKg = (kg: number | null | undefined): string => `${num3.format(kg ?? 0)} kg`;

export const formatQuintal = (kg: number | null | undefined): string =>
  `${num3.format((kg ?? 0) / 100)} qtl`;

export const formatDate = (iso: string | Date | null | undefined): string => {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
