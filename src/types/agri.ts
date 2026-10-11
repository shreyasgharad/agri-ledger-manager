export type LotStatus = "open" | "auctioned" | "billed" | "cancelled";
export type AdvanceType = "transport" | "labour" | "other";
export type PartyType = "farmer" | "buyer";
export type PaymentMethod = "cash" | "upi" | "bank";

export interface Village { id: string; name: string }
export interface Crop { id: string; name: string; name_local: string | null }
export interface BagType { id: string; name: string; tare_kg: number }

export interface Farmer {
  id: string;
  code: string | null;
  name: string;
  phone: string;
  address: string | null;
  crop_type: string | null;
  notes: string | null;
  village_id: string | null;
  is_active: boolean;
  villages?: { name: string } | null;
}

export interface Buyer {
  id: string;
  code: string;
  name: string;
  firm_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
}

export interface Lot {
  id: string;
  code: string;
  farmer_id: string;
  crop_id: string;
  lot_date: string;
  status: LotStatus;
  notes: string | null;
  created_at: string;
  farmers?: { name: string; code: string | null; phone: string } | null;
  crops?: { name: string } | null;
}

export interface LotTotals { lot_id: string; bag_count: number; total_kg: number; total_quintal: number }
export interface LotBag { id: string; lot_id: string; bag_type_id: string | null; weight_kg: number; seq: number; bag_types?: { name: string } | null }
export interface Bid { id: string; lot_id: string; buyer_id: string; rate_per_quintal: number; placed_at: string; buyers?: { name: string; code: string; firm_name: string | null } | null }
export interface Sale { id: string; lot_id: string; buyer_id: string; rate_per_quintal: number; total_kg: number; gross_amount: number; sale_date: string }

export interface Advance {
  id: string;
  farmer_id: string;
  type: AdvanceType;
  amount: number;
  reason: string | null;
  advance_date: string;
  settled_bill_id: string | null;
  farmers?: { name: string; code: string | null } | null;
}

export interface BillItem { id: string; description: string; qty_bags: number | null; weight_kg: number | null; rate: number | null; amount: number }
export interface Bill {
  id: string;
  number: string;
  party_type: PartyType;
  sale_id: string;
  farmer_id: string | null;
  buyer_id: string | null;
  rate_per_quintal: number;
  total_kg: number;
  gross_amount: number;
  commission_pct: number;
  commission_amount: number;
  advances_deducted: number;
  net_amount: number;
  status: "draft" | "issued" | "paid" | "cancelled";
  issued_at: string;
  farmers?: { name: string; code: string | null; phone: string; address: string | null } | null;
  buyers?: { name: string; code: string; firm_name: string | null; phone: string | null; address: string | null } | null;
  bill_items?: BillItem[];
}

export interface Payment { id: string; bill_id: string; amount: number; method: PaymentMethod; paid_at: string; reference: string | null }
export interface Balance { billed: number; paid: number; due: number }

export interface BusinessSettings {
  business_name: string;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  bill_footer: string | null;
  default_farmer_commission: number;
  default_buyer_commission: number;
}
