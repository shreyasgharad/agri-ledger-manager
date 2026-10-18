import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBagPrices, useProfiles, useSettings } from "@/hooks/useAgri";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/format";
import type { AppRole } from "@/types/agri";

const COMMISSIONS = ["1", "1.25", "1.5", "1.75", "2"];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin (full access)",
  staff: "Staff (view + add)",
  viewer: "View only",
  pending: "Waiting for approval",
};

const BagPrices = () => {
  const { bagTypes, save } = useBagPrices();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rows = bagTypes.filter((b) => b.name !== "Other");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bag prices</CardTitle>
        <CardDescription>Price of one bag. Used when bags are given to a farmer and cut from the bill later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="flex items-center gap-3">
            <Label className="w-24 text-base">{b.name}</Label>
            <Input
              className="h-12 w-32 text-lg" type="number" inputMode="decimal" min="0"
              value={draft[b.id] ?? String(b.price)}
              onChange={(e) => setDraft({ ...draft, [b.id]: e.target.value })}
            />
            <Button
              className="h-12" variant="outline"
              disabled={draft[b.id] === undefined || !(Number(draft[b.id]) >= 0) || Number(draft[b.id]) === Number(b.price)}
              onClick={() => { save({ id: b.id, price: Number(draft[b.id]) }); setDraft((d) => { const n = { ...d }; delete n[b.id]; return n; }); }}
            >
              Save
            </Button>
            <span className="text-sm text-muted-foreground">now {formatINR(Number(b.price))}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const Users = ({ enforced }: { enforced: boolean }) => {
  const { profiles, setRole } = useProfiles(true);
  return (
    <Card>
      <CardHeader>
        <CardTitle>People who can use the app</CardTitle>
        <CardDescription>
          {enforced
            ? "New people sign up on the login page, then wait here for you to approve them."
            : "Logins are not switched on yet. Once they are, everyone must sign in and the roles below apply."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {profiles.length === 0 && <p className="text-sm text-muted-foreground">No accounts yet.</p>}
        {profiles.map((p) => (
          <div key={p.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.full_name || p.email}</p>
              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
            </div>
            <Select value={p.role} onValueChange={(v) => setRole({ user_id: p.user_id, role: v as AppRole })}>
              <SelectTrigger className="h-11 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as AppRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { isAdmin, enforced } = useAuth();
  const { settings, isLoading, save, isSaving } = useSettings();
  const [form, setForm] = useState({
    business_name: "",
    address: "",
    phone: "",
    gstin: "",
    bill_footer: "",
    default_farmer_commission: "1.5",
    default_buyer_commission: "1.5",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name ?? "",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        gstin: settings.gstin ?? "",
        bill_footer: settings.bill_footer ?? "",
        default_farmer_commission: String(settings.default_farmer_commission ?? 1.5),
        default_buyer_commission: String(settings.default_buyer_commission ?? 1.5),
      });
    }
  }, [settings]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = () =>
    save({
      business_name: form.business_name.trim() || "My Agri Business",
      address: form.address || null,
      phone: form.phone || null,
      gstin: form.gstin || null,
      bill_footer: form.bill_footer || null,
      default_farmer_commission: Number(form.default_farmer_commission),
      default_buyer_commission: Number(form.default_buyer_commission),
    });

  if (!isAdmin) return <p className="py-10 text-center text-muted-foreground">Only the admin can change settings.</p>;
  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Loading settings...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Settings</h1>
        <p className="text-sm text-muted-foreground">These details appear at the top and bottom of every printed bill.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Business</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Business name</Label><Input className="h-12" value={form.business_name} onChange={set("business_name")} /></div>
          <div className="space-y-1"><Label>Address</Label><Input className="h-12" value={form.address} onChange={set("address")} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Phone</Label><Input className="h-12" inputMode="tel" value={form.phone} onChange={set("phone")} /></div>
            <div className="space-y-1"><Label>GSTIN (optional)</Label><Input className="h-12" value={form.gstin} onChange={set("gstin")} /></div>
          </div>
          <div className="space-y-1"><Label>Bill footer</Label><Input className="h-12" value={form.bill_footer} onChange={set("bill_footer")} placeholder="e.g. Thank you for your business" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default commission</CardTitle>
          <CardDescription>Applied when issuing bills; you can still change it per lot (0–2%).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(["default_farmer_commission", "default_buyer_commission"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label>{k === "default_farmer_commission" ? "Farmer" : "Buyer"} %</Label>
              <Select value={form[k]} onValueChange={(v) => setForm({ ...form, [k]: v })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>{COMMISSIONS.map((c) => <SelectItem key={c} value={c}>{c}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="h-12 w-full sm:w-auto bg-agri-green-500 hover:bg-agri-green-600" onClick={submit} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save settings"}
      </Button>

      <BagPrices />
      <Users enforced={enforced} />
    </div>
  );
};

export default Settings;
