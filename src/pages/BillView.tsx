import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBill } from "@/hooks/useAgri";
import { formatDate, formatINR, formatKg, formatQuintal } from "@/lib/format";
import type { PaymentMethod } from "@/types/agri";

type Paper = "a4" | "thermal";

const BillView = () => {
  const { id } = useParams();
  const { data, isLoading, error, addPayment, isPaying } = useBill(id);
  const [paper, setPaper] = useState<Paper>("a4");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");

  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Loading bill...</p>;
  if (error || !data) return <p className="py-10 text-center text-red-600">Could not load this bill.</p>;

  const { bill, payments, settings, lot, paid, due } = data;
  const isFarmer = bill.party_type === "farmer";
  const party = isFarmer ? bill.farmers : bill.buyers;
  const partyName = isFarmer ? bill.farmers?.name : bill.buyers?.name;
  const item = bill.bill_items?.[0];
  const business = settings?.business_name ?? "AgriAggregator";
  const gross = Number(bill.gross_amount);

  const shareText = [
    `*${business}*`,
    `${isFarmer ? "Farmer" : "Buyer"} bill ${bill.number} (${formatDate(bill.issued_at)})`,
    item ? `${item.description}: ${item.qty_bags ?? ""} bags, ${formatKg(Number(item.weight_kg))} @ ${formatINR(Number(bill.rate_per_quintal))}/qtl` : "",
    `Gross: ${formatINR(gross)}`,
    `Commission (${bill.commission_pct}%): ${isFarmer ? "-" : "+"}${formatINR(Number(bill.commission_amount))}`,
    isFarmer && Number(bill.advances_deducted) > 0 ? `Advances: -${formatINR(Number(bill.advances_deducted))}` : "",
    `*${isFarmer ? "Amount payable to you" : "Amount to pay"}: ${formatINR(Number(bill.net_amount))}*`,
  ].filter(Boolean).join("\n");
  const phone = (party?.phone ?? "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(shareText)}`;

  const pay = () => {
    addPayment({ amount: Number(amount), method });
    setAmount("");
  };

  return (
    <div className="space-y-4">
      <div className="print-hidden space-y-4">
        <Link to="/bills" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> All bills
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button asChild variant="outline" className="h-12">
            <a href={waUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a>
          </Button>
          <ToggleGroup type="single" value={paper} onValueChange={(v) => v && setPaper(v as Paper)}>
            <ToggleGroupItem value="a4">A4</ToggleGroupItem>
            <ToggleGroupItem value="thermal">80 mm</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Printable bill */}
      <div className={`print-area bg-white text-black mx-auto border rounded-md p-6 ${paper === "thermal" ? "paper-thermal max-w-[80mm] text-xs p-2" : "max-w-[210mm]"}`}>
        <div className="text-center border-b pb-2 mb-3">
          <h2 className="text-lg font-bold">{business}</h2>
          {settings?.address && <p>{settings.address}</p>}
          {(settings?.phone || settings?.gstin) && <p>{[settings?.phone && `Ph: ${settings.phone}`, settings?.gstin && `GSTIN: ${settings.gstin}`].filter(Boolean).join("  ")}</p>}
          <p className="font-bold mt-2 tracking-wide">{isFarmer ? "FARMER BILL" : "BUYER BILL"}</p>
        </div>

        <div className="flex justify-between gap-4 mb-3">
          <div>
            <p className="font-semibold">{partyName} {party && "code" in party && party.code ? <span className="font-mono text-xs">({party.code})</span> : null}</p>
            {!isFarmer && bill.buyers?.firm_name && <p>{bill.buyers.firm_name}</p>}
            {party?.phone && <p>{party.phone}</p>}
            {party?.address && <p>{party.address}</p>}
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold">{bill.number}</p>
            <p>{formatDate(bill.issued_at)}</p>
            {lot && <p className="text-xs">Lot {lot.code}</p>}
          </div>
        </div>

        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="border-y">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Bags</th>
              <th className="text-right py-1">Weight</th>
              <th className="text-right py-1">Rate/qtl</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">{item?.description}</td>
              <td className="text-right">{item?.qty_bags}</td>
              <td className="text-right">{formatKg(Number(bill.total_kg))}<br /><span className="text-xs">({formatQuintal(Number(bill.total_kg))})</span></td>
              <td className="text-right">{formatINR(Number(bill.rate_per_quintal))}</td>
              <td className="text-right">{formatINR(gross)}</td>
            </tr>
          </tbody>
        </table>

        <div className="ml-auto w-full sm:w-2/3 space-y-1">
          <Line label="Gross amount" value={formatINR(gross)} />
          <Line label={`Commission (${bill.commission_pct}%)`} value={`${isFarmer ? "-" : "+"} ${formatINR(Number(bill.commission_amount))}`} />
          {isFarmer && Number(bill.advances_deducted) > 0 && <Line label="Advances deducted" value={`- ${formatINR(Number(bill.advances_deducted))}`} />}
          <div className="border-t pt-1">
            <Line strong label={isFarmer ? "Net payable to farmer" : "Total payable by buyer"} value={formatINR(Number(bill.net_amount))} />
          </div>
          {paid > 0 && <Line label="Paid" value={formatINR(paid)} />}
          {paid > 0 && <Line strong label="Balance due" value={formatINR(due)} />}
        </div>

        <div className="flex justify-between mt-10 pt-6 text-xs">
          <span>{isFarmer ? "Farmer" : "Buyer"} signature</span>
          <span>Authorised signature</span>
        </div>
        {settings?.bill_footer && <p className="text-center text-xs mt-4">{settings.bill_footer}</p>}
      </div>

      {/* Payments (not printed) */}
      <Card className="print-hidden max-w-3xl">
        <CardHeader><CardTitle>Payments · due {formatINR(due)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {payments.length > 0 && (
            <ul className="divide-y rounded-md border">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between px-3 py-2 text-sm">
                  <span>{formatDate(p.paid_at)} · <span className="uppercase">{p.method}</span>{p.reference ? ` · ${p.reference}` : ""}</span>
                  <span className="font-medium">{formatINR(Number(p.amount))}</span>
                </li>
              ))}
            </ul>
          )}
          {due > 0 && (
            <div className="space-y-2">
              <Label>Record payment</Label>
              <div className="flex flex-wrap gap-2">
                <Input className="h-12 w-40 text-lg" inputMode="decimal" type="number" min="0" placeholder="₹ amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <ToggleGroup type="single" value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)}>
                  <ToggleGroupItem value="cash">Cash</ToggleGroupItem>
                  <ToggleGroupItem value="upi">UPI</ToggleGroupItem>
                  <ToggleGroupItem value="bank">Bank</ToggleGroupItem>
                </ToggleGroup>
                <Button className="h-12" disabled={!(Number(amount) > 0) || Number(amount) > due + 0.001 || isPaying} onClick={pay}>Save</Button>
                <Button className="h-12" variant="outline" onClick={() => setAmount(String(due))}>Full {formatINR(due)}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={`flex justify-between ${strong ? "font-bold" : ""}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default BillView;
