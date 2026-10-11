import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/hooks/useAgri";

const COMMISSIONS = ["1", "1.25", "1.5", "1.75", "2"];

const Settings = () => {
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
    </div>
  );
};

export default Settings;
