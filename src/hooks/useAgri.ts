import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ORG_ID } from "@/lib/org";
import type {
  Advance, AdvanceType, BagType, Balance, FarmerOverview, FarmerPnl, UserProfile, AppRole, Bid, Bill, BusinessSettings, Buyer, Crop,
  Lot, LotBag, LotTotals, Payment, PaymentMethod, Sale, Village,
} from "@/types/agri";

const num = (v: unknown) => Number(v ?? 0);

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Runs a mutation, toasts the outcome, and refreshes every cached list. */
function useAgriMutation<TVars, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  successMessage?: string
) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries();
      if (successMessage) toast({ title: successMessage });
    },
    onError: (e: Error) => toast({ title: "Something went wrong", description: e.message, variant: "destructive" }),
  });
}

// ---------------------------------------------------------------- masters
export const useCrops = () =>
  useQuery({
    queryKey: ["crops"],
    queryFn: async () => unwrap(await db.from("crops").select("*").is("deleted_at", null).order("name")) as Crop[],
  });

export const useBagTypes = () =>
  useQuery({
    queryKey: ["bag_types"],
    queryFn: async () => unwrap(await db.from("bag_types").select("*").is("deleted_at", null).order("name")) as BagType[],
  });

export const useVillages = () =>
  useQuery({
    queryKey: ["villages"],
    queryFn: async () => unwrap(await db.from("villages").select("*").is("deleted_at", null).order("name")) as Village[],
  });

export const useBuyers = () => {
  const query = useQuery({
    queryKey: ["buyers"],
    queryFn: async () => unwrap(await db.from("buyers").select("*").is("deleted_at", null).order("name")) as Buyer[],
  });
  const balances = useQuery({
    queryKey: ["buyer_balances"],
    queryFn: async () => {
      const rows = unwrap(await db.from("buyer_balances").select("*")) as (Balance & { buyer_id: string })[];
      return Object.fromEntries(rows.map((r) => [r.buyer_id, { billed: num(r.billed), paid: num(r.paid), due: num(r.due) }]));
    },
  });
  const addBuyer = useAgriMutation(
    async (b: { name: string; firm_name?: string; phone?: string; address?: string }) =>
      unwrap(await db.from("buyers").insert([{ ...b, org_id: DEFAULT_ORG_ID }]).select().single()),
    "Buyer added"
  );
  return { buyers: query.data ?? [], isLoading: query.isLoading, balances: balances.data ?? {}, addBuyer: addBuyer.mutate, addBuyerAsync: addBuyer.mutateAsync, isAdding: addBuyer.isPending };
};

// ------------------------------------------------------------------- lots
export const useLots = () => {
  const query = useQuery({
    queryKey: ["lots"],
    queryFn: async () => {
      const lots = unwrap(
        await db.from("lots").select("*, farmers(name, code, phone), crops(name)").is("deleted_at", null)
          .order("lot_date", { ascending: false }).order("created_at", { ascending: false }).limit(200)
      ) as Lot[];
      const totals = unwrap(await db.from("lot_totals").select("*")) as LotTotals[];
      const byLot = new Map(totals.map((t) => [t.lot_id, t]));
      return lots.map((l) => ({
        ...l,
        totals: { bag_count: num(byLot.get(l.id)?.bag_count), total_kg: num(byLot.get(l.id)?.total_kg) },
      }));
    },
  });
  const createLot = useAgriMutation(
    async (v: { farmer_id: string; crop_id: string; lot_date?: string; notes?: string }) =>
      unwrap(await db.from("lots").insert([{ ...v, org_id: DEFAULT_ORG_ID }]).select().single()) as Lot
  );
  return { lots: query.data ?? [], isLoading: query.isLoading, createLot: createLot.mutateAsync, isCreating: createLot.isPending };
};

