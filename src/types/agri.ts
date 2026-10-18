export type LotStatus = "open" | "auctioned" | "billed" | "cancelled";
export type AdvanceType = "cash" | "bags" | "transport" | "labour" | "other";
export type AppRole = "admin" | "staff" | "viewer" | "pending";
export type PartyType = "farmer" | "buyer";
export type PaymentMethod = "cash" | "upi" | "bank";

export interface Village { id: string; name: string }
export interface Crop { id: string; name: string; name_local: string | null }
export interface BagType { id: string; name: string; tare_kg: number; price: number }

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
  bag_type_id: string | null;
  qty: number | null;
  due_date: string | null;
  repaid_at: string | null;
  repaid_method: PaymentMethod | null;
  farmers?: { name: string; code: string | null } | null;
  bag_types?: { name: string } | null;
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

export interface FarmerOverview {
  farmer_id: string;
  open_advance: number;
  bills_due: number;
  lot_count: number;
  bill_count: number;
  last_activity: string | null;
}

export interface FarmerPnl {
  farmer_commission: number;
  buyer_commission: number;
  total_commission: number;
  gross_traded: number;
  bills_count: number;
  open_advances: number;
  open_cash: number;
  open_bags: number;
  open_labour_transport: number;
  bills_due: number;
}

export interface UserProfile {
  user_id: string;
  role: AppRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
}
