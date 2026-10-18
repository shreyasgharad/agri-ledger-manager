import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, Layers, MessageCircle, Package, Pencil, Phone, Plus, Receipt, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FarmerFormDialog } from "@/components/farmers/FarmerFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { useFarmerLedger, useFarmerPnl } from "@/hooks/useAgri";
import { useFarmers, type Farmer } from "@/hooks/useFarmers";
import { formatDate, formatINR, formatKg } from "@/lib/format";
import { telHref, whatsappHref } from "@/lib/phone";

type Filter = "all" | "bills" | "advances" | "payments" | "lots";

interface Entry {
  key: string;
  date: string;
  kind: Exclude<Filter, "all">;
  title: string;
  detail?: string;
  amount?: number;
  tone?: "in" | "out" | "neutral";
  badge?: { text: string; className: string };
  href?: string;
}

const ADVANCE_LABEL: Record<string, string> = { cash: "Cash loan", bags: "Bags", labour: "Labour", transport: "Transport", other: "Other" };

const FarmerLedger = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useFarmerLedger(id);
  const { isAdmin, canWrite } = useAuth();
  const { data: pnl } = useFarmerPnl(id, isAdmin);
  const { farmers } = useFarmers();
  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);

  const billNumber = useMemo(() => new Map((data?.bills ?? []).map((b) => [b.id, b.number])), [data?.bills]);

  const entries = useMemo<Entry[]>(() => {
    if (!data) return [];
    const list: Entry[] = [];
    for (const b of data.bills) {
      list.push({
        key: `b-${b.id}`, date: b.issued_at, kind: "bills", title: `Bill ${b.number}`,
        detail: `Sold to ${b.buyers?.name ?? "buyer"} · gross ${formatINR(Number(b.gross_amount))} − commission ${formatINR(Number(b.commission_amount))}` +
          (Number(b.advances_deducted) > 0 ? ` − advances ${formatINR(Number(b.advances_deducted))}` : ""),
        amount: Number(b.net_amount), tone: "in", href: `/bills/${b.id}`,
        badge: { text: b.status, className: b.status === "paid" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800" },
      });
    }
    for (const p of data.payments) {
      list.push({
        key: `p-${p.id}`, date: p.paid_at, kind: "payments", title: `Paid to farmer (${p.method.toUpperCase()})`,
        detail: `${billNumber.get(p.bill_id) ?? ""}${p.reference ? ` · ${p.reference}` : ""}`, amount: Number(p.amount), tone: "out",
      });
    }
    for (const a of data.advances) {
      const label = a.type === "bags" ? `${a.qty} ${a.bag_types?.name ?? ""} bags` : ADVANCE_LABEL[a.type];
      let badge: Entry["badge"];
      if (a.settled_bill_id) badge = { text: `Deducted on ${billNumber.get(a.settled_bill_id) ?? "bill"}`, className: "bg-green-100 text-green-800" };
      else if (a.repaid_at) badge = { text: `Repaid ${formatDate(a.repaid_at)}`, className: "bg-green-100 text-green-800" };
      else badge = { text: "Open", className: "bg-red-100 text-red-700" };
      list.push({
        key: `a-${a.id}`, date: a.advance_date, kind: "advances", title: `Advance · ${label}`,
        detail: [a.reason, a.due_date ? `due ${formatDate(a.due_date)}` : ""].filter(Boolean).join(" · "),
        amount: Number(a.amount), tone: "out", badge,
      });
    }
    for (const l of data.lots) {
      list.push({
        key: `l-${l.id}`, date: l.lot_date, kind: "lots", title: `Lot ${l.code} · ${l.crops?.name ?? ""}`,
        detail: `${l.bag_count} bags · ${formatKg(l.total_kg)}`, href: `/lots/${l.id}`,
        badge: { text: l.status, className: "bg-gray-100 text-gray-700" },
      });
    }
    return list.sort((x, y) => (y.date > x.date ? 1 : y.date < x.date ? -1 : 0));
  }, [data, billNumber]);

  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Loading ledger...</p>;
  if (error || !data) return <p className="py-10 text-center text-red-600">Could not load this farmer.</p>;

  const { farmer, advances, bills, lots, payments } = data;
  const open = advances.filter((a) => !a.settled_bill_id && !a.repaid_at);
  const openTotal = open.reduce((s, a) => s + Number(a.amount), 0);
  const paidByBill = new Map<string, number>();
  payments.forEach((p) => paidByBill.set(p.bill_id, (paidByBill.get(p.bill_id) ?? 0) + Number(p.amount)));
  const weOwe = bills.reduce((s, b) => s + Math.max(0, Number(b.net_amount) - (paidByBill.get(b.id) ?? 0)), 0);
  const bagsOut = open.filter((a) => a.type === "bags").reduce((s, a) => s + (a.qty ?? 0), 0);
  const shown = entries.filter((e) => filter === "all" || e.kind === filter);
  const fullFarmer = farmers.find((f) => f.id === farmer.id) ?? ({ ...farmer, org_id: "", address: null, notes: null, created_at: "", updated_at: "" } as Farmer);

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/farmers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> All farmers
      </Link>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{farmer.name}</h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{farmer.code}</span>
                {farmer.villages?.name ? ` · ${farmer.villages.name}` : ""}
                {farmer.crop_type ? ` · ${farmer.crop_type}` : ""} · {farmer.phone}
              </p>
              {!farmer.is_active && <Badge variant="secondary" className="mt-1">Inactive</Badge>}
            </div>
            {canWrite && (
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setEditOpen(true)} aria-label="Edit farmer">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-12"><a href={telHref(farmer.phone)}><Phone className="h-4 w-4 mr-2" /> Call</a></Button>
            <Button asChild variant="outline" className="h-12 text-green-700">
              <a href={whatsappHref(farmer.phone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a>
            </Button>
          </div>
          {canWrite && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild className="h-12 bg-agri-green-500 hover:bg-agri-green-600"><Link to={`/bills/new?farmer=${farmer.id}`}><Receipt className="h-4 w-4 mr-2" /> New bill</Link></Button>
              <Button asChild variant="secondary" className="h-12"><Link to={`/advances?new=1&farmer=${farmer.id}`}><Plus className="h-4 w-4 mr-2" /> Give advance</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><Receipt className="h-3 w-3" /> Bills</p><p className="text-2xl font-bold">{bills.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Lots</p><p className="text-2xl font-bold">{lots.length}</p></CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Owes us</p>
          <p className="text-xl font-bold text-red-600">{formatINR(openTotal)}</p>
          {bagsOut > 0 && <p className="text-xs text-muted-foreground">incl. {bagsOut} bags</p>}
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Banknote className="h-3 w-3" /> We owe</p>
          <p className="text-xl font-bold text-amber-600">{formatINR(weOwe)}</p>
        </CardContent></Card>
      </div>

      {isAdmin && pnl && (
        <Card className="border-agri-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-base">Profit &amp; loss · admin only</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted-foreground">Commission earned</p><p className="text-xl font-bold text-green-700">{formatINR(pnl.total_commission)}</p></div>
              <div><p className="text-xs text-muted-foreground">From farmer</p><p className="text-lg font-semibold">{formatINR(pnl.farmer_commission)}</p></div>
              <div><p className="text-xs text-muted-foreground">From buyers</p><p className="text-lg font-semibold">{formatINR(pnl.buyer_commission)}</p></div>
              <div><p className="text-xs text-muted-foreground">Business done</p><p className="text-lg font-semibold">{formatINR(pnl.gross_traded)}</p></div>
            </div>
            <div className="rounded-md bg-red-50 p-3 text-sm space-y-1">
              <p className="font-medium text-red-700">Money out with this farmer: {formatINR(pnl.open_advances)}</p>
              <p className="text-muted-foreground">
                Cash loans {formatINR(pnl.open_cash)} · Bags {formatINR(pnl.open_bags)} · Labour / transport / other {formatINR(pnl.open_labour_transport)}
              </p>
              <p className="text-muted-foreground">
                Net position: {pnl.open_advances - pnl.bills_due > 0
                  ? `farmer owes us ${formatINR(pnl.open_advances - pnl.bills_due)}`
                  : `we owe farmer ${formatINR(pnl.bills_due - pnl.open_advances)}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="justify-start flex-wrap">
            <ToggleGroupItem value="all" className="h-10">All</ToggleGroupItem>
            <ToggleGroupItem value="bills" className="h-10">Bills</ToggleGroupItem>
            <ToggleGroupItem value="advances" className="h-10">Advances</ToggleGroupItem>
            <ToggleGroupItem value="payments" className="h-10">Payments</ToggleGroupItem>
            <ToggleGroupItem value="lots" className="h-10">Lots</ToggleGroupItem>
          </ToggleGroup>

          {shown.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ul className="divide-y">
              {shown.map((e) => {
                const body = (
                  <div className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium flex items-center gap-2 flex-wrap">
                        {e.kind === "lots" && <Package className="h-4 w-4 text-muted-foreground" />}
                        {e.title}
                        {e.badge && <Badge variant="secondary" className={`${e.badge.className} font-normal`}>{e.badge.text}</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                      {e.detail && <p className="text-sm text-muted-foreground">{e.detail}</p>}
                    </div>
                    {e.amount !== undefined && (
                      <p className={`font-bold whitespace-nowrap ${e.tone === "in" ? "text-green-700" : "text-red-600"}`}>
                        {e.tone === "in" ? "+" : "−"} {formatINR(e.amount)}
                      </p>
                    )}
                  </div>
                );
                return <li key={e.key}>{e.href ? <Link to={e.href} className="block hover:bg-muted/40 rounded">{body}</Link> : body}</li>;
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">Green = money due to the farmer from a sale. Red = money given to the farmer or paid out.</p>
        </CardContent>
      </Card>

      <FarmerFormDialog open={editOpen} onOpenChange={setEditOpen} farmer={fullFarmer} />
    </div>
  );
};

export default FarmerLedger;