export const useLot = (lotId: string | undefined) => {
  const query = useQuery({
    queryKey: ["lot", lotId],
    enabled: !!lotId,
    queryFn: async () => {
      const lot = unwrap(
        await db.from("lots").select("*, farmers(name, code, phone), crops(name)").eq("id", lotId).single()
      ) as Lot;
      const bags = unwrap(
        await db.from("lot_bags").select("*, bag_types(name)").eq("lot_id", lotId).is("deleted_at", null).order("seq")
      ) as LotBag[];
      const bids = unwrap(
        await db.from("bids").select("*, buyers(name, code, firm_name)").eq("lot_id", lotId).is("deleted_at", null)
          .order("rate_per_quintal", { ascending: false })
      ) as Bid[];
      const sale = (await db.from("sales").select("*").eq("lot_id", lotId).maybeSingle()).data as Sale | null;
      const advances = unwrap(
        await db.from("advances").select("*").eq("farmer_id", lot.farmer_id).is("settled_bill_id", null).is("deleted_at", null)
          .order("advance_date")
      ) as Advance[];
      const bills = sale
        ? (unwrap(await db.from("bills").select("id, number, party_type, net_amount").eq("sale_id", sale.id)) as Pick<Bill, "id" | "number" | "party_type" | "net_amount">[])
        : [];
      const totalKg = bags.reduce((s, b) => s + num(b.weight_kg), 0);
      return { lot, bags, bids, sale, advances, bills, totals: { bag_count: bags.length, total_kg: Math.round(totalKg * 1000) / 1000 } };
    },
  });

  const addBag = useAgriMutation(async (v: { weight_kg: number; bag_type_id: string | null; seq: number }) =>
    unwrap(await db.from("lot_bags").insert([{ ...v, lot_id: lotId, org_id: DEFAULT_ORG_ID }]).select().single()));
  const deleteBag = useAgriMutation(async (id: string) => unwrap(await db.from("lot_bags").delete().eq("id", id)));
  const addBid = useAgriMutation(async (v: { buyer_id: string; rate_per_quintal: number }) =>
    unwrap(await db.from("bids").insert([{ ...v, lot_id: lotId, org_id: DEFAULT_ORG_ID }]).select().single()));
  const deleteBid = useAgriMutation(async (id: string) => unwrap(await db.from("bids").delete().eq("id", id)));
  const confirmSale = useAgriMutation(
    async (bidId: string) => unwrap(await db.rpc("confirm_sale", { p_lot_id: lotId, p_bid_id: bidId })),
    "Sale confirmed"
  );
  const cancelLot = useAgriMutation<void>(
    async () => unwrap(await db.from("lots").update({ status: "cancelled" }).eq("id", lotId)),
    "Lot cancelled"
  );
  const issueBills = useAgriMutation(
    async (v: { sale_id: string; farmer_pct: number; buyer_pct: number; advance_ids: string[] }) => {
      const rows = unwrap(
        await db.rpc("issue_bills", { p_sale_id: v.sale_id, p_farmer_pct: v.farmer_pct, p_buyer_pct: v.buyer_pct, p_advance_ids: v.advance_ids })
      ) as { farmer_bill_id: string; buyer_bill_id: string }[];
      return rows[0];
    },
    "Bills issued"
  );

  return {
    data: query.data, isLoading: query.isLoading, error: query.error,
    addBag: addBag.mutate, deleteBag: deleteBag.mutate,
    addBid: addBid.mutate, deleteBid: deleteBid.mutate,
    confirmSale: confirmSale.mutate, cancelLot: cancelLot.mutate,
    issueBills: issueBills.mutateAsync, isIssuing: issueBills.isPending,
  };
};

// --------------------------------------------------------------- advances
export interface NewAdvance {
  farmer_id: string;
  type: AdvanceType;
  amount: number;
  reason?: string;
  advance_date?: string;
  due_date?: string | null;
  bag_type_id?: string | null;
  qty?: number | null;
}

