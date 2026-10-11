import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityPicker } from "@/components/common/EntityPicker";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useBagTypes, useBuyers, useLot } from "@/hooks/useAgri";
import { computeBill } from "@/lib/billing";
import { formatDate, formatINR, formatKg, formatQuintal } from "@/lib/format";

const COMMISSION_OPTIONS = ["1", "1.25", "1.5", "1.75", "2"];

const LotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, addBag, deleteBag, addBid, deleteBid, confirmSale, cancelLot, issueBills, isIssuing } = useLot(id);
  const { data: bagTypes = [] } = useBagTypes();
  const { buyers } = useBuyers();

  const [weight, setWeight] = useState("");
  const [bagTypeId, setBagTypeId] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [rate, setRate] = useState("");
  const [farmerPct, setFarmerPct] = useState("1.5");
  const [buyerPct, setBuyerPct] = useState("1.5");
  const [advanceIds, setAdvanceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!bagTypeId && bagTypes.length) setBagTypeId(bagTypes.find((b) => b.name === "Jute")?.id ?? bagTypes[0].id);
  }, [bagTypes, bagTypeId]);

  useEffect(() => {
    if (data) setAdvanceIds(data.advances.map((a) => a.id));
  }, [data?.advances.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useMemo(() => {
    if (!data?.sale) return null;
    const advances = data.advances.filter((a) => advanceIds.includes(a.id)).reduce((s, a) => s + Number(a.amount), 0);
    return computeBill({
      totalKg: Number(data.sale.total_kg),
      ratePerQuintal: Number(data.sale.rate_per_quintal),
      farmerPct: Number(farmerPct),
      buyerPct: Number(buyerPct),
      advances,
    });
  }, [data, farmerPct, buyerPct, advanceIds]);

  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Loading lot...</p>;
  if (error || !data) return <p className="py-10 text-center text-red-600">Could not load this lot.</p>;

  const { lot, bags, bids, sale, advances, bills, totals } = data;
  const editable = lot.status === "open";
  const topBid = bids[0];
  const farmerBill = bills.find((b) => b.party_type === "farmer");
  const buyerBill = bills.find((b) => b.party_type === "buyer");

  const submitBag = () => {
    const w = Number(weight);
    if (!(w > 0)) return;
    addBag({ weight_kg: w, bag_type_id: bagTypeId || null, seq: bags.length + 1 });
    setWeight("");
  };

  const submitBid = () => {
    const r = Number(rate);
    if (!buyerId || !(r > 0)) return;
    addBid({ buyer_id: buyerId, rate_per_quintal: r });
    setRate("");
  };

  const issue = async () => {
    if (!sale) return;
    const res = await issueBills({ sale_id: sale.id, farmer_pct: Number(farmerPct), buyer_pct: Number(buyerPct), advance_ids: advanceIds });
    navigate(`/bills/${res.farmer_bill_id}`);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Link to="/lots" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> All lots
      </Link>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{lot.farmers?.name} <span className="font-mono text-sm text-muted-foreground">{lot.farmers?.code}</span></h1>
              <p className="text-sm text-muted-foreground">{lot.crops?.name} · {lot.code} · {formatDate(lot.lot_date)}</p>
            </div>
            <StatusBadge status={lot.status} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div><p className="text-2xl font-bold">{totals.bag_count}</p><p className="text-xs text-muted-foreground">bags</p></div>
            <div><p className="text-2xl font-bold">{formatKg(totals.total_kg)}</p><p className="text-xs text-muted-foreground">weight</p></div>
            <div><p className="text-2xl font-bold">{formatQuintal(totals.total_kg)}</p><p className="text-xs text-muted-foreground">quintal</p></div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Weighing */}
      <Card>
        <CardHeader><CardTitle>1. Weigh bags</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {editable && (
            <div className="flex gap-2">
              <Input
                inputMode="decimal" type="number" step="0.001" min="0" autoFocus
                className="h-14 text-2xl" placeholder="Weight in kg" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitBag()}
              />
              <Select value={bagTypeId} onValueChange={setBagTypeId}>
                <SelectTrigger className="h-14 w-32"><SelectValue placeholder="Bag" /></SelectTrigger>
                <SelectContent>{bagTypes.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="h-14 px-6 bg-agri-green-500 hover:bg-agri-green-600" onClick={submitBag} disabled={!(Number(weight) > 0)}>Add</Button>
            </div>
          )}
          {bags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bags weighed yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {bags.map((b, i) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground w-8">#{i + 1}</span>
                  <span className="flex-1 font-medium">{formatKg(Number(b.weight_kg))}</span>
                  <span className="text-xs text-muted-foreground mr-3">{b.bag_types?.name}</span>
                  {editable && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => deleteBag(b.id)} aria-label="Remove bag">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 2. Auction */}
      <Card>
        <CardHeader>
          <CardTitle>2. Auction</CardTitle>
          <CardDescription>The highest bid is highlighted. Confirm the winner to lock the lot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {editable && (
            <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
              <EntityPicker
                items={buyers.map((b) => ({ id: b.id, label: b.name, sub: b.firm_name ?? b.code }))}
                value={buyerId} onChange={setBuyerId} placeholder="Select buyer"
              />
              <Input inputMode="decimal" type="number" min="0" className="h-12 text-lg" placeholder="₹ per quintal" value={rate}
                onChange={(e) => setRate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitBid()} />
              <Button className="h-12" variant="outline" onClick={submitBid} disabled={!buyerId || !(Number(rate) > 0)}>Add bid</Button>
            </div>
          )}
          {bids.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bids yet. Add buyers' rates as they call them out.</p>
          ) : (
            <ul className="space-y-2">
              {bids.map((b) => {
                const isTop = b.id === topBid?.id;
                const isWinner = sale && sale.buyer_id === b.buyer_id && Number(sale.rate_per_quintal) === Number(b.rate_per_quintal);
                return (
                  <li key={b.id} className={`flex items-center gap-3 rounded-md border px-3 py-3 ${isTop ? "border-agri-green-500 bg-agri-green-50" : ""}`}>
                    {(isTop || isWinner) && <Trophy className="h-4 w-4 text-amber-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.buyers?.name} <span className="text-xs text-muted-foreground">{b.buyers?.firm_name}</span></p>
                      <p className="text-sm text-muted-foreground">
                        {formatINR(Number(b.rate_per_quintal))}/qtl · total {formatINR(Math.round((totals.total_kg / 100) * Number(b.rate_per_quintal) * 100) / 100)}
                      </p>
                    </div>
                    {editable && (
                      <>
                        <Button size="sm" className="bg-agri-green-500 hover:bg-agri-green-600" onClick={() => confirmSale(b.id)} disabled={totals.total_kg <= 0}>
                          Confirm
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => deleteBid(b.id)} aria-label="Remove bid">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 3. Bills */}
      {sale && (
        <Card>
          <CardHeader>
            <CardTitle>3. Bills</CardTitle>
            <CardDescription>
              Sold at {formatINR(Number(sale.rate_per_quintal))}/qtl · gross {formatINR(Number(sale.gross_amount))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lot.status === "auctioned" && preview && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Farmer commission %</Label>
                    <Select value={farmerPct} onValueChange={setFarmerPct}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>{COMMISSION_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Buyer commission %</Label>
                    <Select value={buyerPct} onValueChange={setBuyerPct}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>{COMMISSION_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Advances to deduct from the farmer's bill</Label>
                  {advances.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unsettled advances for this farmer.</p>
                  ) : (
                    advances.map((a) => (
                      <label key={a.id} className="flex items-center gap-3 rounded-md border px-3 py-3">
                        <Checkbox
                          checked={advanceIds.includes(a.id)}
                          onCheckedChange={(c) => setAdvanceIds((cur) => (c ? [...cur, a.id] : cur.filter((x) => x !== a.id)))}
                        />
                        <span className="flex-1 text-sm">
                          <span className="capitalize font-medium">{a.type}</span>
                          {a.reason ? ` – ${a.reason}` : ""} <span className="text-muted-foreground">({formatDate(a.advance_date)})</span>
                        </span>
                        <span className="font-medium">{formatINR(Number(a.amount))}</span>
                      </label>
                    ))
                  )}
                </div>

                <div className="rounded-md bg-muted p-4 space-y-1 text-sm">
                  <Row label="Gross" value={preview.gross} />
                  <Row label={`Farmer commission (${farmerPct}%)`} value={-preview.farmerCommission} />
                  <Row label="Advances" value={-preview.advancesDeducted} />
                  <Row label="Farmer receives" value={preview.farmerNet} strong />
                  <div className="border-t my-2" />
                  <Row label={`Buyer commission (${buyerPct}%)`} value={preview.buyerCommission} />
                  <Row label="Buyer pays" value={preview.buyerPayable} strong />
                </div>

                <Button className="w-full h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={issue} disabled={isIssuing}>
                  {isIssuing ? "Issuing..." : "Issue both bills"}
                </Button>
              </>
            )}

            {lot.status === "billed" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {farmerBill && <Button asChild variant="outline" className="h-12"><Link to={`/bills/${farmerBill.id}`}>Farmer bill {farmerBill.number}</Link></Button>}
                {buyerBill && <Button asChild variant="outline" className="h-12"><Link to={`/bills/${buyerBill.id}`}>Buyer bill {buyerBill.number}</Link></Button>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editable && (
        <Button variant="ghost" className="text-red-600" onClick={() => confirm("Cancel this lot?") && cancelLot()}>
          Cancel lot
        </Button>
      )}
    </div>
  );
};

const Row = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex justify-between ${strong ? "font-bold text-base" : ""}`}>
    <span>{label}</span>
    <span>{formatINR(value)}</span>
  </div>
);

export default LotDetail;
