import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityPicker } from "@/components/common/EntityPicker";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useFarmers } from "@/hooks/useFarmers";
import { useCrops, useLots } from "@/hooks/useAgri";
import { formatDate, formatKg } from "@/lib/format";

const Lots = () => {
  const navigate = useNavigate();
  const { lots, isLoading, createLot, isCreating } = useLots();
  const { farmers } = useFarmers();
  const { data: crops = [] } = useCrops();
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const [cropId, setCropId] = useState("");

  const start = async () => {
    const lot = await createLot({ farmer_id: farmerId, crop_id: cropId });
    setOpen(false);
    setFarmerId("");
    navigate(`/lots/${lot.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Lots</h1>
          <p className="text-sm text-muted-foreground">Weigh, auction and bill each farmer's produce.</p>
        </div>
        <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New lot
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Loading lots...</p>
      ) : lots.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No lots yet. Tap "New lot" to weigh the first one.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {lots.map((lot) => (
            <Link key={lot.id} to={`/lots/${lot.id}`}>
              <Card className="hover:border-agri-green-500 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lot.farmers?.name} <span className="text-xs text-muted-foreground font-mono">{lot.farmers?.code}</span></p>
                    <p className="text-sm text-muted-foreground">
                      {lot.crops?.name} · {lot.totals.bag_count} bags · {formatKg(lot.totals.total_kg)}
                    </p>
                    <p className="text-xs text-muted-foreground">{lot.code} · {formatDate(lot.lot_date)}</p>
                  </div>
                  <StatusBadge status={lot.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New lot</DialogTitle>
            <DialogDescription>Pick the farmer and crop, then add the bag weights.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Farmer</Label>
              <EntityPicker
                items={farmers.map((f) => ({ id: f.id, label: f.name, sub: [f.code, f.villages?.name].filter(Boolean).join(" · ") }))}
                value={farmerId}
                onChange={setFarmerId}
                placeholder="Search farmer by name, code or village"
              />
            </div>
            <div className="space-y-2">
              <Label>Crop</Label>
              <Select value={cropId} onValueChange={setCropId}>
                <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>
                  {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!farmerId || !cropId || isCreating} onClick={start} className="bg-agri-green-500 hover:bg-agri-green-600">
              {isCreating ? "Creating..." : "Start weighing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lots;