export const useAdvances = () => {
  const query = useQuery({
    queryKey: ["advances"],
    queryFn: async () =>
      unwrap(
        await db.from("advances").select("*, farmers(name, code), bag_types(name)").is("deleted_at", null)
          .order("advance_date", { ascending: false }).order("created_at", { ascending: false }).limit(1000)
      ) as Advance[],
  });
  const addAdvance = useAgriMutation(
    async (v: NewAdvance) =>
      unwrap(await db.from("advances").insert([{ ...v, org_id: DEFAULT_ORG_ID }]).select().single()),
    "Advance recorded"
  );
  const markRepaid = useAgriMutation(
    async (v: { id: string; method: PaymentMethod }) =>
      unwrap(await db.rpc("mark_advance_repaid", { p_advance_id: v.id, p_method: v.method })),
    "Marked as repaid"
  );
  const updateAdvance = useAgriMutation(
    async (v: { id: string; amount: number; reason?: string | null; due_date?: string | null }) => {
      const { id, ...rest } = v;
      return unwrap(await db.from("advances").update(rest).eq("id", id).select().single());
    },
    "Advance updated"
  );
  const removeAdvance = useAgriMutation(
    async (id: string) => unwrap(await db.from("advances").update({ deleted_at: new Date().toISOString() }).eq("id", id)),
    "Advance removed"
  );
  return {
    advances: query.data ?? [],
    isLoading: query.isLoading,
    addAdvance: addAdvance.mutate,
    isAdding: addAdvance.isPending,
    markRepaid: markRepaid.mutate,
    updateAdvance: updateAdvance.mutate,
    removeAdvance: removeAdvance.mutate,
  };
};

/** Open (unsettled) advances for one farmer, oldest first. */
export const useOpenAdvances = (farmerId: string | undefined) =>
  useQuery({
    queryKey: ["open-advances", farmerId],
    enabled: !!farmerId,
    queryFn: async () =>
      unwrap(
        await db.from("advances").select("*, bag_types(name)").eq("farmer_id", farmerId)
          .is("settled_bill_id", null).is("repaid_at", null).is("deleted_at", null).order("advance_date")
      ) as Advance[],
  });

// ------------------------------------------------------------------ bills
export const useBills = () =>
  useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const bills = unwrap(
        await db.from("bills").select("*, farmers(name, code, phone, address), buyers(name, code, firm_name, phone, address)")
          .is("deleted_at", null).order("issued_at", { ascending: false }).limit(300)
      ) as Bill[];
      const pays = unwrap(await db.from("payments").select("bill_id, amount").is("deleted_at", null)) as Pick<Payment, "bill_id" | "amount">[];
      const paid = new Map<string, number>();
      pays.forEach((p) => paid.set(p.bill_id, (paid.get(p.bill_id) ?? 0) + num(p.amount)));
      return bills.map((b) => ({ ...b, paid: paid.get(b.id) ?? 0 }));
    },
  });

export const useBill = (billId: string | undefined) => {
  const query = useQuery({
    queryKey: ["bill", billId],
    enabled: !!billId,
    queryFn: async () => {
      const bill = unwrap(
        await db.from("bills").select("*, farmers(name, code, phone, address), buyers(name, code, firm_name, phone, address), bill_items(*)")
          .eq("id", billId).single()
      ) as Bill;
      const payments = unwrap(await db.from("payments").select("*").eq("bill_id", billId).is("deleted_at", null).order("paid_at")) as Payment[];
      const settings = (await db.from("settings").select("*").maybeSingle()).data as BusinessSettings | null;
      const lot = (await db.from("lots").select("code, lot_date").eq("id",
        (await db.from("sales").select("lot_id").eq("id", bill.sale_id).maybeSingle()).data?.lot_id ?? "").maybeSingle()).data as
        { code: string; lot_date: string } | null;
      const paid = payments.reduce((s, p) => s + num(p.amount), 0);
      return { bill, payments, settings, lot, paid, due: Math.round((num(bill.net_amount) - paid) * 100) / 100 };
    },
  });
  const addPayment = useAgriMutation(
    async (v: { amount: number; method: PaymentMethod; reference?: string }) =>
      unwrap(await db.from("payments").insert([{ ...v, bill_id: billId, org_id: DEFAULT_ORG_ID }]).select().single()),
    "Payment recorded"
  );
  return { data: query.data, isLoading: query.isLoading, error: query.error, addPayment: addPayment.mutate, isPaying: addPayment.isPending };
};

