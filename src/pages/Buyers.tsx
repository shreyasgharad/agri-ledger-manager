import { useState } from "react";
import { Phone, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuyers } from "@/hooks/useAgri";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/format";

const empty = { name: "", firm_name: "", phone: "", address: "" };

const Buyers = () => {
  const { buyers, balances, isLoading, addBuyer, isAdding } = useBuyers();
  const { canWrite } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const filtered = buyers.filter((b) =>
    [b.name, b.firm_name, b.phone, b.code].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const save = () => {
    addBuyer(form);
    setForm(empty);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Buyers</h1>
          <p className="text-sm text-muted-foreground">Traders who bid in the auction.</p>
        </div>
        {canWrite && (<Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add buyer</Button>)}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10 h-12" placeholder="Search buyers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading buyers...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No buyers yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((b) => {
            const bal = balances[b.id];
            return (
              <Card key={b.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.name} <span className="font-mono text-xs text-muted-foreground">{b.code}</span></p>
                    {b.firm_name && <p className="text-sm text-muted-foreground truncate">{b.firm_name}</p>}
                    {b.phone && (
                      <a href={`tel:${b.phone}`} className="inline-flex items-center text-sm text-agri-green-700 mt-1">
                        <Phone className="h-3 w-3 mr-1" /> {b.phone}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className={`font-bold ${bal && bal.due > 0 ? "text-red-600" : ""}`}>{formatINR(bal?.due ?? 0)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add buyer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(["name", "firm_name", "phone", "address"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label className="capitalize">{k.replace("_", " ")}{k === "name" ? " *" : ""}</Label>
                <Input className="h-12" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  inputMode={k === "phone" ? "tel" : undefined} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name.trim() || isAdding} onClick={save} className="bg-agri-green-500 hover:bg-agri-green-600">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Buyers;
