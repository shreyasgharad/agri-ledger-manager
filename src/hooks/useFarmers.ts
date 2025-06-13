
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuth } from "./useAuth";

export interface Farmer {
  id: string;
  org_id: string;
  name: string;
  phone: string;
  address: string | null;
  crop_type: string | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}

export const useFarmers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  const {
    data: farmers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Farmer[];
    },
    enabled: !!profile?.org_id,
  });

  // Subscribe to real-time updates
  useRealtimeSubscription({ table: 'farmers', onUpdate: refetch });

  const addFarmerMutation = useMutation({
    mutationFn: async (farmer: Omit<Farmer, "id" | "created_at" | "updated_at" | "balance" | "org_id">) => {
      if (!profile?.org_id) throw new Error("Organization ID not found");
      
      const { data, error } = await supabase
        .from("farmers")
        .insert([{ 
          ...farmer,
          org_id: profile.org_id
        }])
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
      const { data, error } = await supabase
        .from("farmers")
        .update(updates)
        .eq("id", id)
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
      const { error } = await supabase
        .from("farmers")
        .delete()
        .eq("id", id);
      
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