// -------------------------------------------------------------- dashboard
export const useBrokerStats = () =>
  useQuery({
    queryKey: ["broker-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = `${today.slice(0, 7)}-01`;
      const [farmers, lots, totals, advances, bills, balances] = await Promise.all([
        db.from("farmers").select("id", { count: "exact", head: true }).is("deleted_at", null),
        db.from("lots").select("id, status").eq("lot_date", today).neq("status", "cancelled").is("deleted_at", null),
        db.from("lot_totals").select("lot_id, bag_count, total_kg"),
        db.from("farmer_advance_balance").select("unsettled_total"),
        db.from("bills").select("party_type, commission_amount, issued_at, status").gte("issued_at", monthStart).neq("status", "cancelled").is("deleted_at", null),
        db.from("farmer_balances").select("due"),
      ]);
      const todayLotIds = new Set(((lots.data ?? []) as { id: string }[]).map((l) => l.id));
      const todayTotals = ((totals.data ?? []) as LotTotals[]).filter((t) => todayLotIds.has(t.lot_id));
      const monthBills = (bills.data ?? []) as Pick<Bill, "commission_amount" | "issued_at">[];
      const todayBills = monthBills.filter((b) => b.issued_at.slice(0, 10) === today);
      const sum = (rows: { [k: string]: unknown }[], k: string) => rows.reduce((s, r) => s + num(r[k]), 0);
      return {
        totalFarmers: farmers.count ?? 0,
        lotsToday: todayLotIds.size,
        bagsToday: sum(todayTotals as never, "bag_count"),
        quintalToday: sum(todayTotals as never, "total_kg") / 100,
        commissionToday: sum(todayBills as never, "commission_amount"),
        commissionMonth: sum(monthBills as never, "commission_amount"),
        pendingAdvances: sum((advances.data ?? []) as never, "unsettled_total"),
        payableToFarmers: Math.max(0, sum((balances.data ?? []) as never, "due")),
      };
    },
  });

// --------------------------------------------------------------- settings
export const useSettings = () => {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await db.from("settings").select("*").maybeSingle()).data as BusinessSettings | null,
  });
  const save = useAgriMutation(async (v: Partial<BusinessSettings>) => {
    const { error } = await db.from("settings").upsert({ ...v, org_id: DEFAULT_ORG_ID }, { onConflict: "org_id" });
    if (error) throw new Error(error.message);
  }, "Settings saved");
  return { settings: query.data, isLoading: query.isLoading, save: save.mutate, isSaving: save.isPending };
};

// ------------------------------------------------------------ farmer ledger
export const useFarmerOverview = () =>
  useQuery({
    queryKey: ["farmer-overview"],
    queryFn: async () => {
      const rows = unwrap(await db.from("farmer_overview").select("*")) as FarmerOverview[];
      return Object.fromEntries(
        rows.map((r) => [r.farmer_id, { ...r, open_advance: num(r.open_advance), bills_due: num(r.bills_due) }])
      ) as Record<string, FarmerOverview>;
    },
  });

