import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, MessageCircle, Pencil, Phone, Plus, Search, Trash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FarmerFormDialog } from "@/components/farmers/FarmerFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { useFarmerOverview, useVillages } from "@/hooks/useAgri";
import { useFarmers, type Farmer } from "@/hooks/useFarmers";
import { FARMER_CROPS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { telHref, whatsappHref } from "@/lib/phone";

type Status = "all" | "owes" | "we_owe" | "settled" | "inactive";

const Farmers = () => {
  const { farmers, isLoading, error, deleteFarmer } = useFarmers();
  const { data: overview = {} } = useFarmerOverview();
  const { data: villages = [] } = useVillages();
  const { canWrite, isAdmin } = useAuth();

  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("all");
  const [crop, setCrop] = useState("all");
  const [status, setStatus] = useState<Status>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Farmer | null>(null);

  const stats = useMemo(() => {
    let owes = 0, owesAmt = 0, weOwe = 0, weOweAmt = 0;
    for (const f of farmers) {
      const o = overview[f.id];
      if (!f.is_active || !o) continue;
      if (o.open_advance > 0) { owes++; owesAmt += o.open_advance; }
      if (o.bills_due > 0) { weOwe++; weOweAmt += o.bills_due; }
    }
    return { owes, owesAmt, weOwe, weOweAmt, active: farmers.filter((f) => f.is_active).length };
  }, [farmers, overview]);

  const cropOptions = useMemo(() => {
    const extra = farmers.map((f) => f.crop_type).filter((c): c is string => !!c && !(FARMER_CROPS as readonly string[]).includes(c));
    return [...FARMER_CROPS, ...Array.from(new Set(extra))];
  }, [farmers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return farmers.filter((f) => {
      const o = overview[f.id];
      if (q && !(`${f.name} ${f.phone} ${f.code ?? ""} ${f.villages?.name ?? ""}`.toLowerCase().includes(q))) return false;
      if (village !== "all" && f.villages?.name !== village) return false;
      if (crop !== "all" && f.crop_type !== crop) return false;
      if (status === "inactive") return !f.is_active;
      if (!f.is_active) return false;
      if (status === "owes") return (o?.open_advance ?? 0) > 0;
      if (status === "we_owe") return (o?.bills_due ?? 0) > 0;
      if (status === "settled") return (o?.open_advance ?? 0) <= 0 && (o?.bills_due ?? 0) <= 0;
      return true;
    });
  }, [farmers, overview, search, village, crop, status]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (f: Farmer) => { setEditing(f); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Farmers</h1>
          <p className="text-sm text-muted-foreground">Tap a farmer to see the full ledger.</p>
        </div>
        {canWrite && (
          <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add farmer
          </Button>
        )}
      </div>

      {/* How many people need attention */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <button type="button" onClick={() => setStatus("all")} className="text-left">
          <Card><CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Active farmers</p>
            <p className="text-xl md:text-2xl font-bold">{stats.active}</p>
          </CardContent></Card>
        </button>
        <button type="button" onClick={() => setStatus("owes")} className="text-left">
          <Card className="border-red-200"><CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Owe us</p>
            <p className="text-xl md:text-2xl font-bold text-red-600">{stats.owes}</p>
            <p className="text-xs text-red-600">{formatINR(stats.owesAmt)}</p>
          </CardContent></Card>
        </button>
        <button type="button" onClick={() => setStatus("we_owe")} className="text-left">
          <Card className="border-amber-200"><CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">We owe them</p>
            <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.weOwe}</p>
            <p className="text-xs text-amber-600">{formatINR(stats.weOweAmt)}</p>
          </CardContent></Card>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 h-12 text-base" placeholder="Search name, phone, ID or village" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={village} onValueChange={setVillage}>
            <SelectTrigger className="h-12"><SelectValue placeholder="Village" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All villages</SelectItem>
              {villages.map((v) => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger className="h-12"><SelectValue placeholder="Crop" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All crops</SelectItem>
              {cropOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ToggleGroup type="single" value={status} onValueChange={(v) => v && setStatus(v as Status)} className="justify-start flex-wrap">
          <ToggleGroupItem value="all" className="h-10">All</ToggleGroupItem>
          <ToggleGroupItem value="owes" className="h-10">Owe us</ToggleGroupItem>
          <ToggleGroupItem value="we_owe" className="h-10">We owe</ToggleGroupItem>
          <ToggleGroupItem value="settled" className="h-10">Settled</ToggleGroupItem>
          <ToggleGroupItem value="inactive" className="h-10">Inactive</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Could not load farmers: {error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Loading farmers...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {farmers.length === 0 ? "No farmers yet. Tap Add farmer to start." : "No farmers match these filters."}
        </CardContent></Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} of {farmers.length} farmers</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((f) => {
              const o = overview[f.id];
              return (
                <Card key={f.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/farmers/${f.id}`} className="min-w-0 flex-1">
                        <p className="font-semibold text-lg truncate hover:text-agri-green-700">{f.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-mono">{f.code}</span>
                          {f.villages?.name ? ` · ${f.villages.name}` : ""}
                          {f.crop_type ? ` · ${f.crop_type}` : ""}
                        </p>
                      </Link>
                      <div className="flex gap-1">
                        {canWrite && (
                          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(f)} aria-label="Edit farmer">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500" aria-label="Delete farmer"
                            onClick={() => confirm(`Remove ${f.name}? Their bills and advances stay in the records.`) && deleteFarmer(f.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!f.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {(o?.open_advance ?? 0) > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Owes us {formatINR(o.open_advance)}</Badge>}
                      {(o?.bills_due ?? 0) > 0 && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">We owe {formatINR(o.bills_due)}</Badge>}
                      {o && o.open_advance <= 0 && o.bills_due <= 0 && o.bill_count > 0 && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Settled</Badge>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="h-12">
                        <a href={telHref(f.phone)}><Phone className="h-4 w-4 mr-2" /> Call</a>
                      </Button>
                      <Button asChild variant="outline" className="h-12 text-green-700">
                        <a href={whatsappHref(f.phone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <FarmerFormDialog open={formOpen} onOpenChange={setFormOpen} farmer={editing} />
    </div>
  );
};

export default Farmers;
