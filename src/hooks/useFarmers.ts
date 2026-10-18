import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { DEFAULT_ORG_ID } from "@/lib/org";

export interface Farmer {
  id: string;
  org_id: string;
  name: string;
  phone: string;
  address: string | null;
  crop_type: string | null;
  code: string | null;
  notes: string | null;
  village_id: string | null;
  is_active: boolean;
  villages?: { name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerInput {
  name: string;
  phone: string;
  village_name?: string;
  crop_type?: string | null;
}

const orgId = DEFAULT_ORG_ID;

/** Finds the village by name (case-insensitive) or creates it. */
async function resolveVillageId(name: string | undefined): Promise<string | null> {
  const clean = name?.trim();
  if (!clean) return null;
  const { data: existing } = await db.from("villages").select("id").ilike("name", clean).is("deleted_at", null).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await db.from("villages").insert([{ name: clean, org_id: orgId }]).select("id").single();
  if (error) throw error;
  return created.id;
}

export const useFarmers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: farmers = [], isLoading, error, refetch } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("farmers")
        .select("*, villages(name)")
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Farmer[];
    },
  });

  useRealtimeSubscription({ table: "farmers", onUpdate: refetch });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["farmers"] });
    queryClient.invalidateQueries({ queryKey: ["farmer-overview"] });
    queryClient.invalidateQueries({ queryKey: ["villages"] });
  };
  const fail = (what: string) => (e: Error) =>
    toast({ title: "Error", description: `Failed to ${what}: ${e.message}`, variant: "destructive" });

  const addFarmerMutation = useMutation({
    mutationFn: async (input: FarmerInput) => {
      const { village_name, ...rest } = input;
      const village_id = await resolveVillageId(village_name);
      const { data, error } = await db
        .from("farmers")
        .insert([{ ...rest, village_id, org_id: orgId }])
        .select("*, villages(name)")
        .single();
      if (error) throw error;
      return data as Farmer;
    },
    onSuccess: (farmer) => {
      refresh();
      toast({ title: "Farmer added", description: `${farmer.name} · ID ${farmer.code}` });
    },
    onError: fail("add farmer"),
  });

  const updateFarmerMutation = useMutation({
    mutationFn: async ({ id, village_name, ...rest }: Partial<FarmerInput> & { id: string; is_active?: boolean }) => {
      const updates: Record<string, unknown> = { ...rest };
      if (village_name !== undefined) updates.village_id = await resolveVillageId(village_name);
      const { data, error } = await db.from("farmers").update(updates).eq("id", id).eq("org_id", orgId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["farmer-ledger"] });
      toast({ title: "Farmer updated" });
    },
    onError: fail("update farmer"),
  });

  const deleteFarmerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("farmers").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("org_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Farmer removed" });
    },
    onError: fail("delete farmer"),
  });

  return {
    farmers,
    isLoading,
    error,
    refetch,
    addFarmer: addFarmerMutation.mutateAsync,
    updateFarmer: updateFarmerMutation.mutate,
    deleteFarmer: deleteFarmerMutation.mutate,
    isAddingFarmer: addFarmerMutation.isPending,
    isUpdatingFarmer: updateFarmerMutation.isPending,
  };
};
