import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EntityPicker } from "@/components/common/EntityPicker";
import { useAuth } from "@/hooks/useAuth";
import { useAdvances, useBagTypes } from "@/hooks/useAgri";
import { useFarmers } from "@/hooks/useFarmers";
import { formatDate, formatINR } from "@/lib/format";
import type { Advance, AdvanceType, PaymentMethod } from "@/types/agri";

const TYPES: { value: AdvanceType; label: string }[] = [
  { value: "cash", label: "Cash loan" },
  { value: "bags", label: "Bags" },
  { value: "labour", label: "Labour" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];
const LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label])) as Record<AdvanceType, string>;

const QUICK_REASONS: Record<AdvanceType, string[]> = {
  cash: ["Seeds", "Fertiliser", "Farming expenses", "Family need"],
  bags: [],
  labour: ["Hamali", "Loading", "Unloading", "Weighing"],
  transport: ["Tempo", "Truck", "Auto", "Tractor"],
  other: ["Cutting / harvesting", "Pesticide", "Repair"],
};

const describe = (a: Advance) =>
  a.type === "bags" ? `${a.qty} ${a.bag_types?.name ?? ""} bags` : LABEL[a.type];

const Advances = () => {
  const { advances, isLoading, addAdvance, isAdding, markRepaid, updateAdvance, removeAdvance } = useAdvances();
  const { farmers } = useFarmers();
  const { data: bagTypes = [] } = useBagTypes();
  const { canWrite, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();

  const [onlyOpen, setOnlyOpen] = useState(true);
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const [type, setType] = useState<AdvanceType>("cash");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [bagTypeId, setBagTypeId] = useState("");
  const [qty, setQty] = useState("");
  const [repayFor, setRepayFor] = useState<Advance | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [editing, setEditing] = useState<Advance | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");

  const sellable = bagTypes.filter((b) => Number(b.price) > 0 || b.name !== "Other");
  const bag = bagTypes.find((b) => b.id === bagTypeId);

  // opened from a farmer's ledger: /advances?new=1&farmer=<id>
  useEffect(() => {
    if (params.get("new")) {
      setOpen(true);
      const f = params.get("farmer");
      if (f) setFarmerId(f);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    if (type === "bags") {
      if (!bagTypeId && sellable.length) setBagTypeId(sellable.find((b) => b.name === "Jute")?.id ?? sellable[0].id);
      if (bag && Number(qty) > 0) setAmount(String(Math.round(Number(qty) * Number(bag.price) * 100) / 100));
    }
  }, [type, bag, qty, bagTypeId, sellable]);

  const resetForm = () => {
    setAmount(""); setReason(""); setDueDate(""); setQty("");
  };

  const valid =
    farmerId && Number(amount) > 0 &&
    (type !== "other" || reason.trim().length > 0) &&
    (type !== "bags" || (Number(qty) > 0 && bagTypeId));

  const save = () => {
    addAdvance({
      farmer_id: farmerId, type, amount: Number(amount), reason: reason.trim() || undefined,
      due_date: type === "cash" && dueDate ? dueDate : null,
      bag_type_id: type === "bags" ? bagTypeId : null,
      qty: type === "bags" ? Number(qty) : null,
    });
    resetForm();
    setOpen(false);
  };

  const shown = advances.filter((a) => !onlyOpen || (!a.settled_bill_id && !a.repaid_at));
  const openRows = advances.filter((a) => !a.settled_bill_id && !a.repaid_at);
  const byType = useMemo(() => {
    const t: Record<string, number> = {};
    openRows.forEach((a) => { t[a.type] = (t[a.type] ?? 0) + Number(a.amount); });
    return t;
  }, [openRows]);
  const bagsOut = openRows.filter((a) => a.type === "bags").reduce((s, a) => s + (a.qty ?? 0), 0);
  const openTotal = openRows.reduce((s, a) => s + Number(a.amount), 0);
  const farmersOwing = new Set(openRows.map((a) => a.farmer_id)).size;

  const groups = useMemo(() => {
    const m = new Map<string, { name: string; code: string | null; rows: Advance[] }>();
    for (const a of shown) {
      const g = m.get(a.farmer_id) ?? { name: a.farmers?.name ?? "Farmer", code: a.farmers?.code ?? null, rows: [] };
      g.rows.push(a);
      m.set(a.farmer_id, g);
    }
    return Array.from(m.entries())
      .map(([id, g]) => ({ id, ...g, total: g.rows.filter((r) => !r.settled_bill_id && !r.repaid_at).reduce((s, r) => s + Number(r.amount), 0) }))
      .sort((a, b) => b.total - a.total);
  }, [shown]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Advances</h1>
          <p className="text-sm text-muted-foreground">Money, bags and expenses given to farmers. They are cut from the next bill, or marked repaid.</p>
        </div>
        {canWrite && (
          <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New advance
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="border-red-200"><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total out</p>
          <p className="text-xl font-bold text-red-600">{formatINR(openTotal)}</p>
          <p className="text-xs text-muted-foreground">{farmersOwing} farmer{farmersOwing === 1 ? "" : "s"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Cash loans</p><p className="text-lg font-bold">{formatINR(byType.cash ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Bags</p><p className="text-lg font-bold">{formatINR(byType.bags ?? 0)}</p>
          <p className="text-xs text-muted-foreground">{bagsOut} bags out</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Labour / transport / other</p>
          <p className="text-lg font-bold">{formatINR((byType.labour ?? 0) + (byType.transport ?? 0) + (byType.other ?? 0))}</p>
        </CardContent></Card>
      </div>

      <ToggleGroup type="single" value={onlyOpen ? "open" : "all"} onValueChange={(v) => v && setOnlyOpen(v === "open")} className="justify-start">
        <ToggleGroupItem value="open" className="h-10">Not yet cleared</ToggleGroupItem>
        <ToggleGroupItem value="all" className="h-10">Everything</ToggleGroupItem>
      </ToggleGroup>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : groups.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No advances to show.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/farmers/${g.id}`} className="min-w-0">
                    <p className="font-semibold text-lg truncate hover:text-agri-green-700">{g.name} <span className="font-mono text-xs text-muted-foreground">{g.code}</span></p>
                  </Link>
                  <p className="font-bold text-red-600 whitespace-nowrap">{formatINR(g.total)}</p>
                </div>
                <ul className="divide-y">
                  {g.rows.map((a) => {
                    const cleared = !!a.settled_bill_id || !!a.repaid_at;
                    return (
                      <li key={a.id} className="py-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {describe(a)}{a.reason ? ` · ${a.reason}` : ""}
                              {cleared && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 font-normal">{a.repaid_at ? "Repaid" : "Deducted on bill"}</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(a.advance_date)}{a.due_date && !cleared ? ` · pay back by ${formatDate(a.due_date)}` : ""}
                            </p>
                          </div>
                          <p className="font-semibold whitespace-nowrap">{formatINR(Number(a.amount))}</p>
                        </div>
                        {!cleared && (canWrite || isAdmin) && (
                          <div className="flex items-center gap-2">
                            {canWrite && (
                              <Button size="sm" variant="outline" className="h-10" onClick={() => { setRepayFor(a); setMethod("cash"); }}>Farmer paid back</Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button size="sm" variant="ghost" className="h-10" aria-label="Edit advance"
                                  onClick={() => { setEditing(a); setEditAmount(String(a.amount)); setEditReason(a.reason ?? ""); }}>
                                  <Pencil className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button size="sm" variant="ghost" className="h-10 text-red-500" aria-label="Remove advance"
                                  onClick={() => confirm("Remove this advance?") && removeAdvance(a.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New advance */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New advance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Farmer</Label>
              <EntityPicker
                items={farmers.filter((f) => f.is_active).map((f) => ({ id: f.id, label: f.name, sub: [f.code, f.villages?.name].filter(Boolean).join(" · ") }))}
                value={farmerId} onChange={setFarmerId} placeholder="Search farmer"
              />
            </div>
            <div className="space-y-1">
              <Label>What was given</Label>
              <ToggleGroup type="single" value={type} onValueChange={(v) => { if (v) { setType(v as AdvanceType); setReason(""); } }} className="justify-start flex-wrap">
                {TYPES.map((t) => <ToggleGroupItem key={t.value} value={t.value} className="h-11 px-4">{t.label}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>

            {type === "bags" && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-1">
                  <Label>Bag type</Label>
                  <ToggleGroup type="single" value={bagTypeId} onValueChange={(v) => v && setBagTypeId(v)} className="justify-start flex-wrap">
                    {sellable.map((b) => <ToggleGroupItem key={b.id} value={b.id} className="h-11 px-4">{b.name} · {formatINR(Number(b.price))}</ToggleGroupItem>)}
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">Bag prices can be changed in Settings.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adv-qty">How many bags</Label>
                  <Input id="adv-qty" className="h-14 text-2xl" inputMode="numeric" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="adv-amount">Amount (₹){type === "bags" ? " – worked out from bag price" : ""}</Label>
              <Input id="adv-amount" className="h-14 text-2xl" inputMode="decimal" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>{type === "other" ? "Reason *" : "Note (optional)"}</Label>
              {QUICK_REASONS[type].length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {QUICK_REASONS[type].map((r) => (
                    <Button key={r} type="button" size="sm" variant={reason === r ? "default" : "outline"} className="h-9" onClick={() => setReason(r)}>{r}</Button>
                  ))}
                </div>
              )}
              <Input className="h-12" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pick above or type your own" />
            </div>

            {type === "cash" && (
              <div className="space-y-1">
                <Label>Pay back by (optional)</Label>
                <Input className="h-12" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">No interest is added. This is only a reminder date for the season.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" disabled={!valid || isAdding} onClick={save}>Save advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark repaid */}
      <Dialog open={!!repayFor} onOpenChange={(o) => !o && setRepayFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Farmer paid this back</DialogTitle>
            <DialogDescription>
              {repayFor && `${describe(repayFor)} · ${formatINR(Number(repayFor.amount))} will be removed from what the farmer owes.`}
            </DialogDescription>
          </DialogHeader>
          <ToggleGroup type="single" value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)} className="justify-start">
            <ToggleGroupItem value="cash" className="h-11 px-5">Cash</ToggleGroupItem>
            <ToggleGroupItem value="upi" className="h-11 px-5">UPI</ToggleGroupItem>
            <ToggleGroupItem value="bank" className="h-11 px-5">Bank</ToggleGroupItem>
          </ToggleGroup>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setRepayFor(null)}>Cancel</Button>
            <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => { if (repayFor) markRepaid({ id: repayFor.id, method }); setRepayFor(null); }}>
              Mark as repaid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit advance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input className="h-12 text-lg" type="number" inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Input className="h-12" value={editReason} onChange={(e) => setEditReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" disabled={!(Number(editAmount) > 0) || (editing?.type === "other" && !editReason.trim())}
              onClick={() => { if (editing) updateAdvance({ id: editing.id, amount: Number(editAmount), reason: editReason.trim() || null }); setEditing(null); }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Advances;
