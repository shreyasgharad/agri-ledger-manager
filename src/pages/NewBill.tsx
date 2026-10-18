import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityPicker } from "@/components/common/EntityPicker";
import { FarmerFormDialog } from "@/components/farmers/FarmerFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { useBuyers, useCrops, useOpenAdvances, useQuickBill, useSettings } from "@/hooks/useAgri";
import { useFarmers } from "@/hooks/useFarmers";
import { computeBill } from "@/lib/billing";
import { formatDate, formatINR, formatQuintal } from "@/lib/format";
import type { Advance } from "@/types/agri";

const COMMISSIONS = ["1", "1.25", "1.5", "1.75", "2"];
const CROP_ALIASES: Record<string, string> = { soyabean: "soybean", daal: "daal", chana: "chana" };

const advanceLabel = (a: Advance) =>
  a.type === "bags" ? `${a.qty} ${a.bag_types?.name ?? ""} bags` : a.type === "cash" ? "Cash loan" : a.type[0].toUpperCase() + a.type.slice(1);

const NewBill = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canWrite } = useAuth();
  const { farmers } = useFarmers();
  const { buyers, addBuyerAsync, isAdding: addingBuyer } = useBuyers();
  const { data: crops = [] } = useCrops();
  const { settings } = useSettings();
  const { quickBill, isBilling } = useQuickBill();

  const [farmerId, setFarmerId] = useState(params.get("farmer") ?? "");
  const [cropId, setCropId] = useState("");
  const [bags, setBags] = useState("");
  const [kg, setKg] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [rate, setRate] = useState("");
  const [farmerPct, setFarmerPct] = useState("1.5");
  const [buyerPct, setBuyerPct] = useState("1.5");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [farmerDialog, setFarmerDialog] = useState(false);
  const [buyerDialog, setBuyerDialog] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", phone: "" });

  const farmer = farmers.find((f) => f.id === farmerId);
  const { data: openAdvances = [] } = useOpenAdvances(farmerId || undefined);

  useEffect(() => {
    if (settings) {
      setFarmerPct(String(settings.default_farmer_commission ?? 1.5));
      setBuyerPct(String(settings.default_buyer_commission ?? 1.5));
    }
  }, [settings]);

  // pre-select the farmer's usual crop
  useEffect(() => {
    if (!farmer?.crop_type || cropId) return;
    const want = (CROP_ALIASES[farmer.crop_type.toLowerCase()] ?? farmer.crop_type).toLowerCase();
    const match = crops.find((c) => c.name.toLowerCase() === want);
    if (match) setCropId(match.id);
  }, [farmer, crops, cropId]);

  // new farmer => start deductions fresh (everything open is selected)
  useEffect(() => setPicked(null), [farmerId]);
  const selectedIds = picked ?? openAdvances.map((a) => a.id);
  const deduction = openAdvances.filter((a) => selectedIds.includes(a.id)).reduce((s, a) => s + Number(a.amount), 0);

  const nBags = Number(bags);
  const nKg = Number(kg);
  const nRate = Number(rate);
  const qtyOk = nBags >= 1 && nBags <= 500 && nKg > 0 && nKg / nBags >= 1;
  const ready = !!farmerId && !!cropId && qtyOk && !!buyerId && nRate > 0;

  const preview = useMemo(
    () => (ready ? computeBill({ totalKg: nKg, ratePerQuintal: nRate, farmerPct: Number(farmerPct), buyerPct: Number(buyerPct), advances: deduction }) : null),
    [ready, nKg, nRate, farmerPct, buyerPct, deduction]
  );

  if (!canWrite) return <p className="py-10 text-center text-muted-foreground">You only have view access, so you cannot create bills.</p>;

  const issue = async () => {
    const res = await quickBill({
      farmer_id: farmerId, crop_id: cropId, buyer_id: buyerId, bags: nBags, total_kg: nKg, rate: nRate,
      farmer_pct: Number(farmerPct), buyer_pct: Number(buyerPct), advance_ids: selectedIds, bag_type_id: null,
    });
    navigate(`/bills/${res.out_farmer_bill}`);
  };

  const saveBuyer = async () => {
    try {
      const created = (await addBuyerAsync({ name: newBuyer.name.trim(), phone: newBuyer.phone.trim() || undefined })) as { id: string };
      setBuyerId(created.id);
      setNewBuyer({ name: "", phone: "" });
      setBuyerDialog(false);
    } catch { /* toast shown by the hook */ }
  };

  const stepTitle = (n: number, t: string) => (
    <CardTitle className="flex items-center gap-2 text-lg">
      <span className="h-7 w-7 rounded-full bg-agri-green-500 text-white text-sm flex items-center justify-center">{n}</span>{t}
    </CardTitle>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Create bill</h1>
        <p className="text-sm text-muted-foreground">Answer the questions below. Both bills (farmer and buyer) are made together.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">{stepTitle(1, "Which farmer?")}</CardHeader>
        <CardContent className="space-y-3">
          <EntityPicker
            items={farmers.filter((f) => f.is_active).map((f) => ({ id: f.id, label: f.name, sub: [f.code, f.villages?.name].filter(Boolean).join(" · ") }))}
            value={farmerId} onChange={setFarmerId} placeholder="Search farmer by name, ID or village"
          />
          <Button type="button" variant="outline" className="h-11" onClick={() => setFarmerDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New farmer
          </Button>
          {farmer && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-0.5">
              <p className="font-semibold text-base">{farmer.name} <span className="font-mono text-xs text-muted-foreground">{farmer.code}</span></p>
              <p>{farmer.phone}{farmer.villages?.name ? ` · ${farmer.villages.name}` : ""}{farmer.crop_type ? ` · ${farmer.crop_type}` : ""}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {farmerId && (
        <Card>
          <CardHeader className="pb-2">{stepTitle(2, "What quantity?")}</CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Crop</Label>
              <Select value={cropId} onValueChange={setCropId}>
                <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>{crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nb-bags">Number of bags</Label>
                <Input id="nb-bags" className="h-14 text-2xl" inputMode="numeric" type="number" min="1" value={bags} onChange={(e) => setBags(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nb-kg">Total weight (kg)</Label>
                <Input id="nb-kg" className="h-14 text-2xl" inputMode="decimal" type="number" min="0" value={kg} onChange={(e) => setKg(e.target.value)} />
              </div>
            </div>
            {nKg > 0 && <p className="text-sm text-muted-foreground">= {formatQuintal(nKg)}{nBags > 0 ? ` · about ${(nKg / nBags).toFixed(1)} kg per bag` : ""}</p>}
            {nBags > 0 && nKg > 0 && !qtyOk && <p className="text-sm text-red-600">Each bag must weigh at least 1 kg, and bags must be 500 or fewer.</p>}
          </CardContent>
        </Card>
      )}

      {farmerId && qtyOk && cropId && (
        <Card>
          <CardHeader className="pb-2">{stepTitle(3, "Who bought it, and at what rate?")}</CardHeader>
          <CardContent className="space-y-3">
            <EntityPicker
              items={buyers.filter((b) => b.is_active).map((b) => ({ id: b.id, label: b.name, sub: b.firm_name ?? b.code }))}
              value={buyerId} onChange={setBuyerId} placeholder="Select buyer"
            />
            <Button type="button" variant="outline" className="h-11" onClick={() => setBuyerDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New buyer
            </Button>
            <div className="space-y-1">
              <Label htmlFor="nb-rate">Rate (₹ per quintal)</Label>
              <Input id="nb-rate" className="h-14 text-2xl" inputMode="decimal" type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {ready && preview && (
        <Card>
          <CardHeader className="pb-2">{stepTitle(4, "Cut from this bill")}</CardHeader>
          <CardContent className="space-y-3">
            {openAdvances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing owed by this farmer, so nothing to cut.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Advances, bags and expenses given earlier. Untick any you do not want to cut now.</p>
                {openAdvances.map((a) => (
                  <label key={a.id} className="flex items-center gap-3 rounded-md border px-3 py-3">
                    <Checkbox
                      checked={selectedIds.includes(a.id)}
                      onCheckedChange={(c) => setPicked((cur) => {
                        const base = cur ?? openAdvances.map((x) => x.id);
                        return c ? [...base, a.id] : base.filter((x) => x !== a.id);
                      })}
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-medium">{advanceLabel(a)}</span>{a.reason ? ` – ${a.reason}` : ""}{" "}
                      <span className="text-muted-foreground">({formatDate(a.advance_date)})</span>
                    </span>
                    <span className="font-medium">{formatINR(Number(a.amount))}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Farmer commission</Label>
                <Select value={farmerPct} onValueChange={setFarmerPct}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{COMMISSIONS.map((p) => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Buyer commission</Label>
                <Select value={buyerPct} onValueChange={setBuyerPct}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{COMMISSIONS.map((p) => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ready && preview && (
        <Card className="border-agri-green-500">
          <CardHeader className="pb-2">{stepTitle(5, "Check and create")}</CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-muted p-4 space-y-1 text-sm">
              <Row label={`${formatQuintal(nKg)} × ${formatINR(nRate)}`} value={preview.gross} />
              <Row label={`Farmer commission (${farmerPct}%)`} value={-preview.farmerCommission} />
              <Row label="Advances, bags and expenses cut" value={-preview.advancesDeducted} />
              <Row label="Farmer gets" value={preview.farmerNet} strong />
              <div className="border-t my-2" />
              <Row label={`Buyer commission (${buyerPct}%)`} value={preview.buyerCommission} />
              <Row label="Buyer pays" value={preview.buyerPayable} strong />
            </div>
            {preview.farmerNet < 0 && <p className="text-sm text-red-600">The cuts are more than the sale. The farmer will still owe the extra.</p>}
            <Button className="w-full h-14 text-lg bg-agri-green-500 hover:bg-agri-green-600" disabled={isBilling} onClick={issue}>
              {isBilling ? "Creating..." : "Create both bills"}
            </Button>
          </CardContent>
        </Card>
      )}

      <FarmerFormDialog open={farmerDialog} onOpenChange={setFarmerDialog} onSaved={(f) => setFarmerId(f.id)} />

      <Dialog open={buyerDialog} onOpenChange={setBuyerDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New buyer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input className="h-12" value={newBuyer.name} onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input className="h-12" inputMode="tel" value={newBuyer.phone} onChange={(e) => setNewBuyer({ ...newBuyer, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setBuyerDialog(false)}>Cancel</Button>
            <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" disabled={!newBuyer.name.trim() || addingBuyer} onClick={saveBuyer}>Add buyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex justify-between gap-3 ${strong ? "font-bold text-base" : ""}`}>
    <span>{label}</span>
    <span>{formatINR(value)}</span>
  </div>
);

export default NewBill;