export const useFarmerLedger = (farmerId: string | undefined) =>
  useQuery({
    queryKey: ["farmer-ledger", farmerId],
    enabled: !!farmerId,
    queryFn: async () => {
      const farmer = unwrap(await db.from("farmers").select("*, villages(name)").eq("id", farmerId).single());
      const lots = unwrap(
        await db.from("lots").select("*, crops(name)").eq("farmer_id", farmerId).is("deleted_at", null).neq("status", "cancelled")
          .order("lot_date", { ascending: false })
      ) as Lot[];
      const totals = unwrap(await db.from("lot_totals").select("*").in("lot_id", lots.length ? lots.map((l) => l.id) : ["00000000-0000-0000-0000-000000000000"])) as LotTotals[];
      const advances = unwrap(
        await db.from("advances").select("*, bag_types(name)").eq("farmer_id", farmerId).is("deleted_at", null)
          .order("advance_date", { ascending: false })
      ) as Advance[];
      const bills = unwrap(
        await db.from("bills").select("*, buyers(name, firm_name)").eq("farmer_id", farmerId).eq("party_type", "farmer")
          .is("deleted_at", null).order("issued_at", { ascending: false })
      ) as Bill[];
      const payments = bills.length
        ? (unwrap(await db.from("payments").select("*").in("bill_id", bills.map((b) => b.id)).is("deleted_at", null).order("paid_at", { ascending: false })) as Payment[])
        : [];
      const byLot = new Map(totals.map((t) => [t.lot_id, t]));
      return {
        farmer: farmer as { id: string; code: string | null; name: string; phone: string; crop_type: string | null; village_id: string | null; is_active: boolean; villages?: { name: string } | null },
        lots: lots.map((l) => ({ ...l, bag_count: num(byLot.get(l.id)?.bag_count), total_kg: num(byLot.get(l.id)?.total_kg) })),
        advances,
        bills,
        payments,
      };
    },
  });

export const useFarmerPnl = (farmerId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ["farmer-pnl", farmerId],
    enabled: !!farmerId && enabled,
    retry: false,
    queryFn: async () => {
      const rows = unwrap(await db.rpc("farmer_pnl", { p_farmer_id: farmerId })) as FarmerPnl[];
      const r = rows[0];
      return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)])) as unknown as FarmerPnl;
    },
  });

// --------------------------------------------------------- one-step billing
export const useQuickBill = () => {
  const run = useAgriMutation(
    async (v: {
      farmer_id: string; crop_id: string; buyer_id: string; bags: number; total_kg: number; rate: number;
      farmer_pct: number; buyer_pct: number; advance_ids: string[]; bag_type_id: string | null;
    }) => {
      const rows = unwrap(
        await db.rpc("quick_bill", {
          p_farmer_id: v.farmer_id, p_crop_id: v.crop_id, p_buyer_id: v.buyer_id,
          p_bags: v.bags, p_total_kg: v.total_kg, p_rate: v.rate,
          p_farmer_pct: v.farmer_pct, p_buyer_pct: v.buyer_pct,
          p_advance_ids: v.advance_ids, p_bag_type_id: v.bag_type_id,
        })
      ) as { out_lot_id: string; out_farmer_bill: string; out_buyer_bill: string }[];
      return rows[0];
    },
    "Bills created"
  );
  return { quickBill: run.mutateAsync, isBilling: run.isPending };
};

// ----------------------------------------------------- bag prices and users
export const useBagPrices = () => {
  const bagTypes = useBagTypes();
  const save = useAgriMutation(
    async (v: { id: string; price: number }) => unwrap(await db.from("bag_types").update({ price: v.price }).eq("id", v.id)),
    "Bag price saved"
  );
  return { bagTypes: bagTypes.data ?? [], save: save.mutate };
};

export const useProfiles = (enabled: boolean) => {
  const query = useQuery({
    queryKey: ["profiles"],
    enabled,
    queryFn: async () =>
      unwrap(await db.from("profiles").select("user_id, role, email, full_name, created_at").order("created_at")) as UserProfile[],
  });
  const setRole = useAgriMutation(
    async (v: { user_id: string; role: AppRole }) => unwrap(await db.from("profiles").update({ role: v.role }).eq("user_id", v.user_id)),
    "Access updated"
  );
  return { profiles: query.data ?? [], isLoading: query.isLoading, setRole: setRole.mutate };
};
