import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVillages } from "@/hooks/useAgri";
import { useFarmers, type Farmer } from "@/hooks/useFarmers";
import { FARMER_CROPS, OTHER_CROP } from "@/lib/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When given, the dialog edits this farmer instead of adding a new one. */
  farmer?: Farmer | null;
  onSaved?: (farmer: Farmer) => void;
}

const cropToState = (crop: string | null | undefined) => {
  if (!crop) return { crop: "", other: "" };
  return (FARMER_CROPS as readonly string[]).includes(crop) ? { crop, other: "" } : { crop: OTHER_CROP, other: crop };
};

/** Name + phone + village + crop. The farmer ID (F-0001...) is created automatically. */
export function FarmerFormDialog({ open, onOpenChange, farmer, onSaved }: Props) {
  const { addFarmer, updateFarmer, isAddingFarmer } = useFarmers();
  const { data: villages = [] } = useVillages();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [crop, setCrop] = useState("");
  const [otherCrop, setOtherCrop] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(farmer?.name ?? "");
    setPhone(farmer?.phone ?? "");
    setVillage(farmer?.villages?.name ?? "");
    const c = cropToState(farmer?.crop_type);
    setCrop(c.crop);
    setOtherCrop(c.other);
  }, [open, farmer]);

  const cropValue = crop === OTHER_CROP ? otherCrop.trim() : crop;
  const phoneDigits = phone.replace(/\D/g, "");
  const valid = name.trim().length > 0 && phoneDigits.length >= 10;

  const save = async () => {
    if (farmer) {
      updateFarmer({ id: farmer.id, name: name.trim(), phone: phone.trim(), village_name: village, crop_type: cropValue || null });
      onOpenChange(false);
      return;
    }
    try {
      const created = await addFarmer({ name: name.trim(), phone: phone.trim(), village_name: village, crop_type: cropValue || null });
      onOpenChange(false);
      onSaved?.(created);
    } catch {
      /* the hook already shows the error */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{farmer ? "Edit farmer" : "Add farmer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="f-name">Name *</Label>
            <Input id="f-name" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-phone">Phone *</Label>
            <Input id="f-phone" className="h-12 text-base" inputMode="tel" placeholder="10-digit mobile number" value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-village">Village</Label>
            <Input id="f-village" className="h-12 text-base" list="village-list" value={village} onChange={(e) => setVillage(e.target.value)}
              placeholder="Pick or type a village" autoComplete="off" />
            <datalist id="village-list">
              {villages.map((v) => <option key={v.id} value={v.name} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label>Crop</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select crop" /></SelectTrigger>
              <SelectContent>
                {FARMER_CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value={OTHER_CROP}>Other...</SelectItem>
              </SelectContent>
            </Select>
            {crop === OTHER_CROP && (
              <Input className="h-12 text-base mt-2" placeholder="Type the crop name" value={otherCrop} onChange={(e) => setOtherCrop(e.target.value)} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-12 bg-agri-green-500 hover:bg-agri-green-600" disabled={!valid || isAddingFarmer} onClick={save}>
            {farmer ? "Save" : isAddingFarmer ? "Adding..." : "Add farmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
