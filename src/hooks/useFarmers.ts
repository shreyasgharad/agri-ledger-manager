
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuth } from "./useAuth";
import { getOrgId } from "@/lib/org";

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

export const useFarmers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const orgId = getOrgId(profile?.org_id);

  const {
    data: farmers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["farmers", orgId],
    queryFn: async () => {
      const { data, error } = await db
        .from("farmers")
        .select("*, villages(name)")
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as unknown as Farmer[];
    },
  });

  // Subscribe to real-time updates
  useRealtimeSubscription({ table: "farmers", onUpdate: refetch });

  const addFarmerMutation = useMutation({
    mutationFn: async (
      input: {
        name: string;
        phone: string;
        address?: string | null;
        crop_type?: string | null;
        notes?: string | null;
        village_name?: string;
      }
    ) => {
      const { village_name, ...farmer } = input;
      let village_id: string | null = null;
      const villageName = village_name?.trim();
      if (villageName) {
        const { data: existing } = await db
          .from("villages")
          .select("id")
          .ilike("name", villageName)
          .is("deleted_at", null)
          .maybeSingle();
        if (existing) {
          village_id = existing.id;
        } else {
          const { data: created, error: villageError } = await db
            .from("villages")
            .insert([{ name: villageName, org_id: orgId }])
            .select("id")
            .single();
          if (villageError) throw villageError;
          village_id = created.id;
        }
      }
      const { data, error } = await db
        .from("farmers")
        .insert([{ ...farmer, village_id, org_id: orgId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateFarmerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Farmer> & { id: string }) => {
      const { data, error } = await db
        .from("farmers")
        .update(updates)
        .eq("id", id)
        .eq("org_id", orgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteFarmerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("farmers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("org_id", orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    farmers,
    isLoading,
    error,
    refetch,
    addFarmer: addFarmerMutation.mutate,
    updateFarmer: updateFarmerMutation.mutate,
    deleteFarmer: deleteFarmerMutation.mutate,
    isAddingFarmer: addFarmerMutation.isPending,
    isUpdatingFarmer: updateFarmerMutation.isPending,
    isDeletingFarmer: deleteFarmerMutation.isPending,
  };
};
