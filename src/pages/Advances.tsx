import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EntityPicker } from "@/components/common/EntityPicker";
import { useFarmers } from "@/hooks/useFarmers";
import { useAdvances } from "@/hooks/useAgri";
import { formatDate, formatINR } from "@/lib/format";
import type { AdvanceType } from "@/types/agri";

const TYPES: AdvanceType[] = ["transport", "labour", "other"];

const Advances = () => {
  const { advances, isLoading, addAdvance, isAdding } = useAdvances();
  const { farmers } = useFarmers();
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const [type, setType] = useState<AdvanceType>("transport");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);

  const reasonMissing = type === "other" && !reason.trim();
  const valid = farmerId && Number(amount) > 0 && !reasonMissing;
  const shown = advances.filter((a) => !onlyOpen || !a.settled_bill_id);
  const total = shown.reduce((s, a) => s + Number(a.amount), 0);

  const save = () => {
    addAdvance({ farmer_id: farmerId, type, amount: Number(amount), reason: reason.trim() || undefined });
    setAmount("");
    setReason("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Advances</h1>
          <p className="text-sm text-muted-foreground">Transport, labour and other advances. Deducted automatically on the farmer's bill.</p>
        </div>
        <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New advance
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <ToggleGroup type="single" value={onlyOpen ? "open" : "all"} onValueChange={(v) => v && setOnlyOpen(v === "open")}>
          <ToggleGroupItem value="open">Unsettled</ToggleGroupItem>
          <ToggleGroupItem value="all">All</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm">Total <span className="font-bold">{formatINR(total)}</span></p>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : shown.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No advances.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {shown.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.farmers?.name} <span className="font-mono text-xs text-muted-foreground">{a.farmers?.code}</span></p>
                  <p className="text-sm text-muted-foreground capitalize">{a.type}{a.reason ? ` – ${a.reason}` : ""} · {formatDate(a.advance_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatINR(Number(a.amount))}</p>
                  <Badge variant="secondary" className={a.settled_bill_id ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                    {a.settled_bill_id ? "settled" : "open"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New advance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Farmer</Label>
              <EntityPicker
                items={farmers.map((f) => ({ id: f.id, label: f.name, sub: [f.code, f.villages?.name].filter(Boolean).join(" · ") }))}
                value={farmerId} onChange={setFarmerId} placeholder="Search farmer"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <ToggleGroup type="single" value={type} onValueChange={(v) => v && setType(v as AdvanceType)} className="justify-start">
                {TYPES.map((t) => <ToggleGroupItem key={t} value={t} className="capitalize h-12 px-5">{t}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input className="h-14 text-2xl" inputMode="decimal" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reason{type === "other" ? " *" : ""}</Label>
              <Input className="h-12" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={type === "other" ? "Required for 'other'" : "Optional"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!valid || isAdding} onClick={save} className="bg-agri-green-500 hover:bg-agri-green-600">Save advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Advances;
